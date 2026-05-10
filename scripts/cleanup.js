const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const docsDir = path.join(rootDir, 'docs');
const componentsDir = path.join(rootDir, 'app', 'components');
const apiDir = path.join(rootDir, 'app', 'api');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

console.log('Starting codebase cleanup...\n');

// 1. Create docs directory
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
  console.log('Created docs directory');
}

// 2. Move .md files
const mdFiles = [
  'BACKEND_SETUP_GUIDE.md',
  'CA_DATA_MODEL_DESIGN.md',
  'DATABASE_SCHEMA.md',
  'DELIVERY_SUMMARY.md',
  'IMPLEMENTATION_GUIDE.md',
  'INDEX.md',
  'QUICK_START.md',
  'README_DELIVERY.md',
  'master.md',
  'master_prompt.md'
];

mdFiles.forEach(file => {
  const oldPath = path.join(rootDir, file);
  const newPath = path.join(docsDir, file);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`[MOVE] ${file} -> docs/`);
  }
});

// 3. Remove unused components
const unusedComponents = [
  'Dashboard.jsx',
  'DashboardNew.jsx',
  'FilterBar.jsx',
  'OperationsDashboard.jsx',
  'SidebarNew.jsx'
];

unusedComponents.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[DELETE] Component: ${file}`);
  }
});

// 4. Remove unused API routes
const unusedApis = [
  'employees',
  'gst',
  'itr-imports',
  'service-records'
];

unusedApis.forEach(api => {
  const apiPath = path.join(apiDir, api);
  if (fs.existsSync(apiPath)) {
    deleteFolderRecursive(apiPath);
    console.log(`[DELETE] API Route: /api/${api}`);
  }
});

// 5. Remove unused data directory (Legacy dummy data)
const dataDir = path.join(rootDir, 'data');
if (fs.existsSync(dataDir)) {
  deleteFolderRecursive(dataDir);
  console.log('[DELETE] Directory: data/ (legacy dummy data)');
}

// 6. Remove unused lib files
const unusedLibs = [
  'store.js',
  'validation.js'
];

unusedLibs.forEach(file => {
  const filePath = path.join(rootDir, 'lib', file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[DELETE] Lib: ${file}`);
  }
});

console.log('\nCleanup complete! Your codebase is now lean and focused on the active implementation.');
