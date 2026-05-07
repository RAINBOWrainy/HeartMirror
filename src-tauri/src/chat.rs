use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::runtime::Runtime;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub messages: Vec<Message>,
    pub api_key: String,
    pub provider: String,
    pub base_url: String,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenAIRequestMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenAIRequest {
    pub model: String,
    pub messages: Vec<OpenAIRequestMessage>,
    pub stream: bool,
}

pub async fn stream_chat_completion(request: ChatRequest) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let openai_messages: Vec<OpenAIRequestMessage> = request
        .messages
        .iter()
        .map(|m| OpenAIRequestMessage {
            role: m.role.clone(),
            content: m.content.clone(),
        })
        .collect();

    let openai_request = OpenAIRequest {
        model: request.model,
        messages: openai_messages,
        stream: false, // Non-streaming for simplicity in Tauri MVP
    };

    let response = client
        .post(&format!("{}/chat/completions", request.base_url.trim_end_matches('/')))
        .header("Authorization", format!("Bearer {}", request.api_key))
        .header("Content-Type", "application/json")
        .json(&openai_request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API Error ({}): {}", status, error_text));
    }

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    let content = json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "No content in response".to_string())?;

    Ok(content.to_string())
}

pub fn stream_chat_completion_blocking(request: ChatRequest) -> Result<String, String> {
    let rt = Runtime::new().map_err(|e| e.to_string())?;
    rt.block_on(stream_chat_completion(request))
}
