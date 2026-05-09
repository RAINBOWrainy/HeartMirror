'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { Sidebar } from '@/components/navigation/Sidebar';
import type { MoodJournalEntry, StandardizedTestResult } from '@/features/tracker/types';

const JOURNAL_KEY = 'heartmirror-journal-entries';
const ASSESSMENTS_KEY = 'heartmirror-assessment-results';

const MOOD_LABELS_ZH = ['很低落', '低落', '有些低落', '略低', '一般', '略好', '不错', '良好', '很好', '非常好'];
const MOOD_LABELS_EN = ['Very Low', 'Low', 'Somewhat Low', 'Slightly Low', 'Neutral', 'Slightly Better', 'Good', 'Very Good', 'Great', 'Excellent'];

const MINDFULNESS_EXERCISES = [
  {
    id: 'breathing',
    icon: '🌬️',
    nameZh: '深呼吸练习',
    nameEn: 'Breathing Exercise',
    descriptionZh: '4-7-8 呼吸法：吸气4秒，屏息7秒，呼气8秒，重复3次',
    descriptionEn: '4-7-8 Breathing: Inhale 4s, hold 7s, exhale 8s. Repeat 3 times.',
    duration: '3 min',
    category: 'breathing',
  },
  {
    id: 'body-scan',
    icon: '🧘',
    nameZh: '身体扫描',
    nameEn: 'Body Scan',
    descriptionZh: '从脚趾到头顶，依次感受身体每个部位的放松',
    descriptionEn: 'Scan from toes to head, notice sensations in each body part.',
    duration: '5 min',
    category: 'relaxation',
  },
  {
    id: 'gratitude',
    icon: '🙏',
    nameZh: '感恩冥想',
    nameEn: 'Gratitude Meditation',
    descriptionZh: '闭眼想想3件让你感激的事，感受温暖的情绪',
    descriptionEn: 'Think of 3 things you are grateful for. Feel the warmth.',
    duration: '3 min',
    category: 'mindfulness',
  },
  {
    id: 'grounding',
    icon: '🌍',
    nameZh: '5-4-3-2-1 接地练习',
    nameEn: '5-4-3-2-1 Grounding',
    descriptionZh: '说出5样看到的东西、4样触摸、3样听到、2样闻到、1样尝到',
    descriptionEn: 'Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.',
    duration: '5 min',
    category: 'grounding',
  },
  {
    id: 'self-compassion',
    icon: '💚',
    nameZh: '自我慈悲',
    nameEn: 'Self-Compassion Break',
    descriptionZh: '觉察痛苦情绪，用温柔的话语安慰自己',
    descriptionEn: 'Notice pain, talk to yourself with kindness.',
    duration: '4 min',
    category: 'compassion',
  },
  {
    id: 'progressive-relaxation',
    icon: '😌',
    nameZh: '渐进式肌肉放松',
    nameEn: 'Progressive Relaxation',
    descriptionZh: '依次紧张和放松全身肌肉群，从脚到头',
    descriptionEn: 'Tense and release each muscle group from feet to head.',
    duration: '10 min',
    category: 'relaxation',
  },
  {
    id: 'loving-kindness',
    icon: '💕',
    nameZh: '慈心禅修',
    nameEn: 'Loving-Kindness',
    descriptionZh: '向自己、亲人、陌生人传递善意和祝福',
    descriptionEn: 'Send goodwill to yourself, loved ones, and strangers.',
    duration: '6 min',
    category: 'mindfulness',
  },
  {
    id: 'thought-observation',
    icon: '💭',
    nameZh: '观察想法',
    nameEn: 'Thought Observation',
    descriptionZh: '像天空观察云朵一样，观察流过的想法，不评判',
    descriptionEn: 'Watch thoughts pass like clouds in the sky, without judgment.',
    duration: '5 min',
    category: 'mindfulness',
  },
];

const TAG_CATEGORIES: Record<string, { icon: string; impact: 'positive' | 'negative' | 'neutral' }> = {
  sleep: { icon: '😴', impact: 'positive' },
  exercise: { icon: '🏃', impact: 'positive' },
  social: { icon: '👥', impact: 'positive' },
  mindfulness: { icon: '🧘', impact: 'positive' },
  diet: { icon: '🥗', impact: 'positive' },
  medication: { icon: '💊', impact: 'positive' },
  work: { icon: '💼', impact: 'negative' },
  relationships: { icon: '💔', impact: 'negative' },
  family: { icon: '👨‍👩‍👧', impact: 'neutral' },
  alone: { icon: '🧍', impact: 'neutral' },
};

export default function KanbanPage() {
  const { locale } = useLocale();
  const [journalEntries, setJournalEntries] = useState<MoodJournalEntry[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<StandardizedTestResult[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showExercise, setShowExercise] = useState<typeof MINDFULNESS_EXERCISES[0] | null>(null);
  const [exerciseActive, setExerciseActive] = useState(false);
  const [exercisePhase, setExercisePhase] = useState(0);

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
  }, []);

  // Get today's entries
  const todayEntries = journalEntries.filter(e => {
    const d = new Date(e.createdAt);
    return d.toDateString() === selectedDate.toDateString();
  });

  const todayMoodAvg = todayEntries.length > 0
    ? todayEntries.reduce((sum, e) => sum + e.moodScore, 0) / todayEntries.length
    : null;

  // Get entries for current week (for calendar view)
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

  // Analyze patterns
  const analyzeDay = () => {
    if (todayEntries.length === 0) return null;
    const tagCounts: Record<string, number> = {};
    const activities: string[] = [];
    todayEntries.forEach(e => {
      e.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    Object.entries(tagCounts).forEach(([tag, count]) => {
      const cat = TAG_CATEGORIES[tag];
      if (cat && count > 0) {
        activities.push(`${cat.icon} ${locale === 'zh' ? tag : tag}`);
      }
    });
    return activities;
  };

  const todayActivities = analyzeDay();

  // Get suggested exercises based on mood
  const getSuggestedExercises = () => {
    if (!todayMoodAvg) return MINDFULNESS_EXERCISES.slice(0, 3);
    if (todayMoodAvg <= 4) {
      return MINDFULNESS_EXERCISES.filter(e => ['breathing', 'grounding', 'self-compassion'].includes(e.id));
    }
    if (todayMoodAvg <= 6) {
      return MINDFULNESS_EXERCISES.filter(e => ['body-scan', 'progressive-relaxation', 'gratitude'].includes(e.id));
    }
    return MINDFULNESS_EXERCISES.filter(e => ['mindfulness', 'loving-kindness'].includes(e.id));
  };

  const suggestedExercises = getSuggestedExercises();

  const startExercise = () => {
    setExerciseActive(true);
    setExercisePhase(0);
  };

  const getMoodLabel = (score: number) => {
    return locale === 'zh' ? MOOD_LABELS_ZH[score - 1] : MOOD_LABELS_EN[score - 1];
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 p-4 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{locale === 'zh' ? '看板' : 'Dashboard'}</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '心理健康追踪与分析' : 'Mental Health Tracking & Analysis'}
              </p>
            </div>
            <Link href="/assessment" className="text-white rounded px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--accent)' }}>
              + {locale === 'zh' ? '新评估' : 'New Assessment'}
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Today's Overview */}
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '今日概览' : "Today's Overview"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mood Score */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">😊</span>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '平均心情' : 'Average Mood'}
                    </p>
                    {todayMoodAvg ? (
                      <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                        {todayMoodAvg.toFixed(1)}/10
                      </p>
                    ) : (
                      <p className="text-lg" style={{ color: 'var(--muted)' }}>
                        {locale === 'zh' ? '暂无数据' : 'No data'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Entries Count */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📔</span>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '日记条目' : 'Journal Entries'}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                      {todayEntries.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {locale === 'zh' ? '今日活动' : "Today's Activities"}
                    </p>
                    {todayActivities && todayActivities.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {todayActivities.slice(0, 4).map((a, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {locale === 'zh' ? '暂无' : 'None'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Calendar */}
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '本周心情' : 'This Week'}
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const mood = getMoodForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                return (
                  <button key={i} onClick={() => setSelectedDate(day)}
                    className="p-3 rounded-lg border text-center transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                      color: isSelected ? 'white' : 'var(--text)',
                    }}>
                    <p className="text-xs mb-1" style={{ color: isSelected ? 'white' : 'var(--muted)' }}>
                      {day.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }).slice(0, 2)}
                    </p>
                    {mood ? (
                      <>
                        <p className="text-lg font-bold">{Math.round(mood)}</p>
                        <div className="h-1 rounded-full mt-1" style={{
                          backgroundColor: isSelected ? 'white' : 'var(--accent)',
                          width: `${(mood / 10) * 100}%`,
                          margin: '0 auto',
                        }} />
                      </>
                    ) : (
                      <p className="text-lg">-</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mindfulness Exercises */}
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '正念练习推荐' : 'Recommended Mindfulness Exercises'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {suggestedExercises.map(ex => (
                <button key={ex.id} onClick={() => { setShowExercise(ex); setExerciseActive(false); }}
                  className="p-4 rounded-lg border text-left transition-colors hover:border-accent-primary"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{ex.icon}</span>
                    <span className="text-sm font-medium">
                      {locale === 'zh' ? ex.nameZh : ex.nameEn}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? ex.descriptionZh : ex.descriptionEn}
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>⏱ {ex.duration}</p>
                </button>
              ))}
            </div>
          </div>

          {/* All Exercises */}
          <div>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '全部练习' : 'All Exercises'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MINDFULNESS_EXERCISES.map(ex => (
                <button key={ex.id} onClick={() => { setShowExercise(ex); setExerciseActive(false); }}
                  className="p-4 rounded-lg border text-left transition-colors hover:border-accent-primary"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{ex.icon}</span>
                    <span className="text-sm font-medium">
                      {locale === 'zh' ? ex.nameZh : ex.nameEn}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded ml-auto"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                      {ex.duration}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? ex.descriptionZh : ex.descriptionEn}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      {showExercise && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">{showExercise.icon}</span>
                  {locale === 'zh' ? showExercise.nameZh : showExercise.nameEn}
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>⏱ {showExercise.duration}</p>
              </div>
              <button onClick={() => { setShowExercise(null); setExerciseActive(false); }}
                className="text-2xl leading-none" style={{ color: 'var(--muted)' }}>×</button>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text)' }}>
              {locale === 'zh' ? showExercise.descriptionZh : showExercise.descriptionEn}
            </p>
            {!exerciseActive ? (
              <button onClick={startExercise}
                className="w-full text-white rounded px-4 py-3 font-medium"
                style={{ backgroundColor: 'var(--accent)' }}>
                {locale === 'zh' ? '开始练习' : 'Start Exercise'}
              </button>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">
                  {exercisePhase % 2 === 0 ? '🌬️' : '😌'}
                </div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '练习进行中...' : 'In progress...'}
                </p>
                <button onClick={() => { setShowExercise(null); setExerciseActive(false); }}
                  className="mt-4 text-sm px-4 py-2 rounded border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                  {locale === 'zh' ? '结束' : 'End'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
