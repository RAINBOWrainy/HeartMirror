'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getAuthToken } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { FooterNav } from '@/components/navigation/FooterNav';
import { Sidebar } from '@/components/navigation/Sidebar';

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
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();

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
      setMessage(locale === 'zh' ? '请输入API密钥' : 'API key is required');
      return;
    }
    if (!baseUrl.trim()) {
      setMessage(locale === 'zh' ? '请输入API地址' : 'Base URL is required');
      return;
    }
    if (!model.trim()) {
      setMessage(locale === 'zh' ? '请输入模型名称' : 'Model name is required');
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
      setMessage(locale === 'zh' ? '设置已保存！' : 'Settings saved!');
      setTimeout(() => router.push('/'), 1000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage(locale === 'zh' ? '保存失败' : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] max-w-md mx-auto p-6">
        <div className="mb-6">
          <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--muted)' }}>
            ← {t(locale, 'common.backToChat')}
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mb-2">{t(locale, 'settings.title')}</h1>
        <p className="mb-6" style={{ color: 'var(--muted)' }}>
          {locale === 'zh' ? '配置您的偏好设置' : 'Configure your preferences'}
        </p>

        {message && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t(locale, 'settings.theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className="px-4 py-3 rounded-md border min-h-[44px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: theme === 'light' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: theme === 'light' ? 'var(--accent)' : 'var(--border)',
                  color: theme === 'light' ? 'white' : 'var(--text)',
                }}
              >
                ☀️ {t(locale, 'settings.themeLight')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className="px-4 py-3 rounded-md border min-h-[44px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: theme === 'dark' ? 'var(--accent)' : 'var(--border)',
                  color: theme === 'dark' ? 'white' : 'var(--text)',
                }}
              >
                🌙 {t(locale, 'settings.themeDark')}
              </button>
              <button
                onClick={() => setTheme('system')}
                className="px-4 py-3 rounded-md border min-h-[44px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: theme === 'system' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: theme === 'system' ? 'var(--accent)' : 'var(--border)',
                  color: theme === 'system' ? 'white' : 'var(--text)',
                }}
              >
                💻 {t(locale, 'settings.themeSystem')}
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t(locale, 'settings.language')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocale('zh')}
                className="px-4 py-3 rounded-md border min-h-[44px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: locale === 'zh' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: locale === 'zh' ? 'var(--accent)' : 'var(--border)',
                  color: locale === 'zh' ? 'white' : 'var(--text)',
                }}
              >
                🇨🇳 {t(locale, 'settings.languageZh')}
              </button>
              <button
                onClick={() => setLocale('en')}
                className="px-4 py-3 rounded-md border min-h-[44px] text-sm font-medium transition-colors"
                style={{
                  backgroundColor: locale === 'en' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: locale === 'en' ? 'var(--accent)' : 'var(--border)',
                  color: locale === 'en' ? 'white' : 'var(--text)',
                }}
              >
                🇺🇸 {t(locale, 'settings.languageEn')}
              </button>
            </div>
          </div>

          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t(locale, 'settings.aiProvider')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleProviderChange('anthropic')}
                className="px-4 py-2.5 rounded-md border min-h-[44px] text-sm"
                style={{
                  backgroundColor: provider === 'anthropic' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: provider === 'anthropic' ? 'var(--accent)' : 'var(--border)',
                  color: provider === 'anthropic' ? 'white' : 'var(--text)',
                }}
              >
                Anthropic
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                className="px-4 py-2.5 rounded-md border min-h-[44px] text-sm"
                style={{
                  backgroundColor: provider === 'openai' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: provider === 'openai' ? 'var(--accent)' : 'var(--border)',
                  color: provider === 'openai' ? 'white' : 'var(--text)',
                }}
              >
                OpenAI
              </button>
              <button
                onClick={() => handleProviderChange('ollama')}
                className="px-4 py-2.5 rounded-md border min-h-[44px] text-sm"
                style={{
                  backgroundColor: provider === 'ollama' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: provider === 'ollama' ? 'var(--accent)' : 'var(--border)',
                  color: provider === 'ollama' ? 'white' : 'var(--text)',
                }}
              >
                Ollama
              </button>
              <button
                onClick={() => handleProviderChange('custom')}
                className="px-4 py-2.5 rounded-md border min-h-[44px] text-sm"
                style={{
                  backgroundColor: provider === 'custom' ? 'var(--accent)' : 'var(--surface)',
                  borderColor: provider === 'custom' ? 'var(--accent)' : 'var(--border)',
                  color: provider === 'custom' ? 'white' : 'var(--text)',
                }}
              >
                Custom
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium mb-2">
              {t(locale, 'settings.apiBase')}
            </label>
            <input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full rounded px-3 py-2.5 focus:outline-none focus:ring-2 min-h-[44px]"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
              {t(locale, 'settings.apiKey')}
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded px-3 py-2.5 focus:outline-none focus:ring-2 min-h-[44px]"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-2">
              {t(locale, 'settings.model')}
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={PRESETS[provider].defaultModel}
              className="w-full rounded px-3 py-2.5 focus:outline-none focus:ring-2 min-h-[44px]"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--text)' }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full text-white rounded px-4 py-3 font-medium transition-colors duration-100 min-h-[44px] disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {isSaving ? (locale === 'zh' ? '保存中...' : 'Saving...') : t(locale, 'settings.save')}
          </button>

          <div className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? 'HeartMirror 不能替代专业心理健康护理' : 'HeartMirror is not a substitute for professional mental health care.'}
          </div>
        </div>
      </div>
      <div className="pb-20" />
    </div>
  );
}