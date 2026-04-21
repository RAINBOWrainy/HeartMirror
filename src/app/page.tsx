'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import * as localAuth from '@/features/auth/local';
import type { Message } from '@/features/ai/shared/types';

const API_KEY_STORAGE_KEY = 'heartmirror-api-key';
const PROVIDER_STORAGE_KEY = 'heartmirror-provider';
const BASE_URL_STORAGE_KEY = 'heartmirror-base-url';
const MODEL_STORAGE_KEY = 'heartmirror-model';

type AIProvider = 'anthropic' | 'ollama';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<AIProvider>('anthropic');
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:11434');
  const [model, setModel] = useState<string>('claude-3-sonnet-20240229');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsProvider, setSettingsProvider] = useState<AIProvider>('anthropic');
  const [settingsBaseUrl, setSettingsBaseUrl] = useState<string>('http://localhost:11434');
  const [settingsModel, setSettingsModel] = useState<string>('claude-3-sonnet-20240229');
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      if (savedApiKey) setApiKey(savedApiKey);
      if (savedProvider) setProvider(savedProvider);
      if (savedBaseUrl) setBaseUrl(savedBaseUrl);
      if (savedModel) setModel(savedModel);

      if (!savedApiKey) {
        setShowSettings(true);
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
    if (settingsProvider === 'anthropic' && !settingsApiKey.trim()) {
      alert('API key is required for Anthropic');
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, settingsApiKey.trim());
    localStorage.setItem(PROVIDER_STORAGE_KEY, settingsProvider);
    localStorage.setItem(BASE_URL_STORAGE_KEY, settingsBaseUrl);
    localStorage.setItem(MODEL_STORAGE_KEY, settingsModel);

    setApiKey(settingsApiKey.trim());
    setProvider(settingsProvider);
    setBaseUrl(settingsBaseUrl);
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
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
      return;
    }
    // TODO: Implement clear all conversations from database
    setMessages([]);
  };

  const handleExport = () => {
    const data = JSON.stringify({ version: 1, conversations: [{ messages }], exportedAt: Date.now() }, null, 2);
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
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.version === 1 && Array.isArray(data.conversations) && data.conversations.length > 0) {
          // Import first conversation
          setMessages(data.conversations[0].messages);
          alert('Import successful!');
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

  // Password unlock screen
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Unlock HeartMirror
          </h2>
          <p className="text-gray-400 mb-6">
            This instance is password protected. Enter your password to continue.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              {passwordError && (
                <p className="text-sm text-red-400 mt-2">{passwordError}</p>
              )}
            </div>

            <button
              onClick={handleUnlock}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-medium transition-colors"
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Welcome to HeartMirror
          </h2>
          <p className="text-gray-400 mb-6">
            Configure your AI provider. All settings are stored locally in your browser and never leave your device.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSettingsProvider('anthropic')}
                  className={`px-4 py-2 rounded-lg border ${
                    settingsProvider === 'anthropic'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Anthropic
                </button>
                <button
                  onClick={() => setSettingsProvider('ollama')}
                  className={`px-4 py-2 rounded-lg border ${
                    settingsProvider === 'ollama'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Ollama (Local)
                </button>
              </div>
            </div>

            {settingsProvider === 'anthropic' && (
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                  Anthropic API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={settingsApiKey}
                  onChange={(e) => setSettingsApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get your API key from {' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>
            )}

            {settingsProvider === 'ollama' && (
              <>
                <div>
                  <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-300 mb-2">
                    Ollama Base URL
                  </label>
                  <input
                    id="baseUrl"
                    type="text"
                    value={settingsBaseUrl}
                    onChange={(e) => setSettingsBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                    Model Name
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={settingsModel}
                    onChange={(e) => setSettingsModel(e.target.value)}
                    placeholder="llama3"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Make sure Ollama is running and the model is pulled with <code className="bg-gray-800 px-1 rounded">ollama pull {settingsModel}</code>
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                {settingsProvider === 'anthropic' ? 'Model Name' : 'Model Name (continued)'}
              </label>
              <input
                id="model"
                type="text"
                value={settingsModel}
                onChange={(e) => setSettingsModel(e.target.value)}
                placeholder={settingsProvider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'llama3'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={saveSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-medium transition-colors"
            >
              Save and Continue
            </button>

            <div className="mt-4 text-xs text-gray-500 text-center">
              HeartMirror is not a substitute for professional mental health care.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-[768px] mx-auto bg-gray-950">
      {/* Top Bar */}
      <div className="px-4 py-2 flex justify-end gap-2 border-b border-gray-800">
        {messages.length > 0 && (
          <>
            <button
              onClick={handleExport}
              className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Export
            </button>
            <label className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
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
          className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors"
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
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
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
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm'
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
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-gray-200 p-1 rounded-md text-xs"
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
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4 bg-gray-950 sticky bottom-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px]"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 min-h-[44px] min-w-[44px] font-medium transition-colors"
          >
            Send
          </button>
        </div>

        {/* Footer with legal disclaimer and clear button */}
        <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>
            HeartMirror is not a substitute for professional mental health care.
          </p>
          {messages.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-gray-500 hover:text-gray-300 underline underline-offset-2"
            >
              Clear all conversations
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
