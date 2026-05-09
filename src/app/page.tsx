'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import * as localAuth from '@/features/auth/local';
import { dbClient } from '@/features/database/shared/client';
import type { Message } from '@/features/ai/shared/types';
import type { ConversationInfo } from '@/features/database/shared/client';
import { useAuth, getAuthToken } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { Sidebar } from '@/components/navigation/Sidebar';

const API_KEY_STORAGE_KEY = 'heartmirror-api-key';
const PROVIDER_STORAGE_KEY = 'heartmirror-provider';
const BASE_URL_STORAGE_KEY = 'heartmirror-base-url';
const MODEL_STORAGE_KEY = 'heartmirror-model';
const CURRENT_CONVERSATION_KEY = 'heartmirror-current-conversation';

type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'custom';

const PRESETS = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-sonnet-20240229',
    requiresApiKey: true,
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    requiresApiKey: false,
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    requiresApiKey: true,
  },
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<AIProvider>('anthropic');
  const [baseUrl, setBaseUrl] = useState<string>(PRESETS.anthropic.baseUrl);
  const [model, setModel] = useState<string>(PRESETS.anthropic.defaultModel);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsProvider, setSettingsProvider] = useState<AIProvider>('anthropic');
  const [settingsBaseUrl, setSettingsBaseUrl] = useState<string>(PRESETS.anthropic.baseUrl);
  const [settingsModel, setSettingsModel] = useState<string>(PRESETS.anthropic.defaultModel);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth context for cloud mode
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { locale } = useLocale();

  // Check for cloud mode and load settings (only after auth context is ready)
  useEffect(() => {
    // Wait for auth context to finish loading
    if (isAuthLoading) return;

    if (isAuthenticated && user) {
      // In cloud mode, load API key from cloud settings
      loadCloudSettings();
    } else if (localAuth.hasLocalPassword()) {
      // Local mode with password protection
      setIsLocked(true);
      setIsLoadingSettings(false);
    } else {
      // Load local settings
      loadLocalSettings();
    }
  }, [isAuthenticated, user, isAuthLoading]);

  const loadCloudSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setProvider(data.provider || 'anthropic');
          setBaseUrl(data.baseUrl || PRESETS.anthropic.baseUrl);
          setModel(data.model || PRESETS.anthropic.defaultModel);
          setShowSettings(false);
        } else {
          setShowSettings(true);
        }
      } else {
        console.error('Failed to load cloud settings:', res.status);
        setShowSettings(true);
      }
    } catch (err) {
      console.error('Failed to load cloud settings:', err);
      setShowSettings(true);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadLocalSettings = () => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProvider | null;
    const savedBaseUrl = localStorage.getItem(BASE_URL_STORAGE_KEY);
    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
    const savedCurrentConversation = localStorage.getItem(CURRENT_CONVERSATION_KEY);

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedProvider) {
      setProvider(savedProvider);
      if (savedBaseUrl) {
        setBaseUrl(savedBaseUrl);
      } else {
        setBaseUrl(PRESETS[savedProvider].baseUrl);
      }
      if (savedModel) {
        setModel(savedModel);
      } else {
        setModel(PRESETS[savedProvider].defaultModel);
      }
    }
    if (savedBaseUrl) setBaseUrl(savedBaseUrl);
    if (savedModel) setModel(savedModel);
    if (savedCurrentConversation) setCurrentConversationId(savedCurrentConversation);

    if (!savedApiKey) {
      setShowSettings(true);
    }
    setIsLoadingSettings(false);
  };

  // Update defaults when preset changes
  const handleProviderChange = (newProvider: AIProvider) => {
    setSettingsProvider(newProvider);
    const preset = PRESETS[newProvider];
    setSettingsBaseUrl(preset.baseUrl);
    setSettingsModel(preset.defaultModel);
    if (!preset.requiresApiKey) {
      setSettingsApiKey('');
    }
  };

  // Load conversations from database after unlock
  const loadConversationsList = async () => {
    const password = localAuth.getLocalPassword();
    if (!password) return;
    try {
      const list = await dbClient.listConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Load a specific conversation
  const loadConversation = async (id: string) => {
    const password = localAuth.getLocalPassword();
    if (!password) return;
    try {
      const loadedMessages = await dbClient.loadConversation(id);
      setMessages(loadedMessages);
      setCurrentConversationId(id);
      localStorage.setItem(CURRENT_CONVERSATION_KEY, id);
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      alert('Failed to load conversation. Wrong password or corrupted data.');
    }
  };

  // Create a new empty conversation
  const createNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    setSidebarOpen(false);
  };

  // Delete a conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }
    try {
      await dbClient.deleteConversation(id);
      if (id === currentConversationId) {
        createNewConversation();
      }
      await loadConversationsList();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation.');
    }
  };

  // Save current conversation to database
  const saveCurrentConversation = async () => {
    if (messages.length === 0) return;
    const password = localAuth.getLocalPassword();
    if (!password) return;
    try {
      const newId = await dbClient.saveConversation(messages, password, currentConversationId || undefined);
      if (!currentConversationId) {
        setCurrentConversationId(newId);
        localStorage.setItem(CURRENT_CONVERSATION_KEY, newId);
      }
      await loadConversationsList();
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  // After unlock, load conversations and last selected conversation
  useEffect(() => {
    if (!isLocked) {
      loadConversationsList();
      const savedCurrentConversation = localStorage.getItem(CURRENT_CONVERSATION_KEY);
      if (savedCurrentConversation) {
        loadConversation(savedCurrentConversation);
      }
    }
  }, [isLocked]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentConversationId]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const saveSettings = async () => {
    const preset = PRESETS[settingsProvider];
    if (preset.requiresApiKey && !settingsApiKey.trim()) {
      alert(`${settingsProvider === 'custom' ? 'API key' : 'API key is required for ' + settingsProvider}`);
      return;
    }
    if (!settingsBaseUrl.trim()) {
      alert('Base URL is required');
      return;
    }
    if (!settingsModel.trim()) {
      alert('Model name is required');
      return;
    }

    // Update local state
    setApiKey(settingsApiKey.trim());
    setProvider(settingsProvider);
    setBaseUrl(settingsBaseUrl.trim());
    setModel(settingsModel);

    // Save based on mode
    if (isAuthenticated) {
      // Cloud mode: save to server
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            apiKey: settingsApiKey.trim(),
            provider: settingsProvider,
            baseUrl: settingsBaseUrl.trim(),
            model: settingsModel.trim(),
          }),
        });
      } catch (err) {
        console.error('Failed to save settings to cloud:', err);
      }
    } else {
      // Local mode: save to localStorage
      localStorage.setItem(API_KEY_STORAGE_KEY, settingsApiKey.trim());
      localStorage.setItem(PROVIDER_STORAGE_KEY, settingsProvider);
      localStorage.setItem(BASE_URL_STORAGE_KEY, settingsBaseUrl.trim());
      localStorage.setItem(MODEL_STORAGE_KEY, settingsModel.trim());
    }

    setShowSettings(false);
  };

  const handleUnlock = async () => {
    setPasswordError('');
    const isValid = await localAuth.verifyLocalPassword(unlockPassword);
    if (isValid) {
      setIsLocked(false);
      // Load API key after unlock
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (saved) {
        setApiKey(saved);
      } else {
        setShowSettings(true);
      }
    } else {
      setPasswordError('Invalid password. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !apiKey) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Use unified chat API (works in both browser and Tauri modes)
      const response = await dbClient.chatCompletion({
        messages: [...messages, userMessage],
        apiKey,
        provider,
        baseUrl,
        model,
      });

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = response;
        return newMessages;
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Looks like the connection dropped. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
      // Save conversation to database after response completes
      saveCurrentConversation();
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
      return;
    }
    try {
      await dbClient.deleteAllConversations();
      setMessages([]);
      setCurrentConversationId(null);
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
      setConversations([]);
    } catch (err) {
      console.error('Failed to clear all conversations:', err);
      alert('Failed to clear all conversations.');
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({
      version: 1,
      conversations: [{ id: currentConversationId || 'current', messages }],
      exportedAt: Date.now(),
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartmirror-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const password = localAuth.getLocalPassword();
        if (!password) {
          alert('Please unlock first.');
          return;
        }
        if (data.version === 1 && Array.isArray(data.conversations) && data.conversations.length > 0) {
          // Import all conversations
          for (const conv of data.conversations) {
            if (Array.isArray(conv.messages) && conv.messages.length > 0) {
              await dbClient.saveConversation(conv.messages, password);
            }
          }
          await loadConversationsList();
          alert(`Imported ${data.conversations.length} conversation(s) successfully!`);
        } else {
          alert('Invalid import file format.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to import file.');
      }
    };
    reader.readAsText(file);
  };

  // Format date for sidebar display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) {
      return 'Today';
    } else if (diff < 7 * day) {
      const days = Math.floor(diff / day);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Password unlock screen
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="w-full max-w-md p-6 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-semibold mb-4">
            {locale === 'zh' ? '解锁 HeartMirror' : 'Unlock HeartMirror'}
          </h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '此应用受密码保护。请输入密码继续。' : 'This instance is password protected. Enter your password to continue.'}
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {locale === 'zh' ? '密码' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder={locale === 'zh' ? '输入密码' : 'Enter your password'}
                className="w-full px-3 py-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              {passwordError && (
                <p className="text-sm mt-2" style={{ color: 'var(--error)' }}>{passwordError}</p>
              )}
            </div>

            <button
              onClick={handleUnlock}
              className="w-full text-white rounded px-4 py-3 font-medium transition-colors duration-100 min-h-[44px]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t(locale, 'common.unlock')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Settings modal for AI configuration
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <p style={{ color: 'var(--muted)' }}>{t(locale, 'common.loading')}</p>
      </div>
    );
  }

  if (showSettings || !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="w-full max-w-md p-6 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-semibold mb-2">
            {t(locale, 'settings.aiProvider')}
          </h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '配置您的AI服务商' : 'Configure your AI provider.'}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {locale === 'zh' ? 'AI服务商预设' : 'AI Provider Preset'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleProviderChange('anthropic')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'anthropic'
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: settingsProvider === 'anthropic' ? 'var(--accent)' : 'var(--surface)',
                    borderColor: settingsProvider === 'anthropic' ? 'var(--accent)' : 'var(--border)',
                    color: settingsProvider === 'anthropic' ? 'white' : 'var(--muted)',
                  }}
                >
                  Anthropic
                </button>
                <button
                  onClick={() => handleProviderChange('openai')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'openai'
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: settingsProvider === 'openai' ? 'var(--accent)' : 'var(--surface)',
                    borderColor: settingsProvider === 'openai' ? 'var(--accent)' : 'var(--border)',
                    color: settingsProvider === 'openai' ? 'white' : 'var(--muted)',
                  }}
                >
                  OpenAI
                </button>
                <button
                  onClick={() => handleProviderChange('ollama')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'ollama'
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: settingsProvider === 'ollama' ? 'var(--accent)' : 'var(--surface)',
                    borderColor: settingsProvider === 'ollama' ? 'var(--accent)' : 'var(--border)',
                    color: settingsProvider === 'ollama' ? 'white' : 'var(--muted)',
                  }}
                >
                  Ollama
                </button>
                <button
                  onClick={() => handleProviderChange('custom')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'custom'
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: settingsProvider === 'custom' ? 'var(--accent)' : 'var(--surface)',
                    borderColor: settingsProvider === 'custom' ? 'var(--accent)' : 'var(--border)',
                    color: settingsProvider === 'custom' ? 'white' : 'var(--muted)',
                  }}
                >
                  Custom
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '点击预设自动填充默认设置，所有字段均可自由编辑' : 'Click a preset to auto-fill defaults. All fields can be edited freely.'}
              </p>
            </div>

            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium mb-2">
                {t(locale, 'settings.apiBase')}
              </label>
              <input
                id="baseUrl"
                type="text"
                value={settingsBaseUrl}
                onChange={(e) => setSettingsBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                {t(locale, 'settings.apiKey')}
              </label>
              <input
                id="apiKey"
                type="password"
                value={settingsApiKey}
                onChange={(e) => setSettingsApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-2">
                {t(locale, 'settings.model')}
              </label>
              <input
                id="model"
                type="text"
                value={settingsModel}
                onChange={(e) => setSettingsModel(e.target.value)}
                placeholder={PRESETS[settingsProvider].defaultModel}
                className="w-full px-3 py-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <button
              onClick={saveSettings}
              className="w-full text-white rounded px-4 py-3 font-medium transition-colors duration-100 min-h-[44px]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t(locale, 'settings.save')}
            </button>

            {apiKey && (
              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-2 text-sm py-2"
                style={{ color: 'var(--muted)' }}
              >
                {t(locale, 'common.cancel')}
              </button>
            )}

            <div className="mt-4 text-xs text-center" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? 'HeartMirror 不能替代专业心理健康护理' : 'HeartMirror is not a substitute for professional mental health care.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex flex-col h-screen">
        {/* Top bar */}
        <div className="px-4 py-2 flex justify-end gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="text-sm px-3 py-1 rounded-md transition-colors duration-100"
                style={{ color: 'var(--muted)' }}
              >
                {t(locale, 'home.export')}
              </button>
              <label className="text-sm px-3 py-1 rounded-md transition-colors duration-100 cursor-pointer" style={{ color: 'var(--muted)' }}>
                {t(locale, 'home.import')}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </>
          )}
          <Link
            href="/settings"
            className="text-sm px-3 py-1 rounded-md transition-colors duration-100"
            style={{ color: 'var(--muted)' }}
          >
            {t(locale, 'nav.settings')}
          </Link>
        </div>

        {/* Conversation History */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-label="Conversation history"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-lg" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '这里只有你和我。' : "It's just you and me right now."}
              </p>
              <p className="text-md" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '有什么想说的吗？' : "What's on your mind?"}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'rounded-br-sm'
                      : 'rounded-bl-sm'
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(msg.content)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 p-1 rounded-sm text-xs"
                  style={{ backgroundColor: 'var(--border)', color: 'var(--text)' }}
                  aria-label="Copy message"
                  title="Copy message"
                >
                  📋
                </button>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={locale === 'zh' ? '输入消息...' : 'Type your message here...'}
              className="flex-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none min-h-[44px]"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="text-white rounded-lg px-4 py-2 min-h-[44px] min-w-[44px] font-medium transition-colors duration-100 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {locale === 'zh' ? '发送' : 'Send'}
            </button>
          </div>

          {/* Footer with legal disclaimer and clear button */}
          <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <p>
              {locale === 'zh' ? 'HeartMirror 不能替代专业心理健康护理' : 'HeartMirror is not a substitute for professional mental health care.'}
            </p>
            {conversations.length > 0 && (
              <button
                onClick={handleClearAll}
                className="underline underline-offset-2"
                style={{ color: 'var(--muted)' }}
              >
                {locale === 'zh' ? '清空所有对话' : 'Clear all conversations'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
