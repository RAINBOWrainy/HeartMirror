// Local mode database client - runs in browser (client-side)
// All encryption/decryption happens here - password never leaves the browser
import type { Message } from '@/features/ai/shared/types';
import { encryptJson, decryptJson, type EncryptedData } from './shared/encryption';

export interface ConversationInfo {
  id: string;
  createdAt: Date;
  preview: string; // First few characters of first message for sidebar display
}

export interface ConversationListResponse {
  conversations: ConversationInfo[];
}

/**
 * List all conversations from the server
 */
export async function listConversations(password: string): Promise<ConversationInfo[]> {
  const response = await fetch('/api/conversations/list', {
    method: 'GET',
  });
  const data = await response.json() as ConversationListResponse;

  // We need to decrypt each conversation to get the preview
  // This is acceptable because we only decrypt the content once when listing
  const result: ConversationInfo[] = [];

  for (const conv of data.conversations) {
    try {
      // We need to get the full conversation with encrypted content to get preview
      const fullConv = await loadConversation(conv.id, password);
      const firstMessage = fullConv[0]?.content || '';
      const preview = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
      result.push({
        ...conv,
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

  const data = await response.json() as {
    encryptedContent: string; // base64
    iv: string; // base64
    authTag: string; // base64
  };

  const encryptedData: EncryptedData = {
    ciphertext: Buffer.from(data.encryptedContent, 'base64'),
    iv: Buffer.from(data.iv, 'base64'),
    salt: Buffer.from(id, 'hex'), // Use conversation ID as salt (unique per conversation)
    tag: Buffer.from(data.authTag, 'base64'),
  };

  return decryptJson<Message[]>(encryptedData, password);
}

/**
 * Save a conversation - encrypts on client, sends encrypted data to server
 * Creates a new conversation if no ID is provided
 */
export async function saveConversation(
  messages: Message[],
  password: string,
  existingId?: string
): Promise<string> {
  const id = existingId || crypto.randomUUID();
  const encryptedData = encryptJson<Message[]>(messages, password);

  await fetch('/api/conversations/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      encryptedContent: encryptedData.ciphertext.toString('base64'),
      iv: encryptedData.iv.toString('base64'),
      authTag: encryptedData.tag.toString('base64'),
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
