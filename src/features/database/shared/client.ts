/**
 * Database client abstraction
 * Automatically switches between Tauri Rust backend and Next.js API routes
 */

import type { Message } from '@/features/ai/shared/types';

export interface ConversationInfo {
  id: string;
  createdAt: string;
  preview: string;
  type?: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal';
}

export interface ChatRequest {
  messages: Message[];
  apiKey: string;
  provider: string;
  baseUrl: string;
  model: string;
}

interface DatabaseClient {
  listConversations(type?: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal'): Promise<ConversationInfo[]>;
  loadConversation(id: string): Promise<Message[]>;
  saveConversation(messages: Message[], password: string, existingId?: string, type?: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal'): Promise<string>;
  deleteConversation(id: string): Promise<void>;
  deleteAllConversations(): Promise<void>;
  chatCompletion(request: ChatRequest): Promise<string>;
}

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Tauri client implementation (calls Rust backend commands)
const tauriClient: DatabaseClient = {
  async listConversations(type?: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal'): Promise<ConversationInfo[]> {
    const { invoke } = await import('@tauri-apps/api/tauri');
    const all = await invoke<ConversationInfo[]>('list_conversations');
    if (!type) return all;
    return all.filter(c => c.type === type);
  },

  async loadConversation(id: string): Promise<Message[]> {
    const { invoke } = await import('@tauri-apps/api/tauri');
    return invoke('load_conversation', { id });
  },

  async saveConversation(messages: Message[], password: string, existingId?: string, type: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal' = 'chat'): Promise<string> {
    const { invoke } = await import('@tauri-apps/api/tauri');

    // Set password in Tauri state if not already set
    await invoke('set_password', { password });

    const firstMessage = messages[0]?.content || '';
    const preview = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
    const id = existingId || crypto.randomUUID();

    return invoke('save_conversation', {
      request: {
        id,
        messages,
        preview,
        type,
      },
    });
  },

  async deleteConversation(id: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/tauri');
    return invoke('delete_conversation', { id });
  },

  async deleteAllConversations(): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/tauri');
    return invoke('delete_all_conversations');
  },

  async chatCompletion(request: ChatRequest): Promise<string> {
    const { invoke } = await import('@tauri-apps/api/tauri');
    return invoke('chat_completion', {
      request: {
        messages: request.messages,
        api_key: request.apiKey,
        provider: request.provider,
        base_url: request.baseUrl,
        model: request.model,
      },
    });
  },
};

// Browser client implementation (calls Next.js API routes)
const browserClient: DatabaseClient = {
  async listConversations(type?: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal'): Promise<ConversationInfo[]> {
    const password = localStorage.getItem('heartmirror-password') || '';
    const response = await fetch('/api/conversations/list');
    const data = await response.json();

    // In browser mode, decryption happens in the client
    const { decryptPreview, decryptJson } = await import('./encryption');
    const result: ConversationInfo[] = [];

    for (const conv of data.conversations) {
      // Filter by type if specified
      const convType = conv.type || 'chat';
      if (type && convType !== type) continue;

      let preview: string;

      if (conv.encryptedPreview) {
        preview = decryptPreview(conv.encryptedPreview, password);
      } else {
        // Legacy: load full conversation to get preview
        const fullConv = await this.loadConversation(conv.id);
        const firstMessage = fullConv[0]?.content || '';
        preview = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
      }

      result.push({
        id: conv.id,
        createdAt: conv.createdAt,
        preview,
        type: convType,
      });
    }

    return result;
  },

  async loadConversation(id: string): Promise<Message[]> {
    const password = localStorage.getItem('heartmirror-password') || '';
    const response = await fetch(`/api/conversations/${id}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const { decryptJson } = await import('./encryption');

    const encryptedData = {
      ciphertext: Buffer.from(data.encryptedContent, 'base64'),
      iv: Buffer.from(data.iv, 'base64'),
      salt: Buffer.from(data.salt, 'base64'),
      tag: Buffer.from(data.authTag, 'base64'),
    };

    return decryptJson(encryptedData, password);
  },

  async saveConversation(messages: Message[], password: string, existingId?: string, type: 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal' = 'chat'): Promise<string> {
    const id = existingId || crypto.randomUUID();
    const { encryptJson, encryptPreview } = await import('./encryption');

    const encryptedData = encryptJson(messages, password);
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
        type,
      }),
    });

    return id;
  },

  async deleteConversation(id: string): Promise<void> {
    await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAllConversations(): Promise<void> {
    await fetch('/api/conversations/clear-all', {
      method: 'POST',
    });
  },

  async chatCompletion(request: ChatRequest): Promise<string> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        messages: request.messages,
        provider: request.provider,
        baseUrl: request.baseUrl,
        model: request.model,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    // For browser mode, we still use the stream endpoint but buffer the whole response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      fullResponse += decoder.decode(value);
    }

    return fullResponse;
  },
};

// Export the appropriate client based on environment
export const dbClient: DatabaseClient = isTauri ? tauriClient : browserClient;

// Export for TypeScript compatibility
export type { DatabaseClient };
