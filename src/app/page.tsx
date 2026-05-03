'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import * as localAuth from '@/features/auth/local';
import * as localDb from '@/features/database/local';
import type { Message } from '@/features/ai/shared/types';
import type { ConversationInfo } from '@/features/database/local';

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
      const list = await localDb.listConversations(password);
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
      const loadedMessages = await localDb.loadConversation(id, password);
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
      await localDb.deleteConversation(id);
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
      const newId = await localDb.saveConversation(messages, password, currentConversationId || undefined);
      if (!currentConversationId) {
        setCurrentConversationId(newId);
        localStorage.setItem(CURRENT_CONVERSATION_KEY, newId);
      }
      await loadConversationsList();
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  // Check for password protection on mount and load saved settings
  useEffect(() => {
    if (localAuth.hasLocalPassword()) {
      setIsLocked(true);
    } else {
      // Load settings from localStorage
      const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProvider | null;
      const savedBaseUrl = localStorage.getItem(BASE_URL_STORAGE_KEY);
      const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const savedCurrentConversation = localStorage.getItem(CURRENT_CONVERSATION_KEY);

      if (savedApiKey) setApiKey(savedApiKey);
      if (savedProvider) {
        setProvider(savedProvider);
        // If no saved base URL, use preset default
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
    }
  }, []);

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

  const saveSettings = () => {
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

    localStorage.setItem(API_KEY_STORAGE_KEY, settingsApiKey.trim());
    localStorage.setItem(PROVIDER_STORAGE_KEY, settingsProvider);
    localStorage.setItem(BASE_URL_STORAGE_KEY, settingsBaseUrl.trim());
    localStorage.setItem(MODEL_STORAGE_KEY, settingsModel.trim());

    setApiKey(settingsApiKey.trim());
    setProvider(settingsProvider);
    setBaseUrl(settingsBaseUrl.trim());
    setModel(settingsModel);
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
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          apiKey,
          provider,
          baseUrl,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        fullResponse += decoder.decode(value);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }

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
      await localDb.deleteAllConversations();
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
              await localDb.saveConversation(conv.messages, password);
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
      <div className="min-h-screen bg-base-bg flex items-center justify-center p-4">
        <div className="bg-base-surface border border-base-border rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold font-display text-base-text mb-4">
            Unlock HeartMirror
          </h2>
          <p className="text-base-muted mb-6">
            This instance is password protected. Enter your password to continue.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-text mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-base-bg border border-base-border rounded-sm px-3 py-2.5 text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              {passwordError && (
                <p className="text-sm text-accent-error mt-2">{passwordError}</p>
              )}
            </div>

            <button
              onClick={handleUnlock}
              className="w-full bg-accent-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm px-4 py-3 font-medium transition-colors duration-100 min-h-[44px]"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Settings modal for AI configuration
  if (showSettings || !apiKey) {
    // Load current settings when opening
    if (apiKey) {
      setSettingsApiKey(apiKey);
      setSettingsProvider(provider);
      setSettingsBaseUrl(baseUrl);
      setSettingsModel(model);
    }

    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center p-4">
        <div className="bg-base-surface border border-base-border rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold font-display text-base-text mb-4">
            Welcome to HeartMirror
          </h2>
          <p className="text-base-muted mb-6">
            Configure your AI provider. All settings are stored locally in your browser and never leave your device.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-text mb-2">
                AI Provider Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleProviderChange('anthropic')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'anthropic'
                      ? 'bg-accent-primary border-accent-primary text-white'
                      : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                  }`}
                >
                  Anthropic
                </button>
                <button
                  onClick={() => handleProviderChange('openai')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'openai'
                      ? 'bg-accent-primary border-accent-primary text-white'
                      : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                  }`}
                >
                  OpenAI
                </button>
                <button
                  onClick={() => handleProviderChange('ollama')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'ollama'
                      ? 'bg-accent-primary border-accent-primary text-white'
                      : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                  }`}
                >
                  Ollama (Local)
                </button>
                <button
                  onClick={() => handleProviderChange('custom')}
                  className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                    settingsProvider === 'custom'
                      ? 'bg-accent-primary border-accent-primary text-white'
                      : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                  }`}
                >
                  Custom (OpenAI)
                </button>
              </div>
              <p className="text-xs text-base-muted mt-2">
                Click a preset to auto-fill defaults. All fields can be edited freely.
              </p>
            </div>

            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-base-text mb-2">
                API Base URL
              </label>
              <input
                id="baseUrl"
                type="text"
                value={settingsBaseUrl}
                onChange={(e) => setSettingsBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full bg-base-bg border border-base-border rounded-sm px-3 py-2.5 text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
              />
              <p className="text-xs text-base-muted mt-2">
                Most providers use OpenAI-compatible API format. Include /v1 if required.
              </p>
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-base-text mb-2">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={settingsApiKey}
                onChange={(e) => setSettingsApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-base-bg border border-base-border rounded-sm px-3 py-2.5 text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
              />
              {settingsProvider === 'ollama' && (
                <p className="text-xs text-base-muted mt-2">
                  Local Ollama usually doesn't require an API key. Leave blank.
                </p>
              )}
              {settingsProvider === 'anthropic' && (
                <p className="text-xs text-base-muted mt-2">
                  Get your API key from {' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary underline hover:no-underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              )}
              {settingsProvider === 'openai' && (
                <p className="text-xs text-base-muted mt-2">
                  Get your API key from {' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary underline hover:no-underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-base-text mb-2">
                Model Name
              </label>
              <input
                id="model"
                type="text"
                value={settingsModel}
                onChange={(e) => setSettingsModel(e.target.value)}
                placeholder={PRESETS[settingsProvider].defaultModel}
                className="w-full bg-base-bg border border-base-border rounded-sm px-3 py-2.5 text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
              />
              {settingsProvider === 'ollama' && (
                <p className="text-xs text-base-muted mt-2">
                  Make sure Ollama is running and the model is pulled with <code className="bg-base-bg px-1 rounded-sm">ollama pull {settingsModel}</code>
                </p>
              )}
            </div>

            <button
              onClick={saveSettings}
              className="w-full bg-accent-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm px-4 py-3 font-medium transition-colors duration-100 min-h-[44px]"
            >
              Save and Continue
            </button>

            <div className="mt-4 text-xs text-base-muted text-center">
              HeartMirror is not a substitute for professional mental health care.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-bg text-base-text">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Conversation list */}
      <aside
        className={`fixed md:static z-50 w-[280px] h-full bg-base-surface border-r border-base-border transition-transform duration-150 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-base-border">
            <h1 className="text-xl font-display font-semibold text-base-text">HeartMirror</h1>
            <p className="text-xs text-base-muted">AI companion for 2AM spiraling</p>
          </div>

          <div className="p-3">
            <button
              onClick={createNewConversation}
              className="w-full bg-accent-primary hover:bg-blue-700 text-white rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-100 min-h-[44px]"
            >
              + New Conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center text-base-muted text-sm py-8">
                No conversations yet.
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`p-3 rounded-md cursor-pointer transition-colors duration-100 ${
                      conv.id === currentConversationId
                        ? 'bg-base-bg border-l-2 border-accent-primary'
                        : 'hover:bg-base-bg'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium text-base-text truncate">
                        {conv.preview || 'Empty conversation'}
                      </p>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="text-base-muted hover:text-accent-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        aria-label="Delete conversation"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-base-muted mt-1">
                      {formatDate(new Date(conv.createdAt))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-base-border">
            <button
              onClick={() => {
                setSettingsApiKey(apiKey);
                setSettingsProvider(provider);
                setSettingsBaseUrl(baseUrl);
                setSettingsModel(model);
                setShowSettings(true);
              }}
              className="w-full text-left px-3 py-2 text-sm text-base-muted hover:text-base-text hover:bg-base-bg rounded-md transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with menu toggle */}
        <div className="md:hidden px-4 py-2 flex items-center border-b border-base-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-base-muted hover:text-base-text p-2 -ml-2"
            aria-label="Open conversations sidebar"
          >
            ☰
          </button>
          <span className="ml-2 font-display font-medium text-base-text">
            {currentConversationId ? (
              conversations.find(c => c.id === currentConversationId)?.preview.slice(0, 20) + '...'
            ) : (
              'New Conversation'
            )}
          </span>
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex px-4 py-2 justify-end gap-2 border-b border-base-border">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="text-sm text-base-muted hover:text-base-text px-3 py-1 rounded-md hover:bg-base-surface transition-colors duration-100"
              >
                Export
              </button>
              <label className="text-sm text-base-muted hover:text-base-text px-3 py-1 rounded-md hover:bg-base-surface transition-colors duration-100 cursor-pointer">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </>
          )}
          <button
            onClick={() => {
              setSettingsApiKey(apiKey);
              setSettingsProvider(provider);
              setSettingsBaseUrl(baseUrl);
              setSettingsModel(model);
              setShowSettings(true);
            }}
            className="text-sm text-base-muted hover:text-base-text px-3 py-1 rounded-md hover:bg-base-surface transition-colors duration-100"
          >
            Settings
          </button>
        </div>

        {/* Conversation History */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-label="Conversation history"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-base-muted">
              <p className="text-lg">It's just you and me right now.</p>
              <p className="text-md">What's on your mind?</p>
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
                      ? 'bg-accent-primary text-white rounded-br-sm'
                      : 'bg-base-surface text-base-text rounded-bl-sm'
                  }`}
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
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 bg-base-border hover:bg-base-muted text-base-text p-1 rounded-sm text-xs"
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
              <div className="bg-base-surface px-4 py-3 rounded-lg rounded-bl-sm">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-base-border p-4 bg-base-bg sticky bottom-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 bg-base-bg border border-base-border rounded-lg px-3 py-2 text-base-text placeholder-base-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none min-h-[44px]"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-accent-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 min-h-[44px] min-w-[44px] font-medium transition-colors duration-100"
            >
              Send
            </button>
          </div>

          {/* Footer with legal disclaimer and clear button */}
          <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-base-muted">
            <p>
              HeartMirror is not a substitute for professional mental health care.
            </p>
            {conversations.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-base-muted hover:text-base-text underline underline-offset-2"
              >
                Clear all conversations
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
