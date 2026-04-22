// Create SQLite database manually
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

// Create Conversation table matching Prisma schema
db.exec(`
  CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encryptedContent" BLOB NOT NULL,
    "iv" BLOB NOT NULL,
    "authTag" BLOB NOT NULL
  )
`);

console.log('Database created successfully at prisma/dev.db');
console.log('Table "Conversation" created with correct schema');

db.close();
