use rusqlite::{params, Connection, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use directories_next::ProjectDirs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Conversation {
    pub id: String,
    pub created_at: String,
    pub messages: Vec<Message>,
    pub preview: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConversationInfo {
    pub id: String,
    pub createdAt: String,
    pub preview: String,
}

pub fn get_db_path() -> PathBuf {
    let proj_dirs = ProjectDirs::from("com", "HeartMirror", "HeartMirror")
        .expect("Failed to get project directories");
    let data_dir = proj_dirs.data_dir();
    std::fs::create_dir_all(data_dir).ok();
    data_dir.join("heartmirror.db")
}

pub fn init_db() -> Result<()> {
    let conn = Connection::open(get_db_path())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            encrypted_data TEXT NOT NULL,
            encrypted_preview TEXT,
            salt TEXT NOT NULL,
            iv TEXT NOT NULL,
            tag TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

pub fn save_conversation(
    id: &str,
    encrypted_data: &str,
    encrypted_preview: Option<&str>,
    salt: &str,
    iv: &str,
    tag: &str,
) -> Result<()> {
    let conn = Connection::open(get_db_path())?;
    let now: DateTime<Utc> = Utc::now();

    conn.execute(
        "INSERT OR REPLACE INTO conversations
         (id, created_at, encrypted_data, encrypted_preview, salt, iv, tag)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        params![
            id,
            now.to_rfc3339(),
            encrypted_data,
            encrypted_preview,
            salt,
            iv,
            tag
        ],
    )?;

    Ok(())
}

pub fn load_conversation(id: &str) -> Result<(String, String, String, String)> {
    let conn = Connection::open(get_db_path())?;

    let mut stmt = conn.prepare(
        "SELECT encrypted_data, salt, iv, tag FROM conversations WHERE id = ?"
    )?;

    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        Ok((
            row.get(0)?,
            row.get(1)?,
            row.get(2)?,
            row.get(3)?,
        ))
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn list_conversations() -> Result<Vec<(String, String, Option<String>, String, String, String)>> {
    let conn = Connection::open(get_db_path())?;

    let mut stmt = conn.prepare(
        "SELECT id, created_at, encrypted_preview, salt, iv, tag
         FROM conversations
         ORDER BY created_at DESC"
    )?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get(0)?,
            row.get(1)?,
            row.get(2)?,
            row.get(3)?,
            row.get(4)?,
            row.get(5)?,
        ))
    })?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }

    Ok(result)
}

pub fn delete_conversation(id: &str) -> Result<()> {
    let conn = Connection::open(get_db_path())?;
    conn.execute("DELETE FROM conversations WHERE id = ?", params![id])?;
    Ok(())
}

pub fn delete_all_conversations() -> Result<()> {
    let conn = Connection::open(get_db_path())?;
    conn.execute("DELETE FROM conversations", [])?;
    Ok(())
}
