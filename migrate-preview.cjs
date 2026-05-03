const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

try {
  const columns = db.pragma('table_info(Conversation)');
  const columnNames = columns.map(c => c.name);

  const newColumns = [
    'previewCiphertext',
    'previewIv',
    'previewAuthTag',
    'previewSalt'
  ];

  for (const col of newColumns) {
    if (!columnNames.includes(col)) {
      db.exec(`ALTER TABLE Conversation ADD COLUMN ${col} BLOB`);
      console.log('Added column:', col);
    } else {
      console.log('Column already exists:', col);
    }
  }

  console.log('Migration completed successfully');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  db.close();
}
