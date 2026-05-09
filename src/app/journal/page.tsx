'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { Sidebar } from '@/components/navigation/Sidebar';
import type { MoodJournalEntry } from '@/features/tracker/types';

const MOOD_LABELS_ZH = ['很低落', '低落', '有些低落', '略低', '一般', '略好', '不错', '良好', '很好', '非常好'];
const MOOD_LABELS_EN = ['Very Low', 'Low', 'Somewhat Low', 'Slightly Low', 'Neutral', 'Slightly Better', 'Good', 'Very Good', 'Great', 'Excellent'];

const TAGS = ['sleep', 'work', 'relationships', 'family', 'exercise', 'diet', 'social', 'alone', 'mindfulness', 'medication'] as const;

const STORAGE_KEY = 'heartmirror-journal-entries';

export default function JournalPage() {
  const { locale } = useLocale();
  const [entries, setEntries] = useState<MoodJournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [moodScore, setMoodScore] = useState(5);
  const [textEntry, setTextEntry] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        setEntries([]);
      }
    }
  }, []);

  const saveEntry = () => {
    const entry: MoodJournalEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      moodScore,
      textEntry,
      tags: selectedTags,
    };
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setMoodScore(5);
    setTextEntry('');
    setSelectedTags([]);
    setShowNewEntry(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getMoodLabel = (score: number) => {
    return locale === 'zh' ? MOOD_LABELS_ZH[score - 1] : MOOD_LABELS_EN[score - 1];
  };

  const getTagLabel = (tag: string) => t(locale, `journal.tagLabels.${tag}`);
  const moodLabel = getMoodLabel(moodScore);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 p-4 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t(locale, 'journal.title')}</h1>
            {!showNewEntry && (
              <button onClick={() => setShowNewEntry(true)}
                className="px-4 py-2 rounded text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--accent)' }}>
                + {t(locale, 'journal.newEntry')}
              </button>
            )}
          </div>
        </div>

        {/* New Entry Form */}
        {showNewEntry && (
          <div className="p-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4">{t(locale, 'journal.newEntry')}</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">{t(locale, 'journal.moodScore')}</label>
              <div className="flex items-center gap-4">
                <input type="range" min="1" max="10" value={moodScore}
                  onChange={(e) => setMoodScore(parseInt(e.target.value))}
                  className="flex-1" style={{ accentColor: 'var(--accent)' }} />
                <div className="text-center min-w-[80px]">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{moodScore}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{moodLabel}</div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">{t(locale, 'journal.placeholder')}</label>
              <textarea value={textEntry} onChange={(e) => setTextEntry(e.target.value)}
                placeholder={t(locale, 'journal.placeholder')}
                className="w-full p-3 rounded-lg border resize-none min-h-[120px]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">{t(locale, 'journal.tags')}</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                      style={{
                        backgroundColor: selected ? 'var(--accent)' : 'var(--surface)',
                        borderColor: selected ? 'var(--accent)' : 'var(--border)',
                        color: selected ? 'white' : 'var(--text)',
                      }}>
                      {getTagLabel(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowNewEntry(false); setMoodScore(5); setTextEntry(''); setSelectedTags([]); }}
                className="flex-1 py-2.5 rounded border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                {t(locale, 'common.cancel')}
              </button>
              <button onClick={saveEntry} disabled={!textEntry.trim()}
                className="flex-1 py-2.5 rounded text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}>
                {t(locale, 'journal.save')}
              </button>
            </div>
          </div>
        )}

        {/* Entry List */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--muted)' }}>
            {t(locale, 'journal.history')}
          </h2>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">📔</p>
              <p style={{ color: 'var(--muted)' }}>{t(locale, 'journal.noEntries')}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{t(locale, 'journal.startWriting')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg border"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{formatDate(entry.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{entry.moodScore}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{getMoodLabel(entry.moodScore)}</div>
                    </div>
                  </div>
                  {entry.textEntry && <p className="text-sm mb-3">{entry.textEntry}</p>}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                          {getTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
