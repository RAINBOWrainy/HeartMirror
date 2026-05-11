'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { Sidebar } from '@/components/navigation/Sidebar';
import { analyzePatterns, checkNudgeTrigger, type PatternAnalysis } from '@/lib/pattern-engine';
import { canSendPush, requestPushPermission, isNudgeSnoozed, snoozeNudge } from '@/lib/nudge';
import type { MoodJournalEntry, StandardizedTestResult } from '@/features/tracker/types';

const JOURNAL_KEY = 'heartmirror-journal-entries';
const ASSESSMENTS_KEY = 'heartmirror-assessment-results';
const EXERCISES_KEY = 'heartmirror-exercise-completions';
const CHAT_SESSIONS_KEY = 'heartmirror-chat-sessions';

const MOOD_LABELS_ZH = ['很低落', '低落', '有些低落', '略低', '一般', '略好', '不错', '良好', '很好', '非常好'];
const MOOD_LABELS_EN = ['Very Low', 'Low', 'Somewhat Low', 'Slightly Low', 'Neutral', 'Slightly Better', 'Good', 'Very Good', 'Great', 'Excellent'];

interface ExerciseCompletion {
  id: string;
  createdAt: number;
  exerciseId: string;
  durationMin: number;
}

interface ChatSession {
  id: string;
  createdAt: number;
  messageCount: number;
}

interface TimelineEntry {
  id: string;
  date: Date;
  type: 'journal' | 'assessment' | 'exercise' | 'chat';
  score?: number;
  label: string;
  detail?: string;
  icon: string;
}

export default function DashboardPage() {
  const { locale } = useLocale();
  const [journalEntries, setJournalEntries] = useState<MoodJournalEntry[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<StandardizedTestResult[]>([]);
  const [exerciseCompletions, setExerciseCompletions] = useState<ExerciseCompletion[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [pushRequested, setPushRequested] = useState(false);

  // Sync snooze state on mount
  useEffect(() => {
    // If snoozed within 24h, treat as dismissed
    if (isNudgeSnoozed()) {
      setNudgeDismissed(true);
    }
  }, []);

  // Phase 6: Request push permission on mount (if not already granted/denied)
  useEffect(() => {
    if (pushRequested) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    setPushRequested(true);
    requestPushPermission();
  }, [pushRequested]);

  useEffect(() => {
    const storedJournal = localStorage.getItem(JOURNAL_KEY);
    if (storedJournal) {
      try {
        setJournalEntries(JSON.parse(storedJournal));
      } catch { setJournalEntries([]); }
    }
    const storedAssessments = localStorage.getItem(ASSESSMENTS_KEY);
    if (storedAssessments) {
      try {
        setAssessmentResults(JSON.parse(storedAssessments));
      } catch { setAssessmentResults([]); }
    }
    const storedExercises = localStorage.getItem(EXERCISES_KEY);
    if (storedExercises) {
      try {
        setExerciseCompletions(JSON.parse(storedExercises));
      } catch { setExerciseCompletions([]); }
    }
    const storedChats = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (storedChats) {
      try {
        setChatSessions(JSON.parse(storedChats));
      } catch { setChatSessions([]); }
    }
  }, []);

  // Run pattern analysis when data changes
  useEffect(() => {
    if (journalEntries.length === 0) return;

    setPatternLoading(true);
    setPatternError(null);

    analyzePatterns(journalEntries, assessmentResults)
      .then(result => {
        if ('error' in result) {
          setPatternError(result.error);
        } else {
          setPatternAnalysis(result);
        }
      })
      .catch(err => {
        setPatternError(err instanceof Error ? err.message : 'Analysis failed');
      })
      .finally(() => {
        setPatternLoading(false);
      });
  }, [journalEntries, assessmentResults]);

  // Phase 6: Check nudge trigger after pattern analysis completes
  useEffect(() => {
    if (!patternAnalysis || nudgeDismissed) return;
    if (!checkNudgeTrigger(patternAnalysis)) return;

    if (!canSendPush()) {
      // Show in-app fallback banner
      setNudgeDismissed(false); // ensure banner shows
    }
  }, [patternAnalysis, nudgeDismissed]);

  // In-app nudge banner
  const showNudgeBanner = patternAnalysis && checkNudgeTrigger(patternAnalysis) && !nudgeDismissed;

  // Get entries for current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const getMoodForDate = (date: Date) => {
    const dayEntries = journalEntries.filter(e => new Date(e.createdAt).toDateString() === date.toDateString());
    if (dayEntries.length === 0) return null;
    return dayEntries.reduce((sum, e) => sum + e.moodScore, 0) / dayEntries.length;
  };

  const todayEntries = journalEntries.filter(e => {
    const d = new Date(e.createdAt);
    return d.toDateString() === selectedDate.toDateString();
  });

  const todayMoodAvg = todayEntries.length > 0
    ? todayEntries.reduce((sum, e) => sum + e.moodScore, 0) / todayEntries.length
    : null;

  const getMoodLabel = (score: number) => {
    return locale === 'zh' ? MOOD_LABELS_ZH[score - 1] : MOOD_LABELS_EN[score - 1];
  };

  const getTagIcon = (tag: string) => {
    const icons: Record<string, string> = {
      sleep: '😴', work: '💼', relationships: '💕', family: '👨‍👩‍👧',
      exercise: '🏃', diet: '🥗', social: '👥', alone: '🧍',
      mindfulness: '🧘', medication: '💊',
    };
    return icons[tag] || '📌';
  };

  // Calculate overall mood trend (last 7 days)
  const overallMood = weekDays.reduce((acc, day) => {
    const mood = getMoodForDate(day);
    return mood !== null ? acc + mood : acc;
  }, 0) / 7;

  const getOverallStatus = () => {
    if (isNaN(overallMood) || todayMoodAvg === null) {
      return locale === 'zh' ? '暂无数据' : 'No data yet';
    }
    if (todayMoodAvg >= 7) return locale === 'zh' ? '状态良好' : 'Doing well';
    if (todayMoodAvg >= 5) return locale === 'zh' ? '状态一般' : 'Getting by';
    if (todayMoodAvg >= 3) return locale === 'zh' ? '需要关注' : 'Needs attention';
    return locale === 'zh' ? '建议寻求支持' : 'Consider reaching out';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-4 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{locale === 'zh' ? '看板' : 'Dashboard'}</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '心理健康追踪' : 'Mental Health Tracking'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/exercises" className="text-sm px-3 py-2 rounded border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                🧘 {locale === 'zh' ? '正念训练' : 'Exercises'}
              </Link>
              <Link href="/assessment" className="text-sm px-3 py-2 rounded text-white font-medium"
                style={{ backgroundColor: 'var(--accent)' }}>
                + {locale === 'zh' ? '新评估' : 'Assessment'}
              </Link>
            </div>
          </div>
        </div>

        {/* Phase 6: In-app nudge banner */}
        {showNudgeBanner && (
          <div className="mx-6 mt-4 p-4 rounded-lg border flex items-center justify-between"
            style={{ backgroundColor: 'var(--warning)', color: 'var(--bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">💭</span>
              <div>
                <p className="text-sm font-medium">
                  {locale === 'zh' ? '最近状态有所下降，想聊聊吗？' : 'You\'ve been feeling down — want to talk?'}
                </p>
                <p className="text-xs opacity-80">
                  {locale === 'zh' ? '你的心情最近不太好，我们在这里帮助你' : 'Your mood has been declining — we\'re here to help'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                {locale === 'zh' ? '去聊天' : 'Chat now'}
              </Link>
              <button onClick={() => { setNudgeDismissed(true); snoozeNudge(); }} className="text-xs px-3 py-1.5 rounded"
                style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: 'var(--text)' }}>
                {locale === 'zh' ? '忽略' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Overall Status */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">😊</span>
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{locale === 'zh' ? '今日状态' : 'Today'}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{getOverallStatus()}</p>
                </div>
              </div>
              {todayMoodAvg ? (
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{todayMoodAvg.toFixed(1)}</div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>/10</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{getMoodLabel(Math.round(todayMoodAvg))}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '今天还没有记录' : 'No entries today'}
                </p>
              )}
            </div>

            {/* AI Insight Digest */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🧠</span>
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{locale === 'zh' ? '本周洞察' : 'Weekly Insight'}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    {locale === 'zh' ? 'AI 分析' : 'AI Analysis'}
                  </p>
                </div>
              </div>
              {patternLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? '分析中...' : 'Analyzing...'}
                  </span>
                </div>
              ) : patternError ? (
                <button
                  onClick={() => analyzePatterns(journalEntries, assessmentResults, true).then(r => {
                    if ('error' in r) setPatternError(r.error);
                    else { setPatternAnalysis(r); setPatternError(null); }
                  })}
                  className="text-sm underline" style={{ color: 'var(--muted)' }}
                >
                  {patternError} — {locale === 'zh' ? '点击重试' : 'Tap to retry'}
                </button>
              ) : patternAnalysis ? (
                <div>
                  <p className="text-sm leading-relaxed">{patternAnalysis.summary}</p>
                  {patternAnalysis.patterns.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {patternAnalysis.patterns.slice(0, 2).map(p => (
                        <div key={p.id} className="flex items-start gap-2">
                          <span className="text-sm" style={{ color: p.severity === 'high' ? 'var(--error)' : 'var(--accent)' }}>
                            {p.severity === 'high' ? '⚠️' : p.severity === 'medium' ? '⚡' : '💡'}
                          </span>
                          <span className="text-xs">{p.trigger}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '记录更多数据以获得洞察' : 'Log more data to get insights'}
                </p>
              )}
            </div>

            {/* Week Calendar */}
            <div className="p-6 rounded-xl border md:col-span-2" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '本周心情' : 'This Week'}
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, i) => {
                  const mood = getMoodForDate(day);
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  return (
                    <button key={i} onClick={() => setSelectedDate(day)}
                      className="p-3 rounded-lg border text-center transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg)',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                        color: isSelected ? 'white' : 'var(--text)',
                      }}>
                      <p className="text-xs mb-1" style={{ color: isSelected ? 'white' : 'var(--muted)' }}>
                        {day.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }).slice(0, 2)}
                      </p>
                      {mood !== null ? (
                        <>
                          <p className="text-lg font-bold">{Math.round(mood)}</p>
                          <div className="h-1 rounded-full mt-1 mx-auto w-8"
                            style={{ backgroundColor: isSelected ? 'white' : 'var(--accent)' }} />
                        </>
                      ) : (
                        <p className="text-lg">-</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today's Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Journal Entries */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '今日日记' : "Today's Journal"}
                </h3>
                <Link href="/journal" className="text-xs" style={{ color: 'var(--accent)' }}>
                  {locale === 'zh' ? '写日记' : 'Write Entry'}
                </Link>
              </div>
              {todayEntries.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">📔</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? '今天还没有日记' : 'No journal entries today'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEntries.slice(0, 3).map(entry => (
                    <div key={entry.id} className="p-3 rounded-lg border"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{entry.moodScore}/10</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{getMoodLabel(entry.moodScore)}</span>
                      </div>
                      {entry.textEntry && (
                        <p className="text-sm line-clamp-2">{entry.textEntry}</p>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>
                              {getTagIcon(tag)} {locale === 'zh' ? tag : tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Assessments */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '近期评估' : 'Recent Assessments'}
                </h3>
                <Link href="/assessment" className="text-xs" style={{ color: 'var(--accent)' }}>
                  {locale === 'zh' ? '新评估' : 'New'}
                </Link>
              </div>
              {assessmentResults.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? '还没有评估记录' : 'No assessments yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessmentResults.slice(0, 3).map(result => (
                    <div key={result.id} className="p-3 rounded-lg border"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-medium">{result.type.toUpperCase()}</span>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {new Date(result.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{result.totalScore}</span>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{locale === 'zh' ? result.severityZh : result.severity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unified Mood Timeline */}
          <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '心情时间线' : 'Mood Timeline'}
              </h3>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {selectedDate.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' })}
              </span>
            </div>

            {(() => {
              const dateStr = selectedDate.toDateString();
              const entries: TimelineEntry[] = [];

              journalEntries
                .filter(e => new Date(e.createdAt).toDateString() === dateStr)
                .forEach(e => {
                  entries.push({
                    id: e.id,
                    date: new Date(e.createdAt),
                    type: 'journal',
                    score: e.moodScore,
                    label: e.moodScore + '/10',
                    detail: e.textEntry || (locale === 'zh' ? '心情记录' : 'Mood entry'),
                    icon: '📔',
                  });
                });

              assessmentResults
                .filter(r => new Date(r.createdAt).toDateString() === dateStr)
                .forEach(r => {
                  entries.push({
                    id: r.id,
                    date: new Date(r.createdAt),
                    type: 'assessment',
                    score: r.totalScore,
                    label: r.type.toUpperCase() + ' ' + r.totalScore,
                    detail: locale === 'zh' ? r.interpretationZh : r.interpretation,
                    icon: '📋',
                  });
                });

              exerciseCompletions
                .filter(e => new Date(e.createdAt).toDateString() === dateStr)
                .forEach(e => {
                  entries.push({
                    id: e.id,
                    date: new Date(e.createdAt),
                    type: 'exercise',
                    score: undefined,
                    label: e.exerciseId,
                    detail: (locale === 'zh' ? '完成' : 'Completed') + ` ${e.durationMin}min`,
                    icon: '🧘',
                  });
                });

              chatSessions
                .filter(c => new Date(c.createdAt).toDateString() === dateStr && c.messageCount > 5)
                .forEach(c => {
                  entries.push({
                    id: c.id,
                    date: new Date(c.createdAt),
                    type: 'chat',
                    score: undefined,
                    label: locale === 'zh' ? '对话' : 'Chat',
                    detail: c.messageCount + ' ' + (locale === 'zh' ? '条消息' : 'messages'),
                    icon: '💬',
                  });
                });

              entries.sort((a, b) => a.date.getTime() - b.date.getTime());

              if (entries.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '这天还没有记录' : 'No entries for this day'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border)' }} />
                  <div className="space-y-4">
                    {entries.map(entry => (
                      <div key={entry.id} className="flex items-start gap-4 relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10"
                          style={{ backgroundColor: 'var(--bg)', borderWidth: '2px', borderColor: 'var(--accent)' }}>
                          {entry.icon}
                        </div>
                        <div className="flex-1 min-w-0 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{entry.label}</span>
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>
                              {entry.date.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {entry.detail && (
                            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{entry.detail}</p>
                          )}
                          {entry.score !== undefined && (
                            <div className="mt-1 flex items-center gap-1">
                              <div className="h-1.5 rounded-full flex-1 max-w-20" style={{ backgroundColor: 'var(--border)' }}>
                                <div className="h-full rounded-full" style={{
                                  backgroundColor: 'var(--accent)',
                                  width: `${(entry.score / 10) * 100}%`,
                                }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Streak indicator */}
          {(() => {
            const trackingDays = weekDays.filter(day => {
              const dateStr = day.toDateString();
              return (
                journalEntries.some(e => new Date(e.createdAt).toDateString() === dateStr) ||
                assessmentResults.some(r => new Date(r.createdAt).toDateString() === dateStr) ||
                exerciseCompletions.some(e => new Date(e.createdAt).toDateString() === dateStr) ||
                chatSessions.some(c => new Date(c.createdAt).toDateString() === dateStr && c.messageCount > 5)
              );
            });
            if (trackingDays.length === 0) return null;
            return (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--accent)', borderWidth: '1px', borderColor: 'var(--border)' }}>
                  🔥 {trackingDays.length}/7 {locale === 'zh' ? '天追踪' : 'days tracked'}
                </span>
              </div>
            );
          })()}

          {/* Suggested Exercises */}
          <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '推荐练习' : 'Suggested Exercises'}
              </h3>
              <Link href="/exercises" className="text-xs font-medium px-3 py-1.5 rounded"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                {locale === 'zh' ? '查看全部' : 'View All'}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'breathing', icon: '🌬️', name: locale === 'zh' ? '深呼吸' : 'Breathing', desc: locale === 'zh' ? '快速放松' : 'Quick relax' },
                { id: 'grounding', icon: '🌍', name: locale === 'zh' ? '接地练习' : 'Grounding', desc: locale === 'zh' ? '缓解焦虑' : 'Calm anxiety' },
                { id: 'gratitude', icon: '🙏', name: locale === 'zh' ? '感恩冥想' : 'Gratitude', desc: locale === 'zh' ? '提升幸福感' : 'Boost mood' },
                { id: 'body-scan', icon: '🧘', name: locale === 'zh' ? '身体扫描' : 'Body Scan', desc: locale === 'zh' ? '释放紧张' : 'Release tension' },
              ].map(ex => (
                <Link key={ex.id} href="/exercises"
                  className="p-4 rounded-lg border text-center transition-colors hover:border-accent-primary"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <span className="text-2xl mb-2 block">{ex.icon}</span>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{ex.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
