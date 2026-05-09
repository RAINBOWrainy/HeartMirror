$env:DEPLOY_MODE = "cloud"
node scripts/copy-prisma-schema.cjs
npx prisma generate
npx next build