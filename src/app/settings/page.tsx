'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getAuthToken } from '@/contexts/AuthContext';
import Link from 'next/link';

type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'custom';

const API_KEY_STORAGE_KEY = 'heartmirror-api-key';
const PROVIDER_STORAGE_KEY = 'heartmirror-provider';
const BASE_URL_STORAGE_KEY = 'heartmirror-base-url';
const MODEL_STORAGE_KEY = 'heartmirror-model';

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

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<AIProvider>('anthropic');
  const [baseUrl, setBaseUrl] = useState(PRESETS.anthropic.baseUrl);
  const [model, setModel] = useState(PRESETS.anthropic.defaultModel);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;

    if (isAuthenticated && user) {
      loadCloudSettings();
    } else {
      loadLocalSettings();
    }
  }, [isAuthenticated, user, isAuthLoading]);

  const loadCloudSettings = async () => {
    try {
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
        }
      }
    } catch (err) {
      console.error('Failed to load cloud settings:', err);
    }
  };

  const loadLocalSettings = () => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProvider | null;
    const savedBaseUrl = localStorage.getItem(BASE_URL_STORAGE_KEY);
    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedProvider) {
      setProvider(savedProvider);
      setBaseUrl(savedBaseUrl || PRESETS[savedProvider].baseUrl);
      setModel(savedModel || PRESETS[savedProvider].defaultModel);
    }
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const preset = PRESETS[newProvider];
    setBaseUrl(preset.baseUrl);
    setModel(preset.defaultModel);
    if (!preset.requiresApiKey) {
      setApiKey('');
    }
  };

  const handleSave = async () => {
    const preset = PRESETS[provider];
    if (preset.requiresApiKey && !apiKey.trim()) {
      setMessage(`${provider === 'custom' ? 'API key' : 'API key is required for ' + provider}`);
      return;
    }
    if (!baseUrl.trim()) {
      setMessage('Base URL is required');
      return;
    }
    if (!model.trim()) {
      setMessage('Model name is required');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      if (isAuthenticated) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
            provider,
            baseUrl: baseUrl.trim(),
            model: model.trim(),
          }),
        });
      } else {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
        localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
        localStorage.setItem(BASE_URL_STORAGE_KEY, baseUrl.trim());
        localStorage.setItem(MODEL_STORAGE_KEY, model.trim());
      }
      setMessage('Settings saved!');
      setTimeout(() => router.push('/'), 1000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-bg text-base-text" style={{ fontFamily: 'inherit' }}>
      <div className="max-w-md mx-auto p-6">
        <div className="mb-6">
          <Link href="/" className="text-base-muted hover:text-base-text text-sm">
            ← Back to chat
          </Link>
        </div>

        <h1 className="text-2xl font-display font-semibold text-base-text mb-2">AI Settings</h1>
        <p className="text-base-muted mb-6">Configure your AI provider.</p>

        {message && (
          <div className="mb-4 p-3 rounded bg-base-surface border border-base-border text-base-text">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-text mb-2">
              AI Provider Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleProviderChange('anthropic')}
                className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                  provider === 'anthropic'
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                }`}
              >
                Anthropic
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                  provider === 'openai'
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                }`}
              >
                OpenAI
              </button>
              <button
                onClick={() => handleProviderChange('ollama')}
                className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                  provider === 'ollama'
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-base-surface border border-base-border text-base-muted hover:bg-base-bg'
                }`}
              >
                Ollama (Local)
              </button>
              <button
                onClick={() => handleProviderChange('custom')}
                className={`px-4 py-2.5 rounded-md border min-h-[44px] ${
                  provider === 'custom'
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
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
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
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-base-bg border border-base-border rounded-sm px-3 py-2.5 text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
            />
            {provider === 'anthropic' && (
              <p className="text-xs text-base-muted mt-2">
                Get your API key from{' '}
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
            {provider === 'openai' && (
              <p className="text-xs text-base-muted mt-2">
                Get your API key from{' '}
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
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={PRESETS[provider].defaultModel}
              className="w-full bg-base-bg border border-base-border rounded-sm px-3 py-2.5 text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-accent-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm px-4 py-3 font-medium transition-colors duration-100 min-h-[44px]"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          <div className="mt-4 text-xs text-base-muted text-center">
            HeartMirror is not a substitute for professional mental health care.
          </div>
        </div>
      </div>
    </div>
  );
}