const fs = require('fs');
const path = require('path');

const mode = process.env.DEPLOY_MODE || 'local';
const sourcePath = path.join(__dirname, '..', 'prisma', `schema-${mode}.prisma`);
const destPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied prisma/schema-${mode}.prisma to prisma/schema.prisma`);
} catch (err) {
  console.error(`Failed to copy prisma schema: ${err.message}`);
  process.exit(1);
}
