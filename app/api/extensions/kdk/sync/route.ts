import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function mapFilingStatus(status: string | undefined | null) {
  const s = (status || "").toLowerCase();
  if (s.includes("filed") || s.includes("verified") || s.includes("processed")) return "FILED";
  if (s.includes("pending") || s.includes("prepare") || s.includes("draft")) return "PENDING";
  return "IN_PROGRESS";
}

// Add an endpoint to receive KDK sync data
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-kdk-auth") || "";
    const expectedToken = process.env.KDK_SYNC_TOKEN || "";
    if (!expectedToken || authHeader !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("Received KDK sync data:", payload);

    // Handle TAN/PTDS data
    if (payload.source === 'kdk_extension_dom_tan_ptds') {
      const sourceType = payload.page.includes('/tan') ? 'TAN' : 'PTDS';
      let upsertCount = 0;

      for (const record of payload.records) {
        const [day, month, year] = record.receiptDate.split('/');
        const receiptDate = new Date(`${year}-${month}-${day}`);

        await prisma.tanPtdsApplication.upsert({
          where: { acknowledgmentNo: record.acknowledgmentNo },
          update: {
            receiptDate: receiptDate,
            tan: record.tan,
            category: record.category,
            applicantName: record.applicantName,
            applicationType: record.applicationType,
            changesRequested: record.changesRequested,
            userId: record.userId,
            feesCharged: record.feesCharged,
            sourceType: sourceType,
          },
          create: {
            acknowledgmentNo: record.acknowledgmentNo,
            receiptDate: receiptDate,
            tan: record.tan,
            category: record.category,
            applicantName: record.applicantName,
            applicationType: record.applicationType,
            changesRequested: record.changesRequested,
            userId: record.userId,
            feesCharged: record.feesCharged,
            sourceType: sourceType,
          },
        });
        upsertCount++;
      }
      return NextResponse.json({
        success: true,
        message: `Successfully upserted ${upsertCount} ${sourceType} records.`,
      });
    }

    // Handle PAAM data
    if (payload.source === 'kdk_extension_dom_paam') {
      let upsertCount = 0;
      for (const record of payload.records) {
        const [day, month, year] = record.date.split('/');
        const applicationDate = new Date(`${year}-${month}-${day}`);

        await prisma.panApplication.upsert({
          where: { ackNo: record.ackNo },
          update: {
            couponNo: record.couponNo,
            name: record.name,
            applicationType: record.applicationType,
            date: applicationDate,
            status: record.status,
            pan: record.pan,
            modeOfSubmission: record.modeOfSubmission,
          },
          create: {
            ackNo: record.ackNo,
            couponNo: record.couponNo,
            name: record.name,
            applicationType: record.applicationType,
            date: applicationDate,
            status: record.status,
            pan: record.pan,
            modeOfSubmission: record.modeOfSubmission,
          },
        });
        upsertCount++;
      }
      return NextResponse.json({
        success: true,
        message: `Successfully upserted ${upsertCount} PAN application records.`,
      });
    }

    // Original ITR handling logic
    const sourceOk = typeof payload.source === "string" && (payload.source.startsWith("kdk_extension_api") || payload.source.startsWith("kdk_extension_dom"));
    if (!sourceOk || !payload.client || !Array.isArray(payload.returns)) {
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }

    const { client: kdkClient, returns, assessee_id } = payload;
    const { name, pan, client_type } = kdkClient;

    if (!pan) {
      return NextResponse.json({ error: "PAN is required" }, { status: 400 });
    }

    // 1. Find or create the Client based on PAN
    let client = await prisma.client.findFirst({
      where: { panId: pan },
    });

    if (!client) {
      // For creating a client if they don't exist:
      // Our generic Client model requires email (unique), so we use a dummy one if no real email is known
      client = await prisma.client.create({
        data: {
          type: "BUSINESS_CLIENT", // assume business or generic if from tax portal
          businessName: name, // map name to business name
          panId: pan,
          email: `${pan.toLowerCase()}@imported-kdk.local`,
          // Store assessee_id or other meta in a way safely without altering DB
          // KDK info isn't fitting perfectly in One-Time, but BUSINESS_CLIENT handles generic PAN storage
        },
      });
    }

    // Attempt to find a generic or system employee to own these records, or fallback to an existing one
    const systemEmployee = await prisma.employee.findUnique({ where : { email: "system-extension@domain.com" }}) 

    // || await prisma.employee.create({
    //   data: {
    //     name: "Extension Integration",
    //     email: "system-extension@domain.com",
    //     password: "system-generated-no-login",
    //     role: "ADMIN",
    //     active: false,
    //   }
    // });

    let syncCount = 0;

    function dateformating(dateString: string | undefined | null): Date | null {
      const [day, month, year] = dateString.split("-");
      const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
      return parsed;
    }
    // 2. Insert or update records (one per AY per client)
    for (const ret of returns) {
      const financialYear = ret.assessment_year;
      const incomingStatus = mapFilingStatus(ret.filing_status);
      const incomingFilingDate = ret.filing_date ? dateformating(ret.filing_date) : null;

      const existing = await prisma.iTRRecord.findFirst({
        where: { clientId: client.id, financialYear },
        include: { serviceRecord: true }
      });

      if (existing) {
        const statusChanged = existing.filingStatus !== incomingStatus;

        if (statusChanged) {
          await prisma.iTRRecord.update({
            where: { id: existing.id },
            data: {
              filingStatus: incomingStatus,
              filingDate: incomingFilingDate,
              itrForm: ret.itr_form,
              grossTotalIncome: ret.total_income,
              totalTaxableIncome: ret.total_income,
              totalTaxPayable: ret.tax_paid,
              sourceExtension: "kdk_extension",
              fetchedAt: new Date(),
              rawData: ret
            }
          });

          await prisma.serviceRecord.update({
            where: { id: existing.serviceRecordId },
            data: {
              status: incomingStatus === "FILED" ? "COMPLETED" : "IN_PROGRESS",
              completedDate: incomingFilingDate || new Date(),
              details: {
                ...ret,
                assessee_id,
                source: "kdk_extension",
                fingerprint: ret.fingerprint
              }
            }
          });

          syncCount++;
        }

        continue;
      }

      // Create new chain record for this AY
      const serviceRecord = await prisma.serviceRecord.create({
        data: {
          serviceType: "ITR",
          clientId: client.id,
          status: incomingStatus === "FILED" ? "COMPLETED" : "IN_PROGRESS",
          createdById: systemEmployee.id,
          completedDate: incomingFilingDate || new Date(),
          details: {
            ...ret,
            assessee_id,
            source: "kdk_extension",
            fingerprint: ret.fingerprint
          },
        },
      });

      await prisma.iTRRecord.create({
        data: {
          serviceRecordId: serviceRecord.id,
          clientId: client.id,
          financialYear,
          itrForm: ret.itr_form,
          grossTotalIncome: ret.total_income,
          totalTaxableIncome: ret.total_income,
          totalTaxPayable: ret.tax_paid,
          refund: null,
          sourceExtension: "kdk_extension",
          fetchedAt: new Date(),
          filingStatus: incomingStatus,
          filingDate: incomingFilingDate,
          rawData: ret
        },
      });

      syncCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncCount} records for PAN ${pan}`,
      synced: syncCount
    });

  } catch (error: any) {
    console.error("KDK Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}