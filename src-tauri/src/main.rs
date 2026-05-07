#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod crypto;
mod chat;

use db::ConversationInfo;
use crypto::EncryptedData;
use chat::ChatRequest;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;

struct AppState {
    password: Mutex<Option<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SaveConversationRequest {
    id: String,
    messages: Vec<Message>,
    preview: String,
}

#[tauri::command]
fn set_password(state: State<AppState>, password: String) -> Result<(), String> {
    *state.password.lock().unwrap() = Some(password);
    Ok(())
}

#[tauri::command]
fn has_password() -> bool {
    db::get_db_path().exists()
}

#[tauri::command]
fn save_conversation(
    state: State<AppState>,
    request: SaveConversationRequest,
) -> Result<String, String> {
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or("No password set")?;

    let messages_json = serde_json::to_string(&request.messages).map_err(|e| e.to_string())?;

    let encrypted_data = crypto::encrypt_string(&messages_json, password);
    let encrypted_preview = crypto::encrypt_with_existing_salt(
        &request.preview,
        password,
        &encrypted_data.salt,
    );

    db::save_conversation(
        &request.id,
        &encrypted_data.ciphertext,
        Some(&encrypted_preview.ciphertext),
        &encrypted_data.salt,
        &encrypted_data.iv,
        &encrypted_data.tag,
    )
    .map_err(|e| e.to_string())?;

    Ok(request.id)
}

#[tauri::command]
fn load_conversation(
    state: State<AppState>,
    id: String,
) -> Result<Vec<Message>, String> {
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or("No password set")?;

    let (encrypted_data, salt, iv, tag) = db::load_conversation(&id).map_err(|e| e.to_string())?;

    let encrypted = EncryptedData {
        ciphertext: encrypted_data,
        iv,
        salt,
        tag,
    };

    let decrypted = crypto::decrypt_string(&encrypted, password)?;
    let messages: Vec<Message> = serde_json::from_str(&decrypted).map_err(|e| e.to_string())?;

    Ok(messages)
}

#[tauri::command]
fn list_conversations(state: State<AppState>) -> Result<Vec<ConversationInfo>, String> {
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or("No password set")?;

    let rows = db::list_conversations().map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for (id, created_at, encrypted_preview_opt, salt, iv, tag) in rows {
        let preview = if let Some(encrypted_preview) = encrypted_preview_opt {
            let encrypted = EncryptedData {
                ciphertext: encrypted_preview,
                iv,
                salt,
                tag,
            };
            crypto::decrypt_string(&encrypted, password).unwrap_or_else(|_| "Error".to_string())
        } else {
            "Empty".to_string()
        };

        result.push(ConversationInfo {
            id,
            createdAt: created_at,
            preview,
        });
    }

    Ok(result)
}

#[tauri::command]
fn delete_conversation(id: String) -> Result<(), String> {
    db::delete_conversation(&id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_all_conversations() -> Result<(), String> {
    db::delete_all_conversations().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_db_path_string() -> String {
    db::get_db_path().to_string_lossy().to_string()
}

#[tauri::command]
fn chat_completion(request: ChatRequest) -> Result<String, String> {
    chat::stream_chat_completion_blocking(request)
}

fn main() {
    db::init_db().expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState {
            password: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            set_password,
            has_password,
            save_conversation,
            load_conversation,
            list_conversations,
            delete_conversation,
            delete_all_conversations,
            get_db_path_string,
            chat_completion,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
