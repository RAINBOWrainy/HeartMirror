use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce, Key,
};
use pbkdf2::pbkdf2_hmac;
use sha2::Sha256;
use rand::RngCore;
use serde::{Deserialize, Serialize};

const ITERATIONS: u32 = 100_000;
const NONCE_SIZE: usize = 12;
const KEY_SIZE: usize = 32;
const SALT_SIZE: usize = 16;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EncryptedData {
    pub ciphertext: String,
    pub iv: String,
    pub salt: String,
    pub tag: String,
}

pub fn derive_key(password: &str, salt: &[u8]) -> [u8; KEY_SIZE] {
    let mut key = [0u8; KEY_SIZE];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, ITERATIONS, &mut key);
    key
}

pub fn encrypt_string(plaintext: &str, password: &str) -> EncryptedData {
    let mut salt = [0u8; SALT_SIZE];
    OsRng.fill_bytes(&mut salt);

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);

    let key = derive_key(password, &salt);
    let key = Key::<Aes256Gcm>::from_slice(&key);
    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext_with_tag = cipher.encrypt(nonce, plaintext.as_bytes()).unwrap();

    let tag_start = ciphertext_with_tag.len() - 16;
    let (ciphertext_bytes, tag_bytes) = ciphertext_with_tag.split_at(tag_start);

    EncryptedData {
        ciphertext: hex::encode(ciphertext_bytes),
        iv: hex::encode(nonce_bytes),
        salt: hex::encode(salt),
        tag: hex::encode(tag_bytes),
    }
}

pub fn decrypt_string(encrypted: &EncryptedData, password: &str) -> Result<String, String> {
    let salt = hex::decode(&encrypted.salt).map_err(|e| e.to_string())?;
    let nonce_bytes = hex::decode(&encrypted.iv).map_err(|e| e.to_string())?;
    let ciphertext_bytes = hex::decode(&encrypted.ciphertext).map_err(|e| e.to_string())?;
    let tag_bytes = hex::decode(&encrypted.tag).map_err(|e| e.to_string())?;

    let key = derive_key(password, &salt);
    let key = Key::<Aes256Gcm>::from_slice(&key);
    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(&nonce_bytes);

    let mut ciphertext_with_tag = ciphertext_bytes.clone();
    ciphertext_with_tag.extend_from_slice(&tag_bytes);

    match cipher.decrypt(nonce, &ciphertext_with_tag[..]) {
        Ok(plaintext_bytes) => String::from_utf8(plaintext_bytes).map_err(|e| e.to_string()),
        Err(_) => Err("Decryption failed - wrong password or corrupted data".to_string()),
    }
}

pub fn encrypt_with_existing_salt(plaintext: &str, password: &str, salt_hex: &str) -> EncryptedData {
    let salt = hex::decode(salt_hex).unwrap();

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);

    let key = derive_key(password, &salt);
    let key = Key::<Aes256Gcm>::from_slice(&key);
    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext_with_tag = cipher.encrypt(nonce, plaintext.as_bytes()).unwrap();

    let tag_start = ciphertext_with_tag.len() - 16;
    let (ciphertext_bytes, tag_bytes) = ciphertext_with_tag.split_at(tag_start);

    EncryptedData {
        ciphertext: hex::encode(ciphertext_bytes),
        iv: hex::encode(nonce_bytes),
        salt: salt_hex.to_string(),
        tag: hex::encode(tag_bytes),
    }
}
