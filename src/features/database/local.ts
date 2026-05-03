// Local mode database client - runs in browser (client-side)
// All encryption/decryption happens here - password never leaves the browser
import type { Message } from '@/features/ai/shared/types';
import { encryptJson, decryptJson, type EncryptedData, encrypt, decrypt } from './shared/encryption';

export interface ConversationInfo {
  id: string;
  createdAt: Date;
  preview: string; // First few characters of first message for sidebar display
}

/**
 * Encrypted preview metadata - stored separately for fast list loading
 * Avoids having to decrypt entire conversation just for sidebar previews
 */
export interface EncryptedPreview {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
  tag: string; // base64
}

/**
 * Raw conversation data from server with encrypted preview
 * encryptedPreview may be null for legacy (pre-migration) conversations
 */
interface ConversationWithPreview {
  id: string;
  createdAt: string;
  encryptedPreview: EncryptedPreview | null;
}

export interface ConversationListResponse {
  conversations: ConversationInfo[];
}

interface EncryptedConversationResponse {
  encryptedContent: string; // base64
  iv: string; // base64
  authTag: string; // base64
  salt: string; // base64
}

/**
 * Encrypt a preview string for fast list loading
 */
export function encryptPreview(preview: string, password: string): EncryptedPreview {
  const encrypted = encrypt(preview, password);
  return {
    ciphertext: encrypted.ciphertext.toString('base64'),
    iv: encrypted.iv.toString('base64'),
    salt: encrypted.salt.toString('base64'),
    tag: encrypted.tag.toString('base64'),
  };
}

/**
 * Decrypt an encrypted preview
 */
export function decryptPreview(preview: EncryptedPreview, password: string): string {
  const encryptedData: EncryptedData = {
    ciphertext: Buffer.from(preview.ciphertext, 'base64'),
    iv: Buffer.from(preview.iv, 'base64'),
    salt: Buffer.from(preview.salt, 'base64'),
    tag: Buffer.from(preview.tag, 'base64'),
  };
  return decrypt(encryptedData, password);
}

/**
 * List all conversations from the server - uses encrypted previews for performance
 */
export async function listConversations(password: string): Promise<ConversationInfo[]> {
  const response = await fetch('/api/conversations/list', {
    method: 'GET',
  });
  const data = await response.json() as { conversations: ConversationWithPreview[] };

  const result: ConversationInfo[] = [];

  for (const conv of data.conversations) {
    try {
      let preview: string;

      if (conv.encryptedPreview) {
        // Fast path: decrypt only the tiny preview instead of the entire conversation
        // This reduces decryption time from ~400ms * N to ~400ms + ~5ms * N
        preview = decryptPreview(conv.encryptedPreview, password);
      } else {
        // Slow path for legacy data (migrated conversations without previews)
        const fullConv = await loadConversation(conv.id, password);
        const firstMessage = fullConv[0]?.content || '';
        preview = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
      }

      result.push({
        id: conv.id,
        createdAt: new Date(conv.createdAt),
        preview,
      });
    } catch {
      // Skip conversations that fail decryption (wrong password or corrupted)
      continue;
    }
  }

  return result;
}

/**
 * Load a full conversation by ID - decrypts content on client
 */
export async function loadConversation(id: string, password: string): Promise<Message[]> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'GET',
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as EncryptedConversationResponse;

  const encryptedData: EncryptedData = {
    ciphertext: Buffer.from(data.encryptedContent, 'base64'),
    iv: Buffer.from(data.iv, 'base64'),
    salt: Buffer.from(data.salt, 'base64'), // Use the stored salt generated during encryption
    tag: Buffer.from(data.authTag, 'base64'),
  };

  return decryptJson<Message[]>(encryptedData, password);
}

/**
 * Save a conversation - encrypts on client, sends encrypted data to server
 * Creates a new conversation if no ID is provided
 * Also saves an encrypted preview for fast list loading
 */
export async function saveConversation(
  messages: Message[],
  password: string,
  existingId?: string
): Promise<string> {
  const id = existingId || crypto.randomUUID();
  const encryptedData = encryptJson<Message[]>(messages, password);

  // Generate encrypted preview for fast list loading
  const firstMessage = messages[0]?.content || '';
  const preview = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
  const encryptedPreview = encryptPreview(preview, password);

  await fetch('/api/conversations/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      encryptedContent: encryptedData.ciphertext.toString('base64'),
      iv: encryptedData.iv.toString('base64'),
      authTag: encryptedData.tag.toString('base64'),
      salt: encryptedData.salt.toString('base64'),
      encryptedPreview,
    }),
  });

  return id;
}

/**
 * Delete a conversation by ID
 */
export async function deleteConversation(id: string): Promise<void> {
  await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Delete all conversations
 */
export async function deleteAllConversations(): Promise<void> {
  await fetch('/api/conversations/clear-all', {
    method: 'POST',
  });
}
