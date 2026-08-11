import { prisma } from '@/lib/prisma';

/**
 * Ensures all employee accounts have at least one active EmployeeAssignment.
 * Backfills legacy service records without assignmentId to their creator's initial assignment.
 */
export async function ensureEmployeeAssignments() {
  const employees = await prisma.employee.findMany({
    include: {
      assignments: {
        orderBy: { startDate: 'asc' },
      },
    },
  });

  for (const emp of employees) {
    if (!emp.assignments || emp.assignments.length === 0) {
      // Create initial assignment for legacy account
      const initialAssignment = await prisma.employeeAssignment.create({
        data: {
          employeeId: emp.id,
          assignedName: emp.name,
          startDate: emp.createdAt || new Date('2024-01-01'),
          isCurrent: true,
          notes: 'Initial assignment',
        },
      });

      // Link existing records created by this employee that have no assignmentId
      await prisma.serviceRecord.updateMany({
        where: {
          createdById: emp.id,
          assignmentId: null,
        },
        data: {
          assignmentId: initialAssignment.id,
        },
      });
    } else {
      // Ensure there's an active assignment
      const currentActive = emp.assignments.find((a) => a.isCurrent);
      if (!currentActive && emp.assignments.length > 0) {
        // Mark the latest assignment as active
        const latest = emp.assignments[emp.assignments.length - 1];
        await prisma.employeeAssignment.update({
          where: { id: latest.id },
          data: { isCurrent: true, endDate: null },
        });
      }
    }
  }
}

/**
 * Reassigns an Employee Account to a new Employee Name.
 * Closes the current active assignment and creates a new current assignment.
 */
export async function reassignEmployeeAccount(
  employeeId: string,
  newAssignedName: string,
  notes?: string
) {
  await ensureEmployeeAssignments();

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      assignments: {
        where: { isCurrent: true },
      },
    },
  });

  if (!employee) {
    throw new Error('Employee account not found');
  }

  const currentAssignment = employee.assignments[0];
  const now = new Date();

  const trimmedName = newAssignedName.trim();

  // 1. Close active assignment if it exists and has a different name
  if (currentAssignment) {
    if (currentAssignment.assignedName === trimmedName) {
      if (notes !== undefined) {
        await prisma.employeeAssignment.update({
          where: { id: currentAssignment.id },
          data: { notes: notes.trim() },
        });
      }
      return prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          assignments: {
            orderBy: { startDate: 'desc' },
          },
        },
      });
    }

    await prisma.employeeAssignment.update({
      where: { id: currentAssignment.id },
      data: {
        isCurrent: false,
        endDate: now,
      },
    });
  }

  // 2. Create new active assignment
  await prisma.employeeAssignment.create({
    data: {
      employeeId,
      assignedName: trimmedName,
      startDate: now,
      isCurrent: true,
      notes: notes?.trim() || null,
    },
  });

  // 3. Update current employee name on account
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      name: trimmedName,
    },
  });

  return prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      assignments: {
        orderBy: { startDate: 'desc' },
      },
    },
  });
}

/**
 * Helper to resolve the active assignment ID for a creating employee.
 */
export async function getActiveAssignmentIdForEmployee(employeeId: string): Promise<string> {
  let assignment = await prisma.employeeAssignment.findFirst({
    where: {
      employeeId,
      isCurrent: true,
    },
  });

  if (!assignment) {
    await ensureEmployeeAssignments();
    assignment = await prisma.employeeAssignment.findFirst({
      where: {
        employeeId,
        isCurrent: true,
      },
    });
  }

  if (!assignment) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    const newAssignment = await prisma.employeeAssignment.create({
      data: {
        employeeId,
        assignedName: emp?.name || 'Employee',
        startDate: new Date(),
        isCurrent: true,
      },
    });
    return newAssignment.id;
  }

  return assignment.id;
}
