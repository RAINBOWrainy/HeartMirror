import { NextResponse } from 'next/server'

// Cloud mode only
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

export async function POST(request: Request) {
  if (!isCloudMode) {
    return NextResponse.json({ error: 'Cloud mode only' }, { status: 404 })
  }

  // Simple security: require a secret header
  const secret = request.headers.get('x-migrate-secret')
  const expectedSecret = process.env.MIGRATE_SECRET || 'heartmirror-migrate-secret'

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { execSync } = require('child_process')

    // Run Prisma migrate
    execSync('npx prisma migrate deploy --schema=prisma/schema-cloud.prisma', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DEPLOY_MODE: 'cloud',
      },
    })

    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}