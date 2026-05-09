'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dbClient } from '@/features/database/shared/client';
import type { ConversationInfo } from '@/features/database/shared/client';
import type { Message } from '@/features/ai/shared/types';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { FooterNav } from '@/components/navigation/FooterNav';
import { Sidebar } from '@/components/navigation/Sidebar';

interface AssessmentWithScore extends ConversationInfo {
  moodScore: number;
  themes: string[];
  summary: string;
}

// Pattern detection result
interface Pattern {
  type: 'threshold' | 'trend' | 'frequency' | 'correlation';
  description: string;
  severity: 'info' | 'warning';
}

// Rules-based pattern detector
function detectPatterns(scores: { date: string; score: number }[], themes: string[]): Pattern[] {
  const patterns: Pattern[] = [];

  if (scores.length < 3) return patterns;

  // Threshold pattern: score below threshold
  const lowScores = scores.filter(s => s.score < 5);
  if (lowScores.length >= 3) {
    patterns.push({
      type: 'threshold',
      description: 'Your score has been below 5 on several recent occasions. Consider checking in with yourself more often.',
      severity: 'warning',
    });
  }

  // Trend pattern: consistent decline
  const recent = scores.slice(-3);
  if (recent.length === 3 && recent[0].score > recent[1].score && recent[1].score > recent[2].score) {
    patterns.push({
      type: 'trend',
      description: 'Your scores have been declining over the past few sessions. This might be worth discussing with someone you trust.',
      severity: 'warning',
    });
  }

  // Theme correlation: work + low mood
  if (themes.includes('work') && scores.slice(-3).every(s => s.score < 6)) {
    patterns.push({
      type: 'correlation',
      description: 'Work stress appears to correlate with lower mood scores. When you notice work pressure building, try to add extra self-care.',
      severity: 'info',
    });
  }

  // Sleep + mood correlation
  if (themes.includes('sleep') && scores.slice(-3).some(s => s.score < 5)) {
    patterns.push({
      type: 'correlation',
      description: 'Sleep disruption often precedes lower mood. Consider addressing sleep hygiene if you notice this pattern.',
      severity: 'info',
    });
  }

  return patterns;
}

// 7-day trend chart
function TrendChart({ scores, locale }: { scores: { date: string; score: number }[]; locale: string }) {
  if (scores.length === 0) {
    return (
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{locale === 'zh' ? '还没有足够的数据来显示趋势' : 'No trend data available yet. Complete more assessments to see your patterns.'}</p>
      </div>
    );
  }

  const maxScore = 10;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 30, left: 20 };
  const chartWidth = 320;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Generate week grid
  const now = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  // Map scores to days
  const scoreMap = new Map(scores.map(s => [s.date.slice(0, 10), s.score]));
  const dataPoints = weekDays.map(day => ({
    day,
    score: scoreMap.get(day) ?? null,
  }));

  // SVG polyline for trend line
  const points = dataPoints
    .map((d, i) => {
      if (d.score === null) return null;
      const x = padding.left + (i / 6) * plotWidth;
      const y = padding.top + plotHeight - (d.score / maxScore) * plotHeight;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {locale === 'zh' ? '心情趋势（近7天）' : '7-Day Mood Trend'}
        </h3>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {locale === 'zh' ? '平均' : 'Avg'}: {scores.length > 0 ? (scores.reduce((s, v) => s + v.score, 0) / scores.length).toFixed(1) : '-'} / 10
        </span>
      </div>

      <svg width={chartWidth} height={chartHeight + 20} className="block">
        {/* Y-axis labels */}
        {[0, 5, 10].map(v => {
          const y = padding.top + plotHeight - (v / maxScore) * plotHeight;
          return (
            <g key={v}>
              <text x={padding.left - 5} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" style={{ color: 'var(--muted)' }}>
                {v}
              </text>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="currentColor" strokeWidth="0.5" style={{ stroke: 'var(--border)' }} />
            </g>
          );
        })}

        {/* Data line */}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ stroke: 'var(--accent)' }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {dataPoints.map((d, i) => {
          if (d.score === null) return null;
          const x = padding.left + (i / 6) * plotWidth;
          const y = padding.top + plotHeight - (d.score / maxScore) * plotHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="currentColor"
              style={{ fill: 'var(--accent)' }}
            />
          );
        })}

        {/* X-axis labels */}
        {dataPoints.map((d, i) => {
          const x = padding.left + (i / 6) * plotWidth;
          const label = new Date(d.day).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' }).slice(0, 2);
          return (
            <text key={i} x={x} y={chartHeight + 15} textAnchor="middle" fontSize="10" fill="currentColor" style={{ color: 'var(--muted)' }}>
              {label}
            </text>
          );
        })}
      </svg>

      {/* Stats row */}
      <div className="flex justify-between mt-3 text-xs" style={{ color: 'var(--muted)' }}>
        <span>{locale === 'zh' ? '最低' : 'Worst'}: {Math.min(...scores.map(s => s.score))}</span>
        <span>{locale === 'zh' ? '最高' : 'Best'}: {Math.max(...scores.map(s => s.score))}</span>
        <span>{locale === 'zh' ? '次数' : 'Count'}: {scores.length}</span>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const { locale } = useLocale();
  const [assessments, setAssessments] = useState<ConversationInfo[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<{
    id: string;
    createdAt: string;
    moodScore: number;
    summary: string;
    themes: string[];
    riskIndicators: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekScores, setWeekScores] = useState<{ date: string; score: number }[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [recentRiskCount, setRecentRiskCount] = useState(0);

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    if (assessments.length > 0) {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const recent = assessments
        .filter(a => new Date(a.createdAt).getTime() > sevenDaysAgo)
        .map(a => {
          const m = a.preview.match(/(\d+)\/10/);
          return {
            date: a.createdAt,
            score: m ? parseInt(m[1]) : 5,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setWeekScores(recent);

      // Compute patterns
      const allThemes = assessments
        .filter(a => new Date(a.createdAt).getTime() > sevenDaysAgo)
        .map(a => {
          const lower = a.preview.toLowerCase();
          const themes: string[] = [];
          if (lower.includes('sleep')) themes.push('sleep');
          if (lower.includes('work')) themes.push('work');
          if (lower.includes('anxiety')) themes.push('anxiety');
          return themes;
        })
        .flat();
      setPatterns(detectPatterns(recent, allThemes));

      // Count recent risk indicator sessions
      const riskCount = assessments.filter(a => {
        const lower = a.preview.toLowerCase();
        return lower.includes('risk') || lower.includes('crisis');
      }).length;
      setRecentRiskCount(riskCount);
    }
  }, [assessments]);

  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      const list = await dbClient.listConversations('assessment');
      setAssessments(list);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssessmentDetails = async (id: string) => {
    try {
      const messages: Message[] = await dbClient.loadConversation(id);
      const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
      const scoreMatch = lastAiMessage.match(/(\d+)\/10/);
      const moodScore = scoreMatch ? parseInt(scoreMatch[1]) : 5;

      const conversationText = messages.map(m => m.content).join('\n');
      const summaryMatch = conversationText.match(/SUMMARY:\s*([\s\S]*?)(?:\nSCORE:|$)/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : (locale === 'zh' ? '评估完成。' : 'Assessment completed.');

      const themes: string[] = [];
      const lowerText = conversationText.toLowerCase();
      if (lowerText.includes('sleep') || lowerText.includes('insomnia')) themes.push('sleep');
      if (lowerText.includes('work') || lowerText.includes('deadline')) themes.push('work');
      if (lowerText.includes('anxious') || lowerText.includes('anxiety')) themes.push('anxiety');

      const riskIndicators: string[] = [];
      if (lowerText.includes('self-harm')) riskIndicators.push('self-harm');
      if (lowerText.includes('suicide') || lowerText.includes('ideation')) riskIndicators.push('ideation');

      const conv = assessments.find(a => a.id === id);
      setSelectedAssessment({
        id,
        createdAt: conv?.createdAt || new Date().toISOString(),
        moodScore,
        summary,
        themes,
        riskIndicators,
      });
    } catch (err) {
      console.error('Failed to load assessment:', err);
    }
  };

  const handleExport = async (assessment: typeof selectedAssessment) => {
    if (!assessment) return;

    const exportText = `HEARTMIRROR ${locale === 'zh' ? '自我评估摘要' : 'SELF-ASSESSMENT'}
${'='.repeat(40)}
${locale === 'zh' ? '日期' : 'Date'}: ${new Date(assessment.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
${new Date(assessment.createdAt).toLocaleTimeString()}

${locale === 'zh' ? '心情分数' : 'MOOD SCORE'}: ${assessment.moodScore}/10
${locale === 'zh' ? '此分数为自我报告，代表用户对自己整体心理状态的评分。' : 'This score is self-reported and represents how the user rated their overall mental state.'}

${locale === 'zh' ? '主要主题' : 'KEY THEMES'}:
${assessment.themes.length > 0 ? assessment.themes.map(t => '  - ' + t).join('\n') : locale === 'zh' ? '  - 未指定' : '  - None specified'}

${locale === 'zh' ? '安全提示' : 'SAFETY CONCERNS'}:
${assessment.riskIndicators.length > 0
  ? '  - ' + (locale === 'zh' ? '存在风险指标：' : 'Risk indicators present: ') + assessment.riskIndicators.join(', ') + '\n  - ' + (locale === 'zh' ? '请在评估时注意安全' : 'Please assess for safety when reviewing this assessment.')
  : locale === 'zh' ? '  - 评估中未报告急性安全问题' : '  - No acute safety concerns endorsed in assessment'}

AI ${locale === 'zh' ? '总结' : 'SUMMARY'}:
${assessment.summary}

${'='.repeat(40)}
${locale === 'zh' ? '关于此评估' : 'About This Assessment'}
HeartMirror ${locale === 'zh' ? '是一款心理健康自我管理工具。' : 'is a mental health self-management tool.'}
${locale === 'zh' ? '这不是临床诊断，不应作为专业心理健康护理的替代品。' : 'It is not a clinical diagnosis and should not be used as a substitute for professional mental health care.'}
${locale === 'zh' ? '请与合格的心理健康专业人员一起审查。' : 'Please review with a qualified mental health professional.'}
${locale === 'zh' ? '危机支持' : 'For crisis support'}: 988 (${locale === 'zh' ? '美国' : 'US'}) | findahelpline.com`;

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartmirror-assessment-${new Date(assessment.createdAt).toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) return locale === 'zh' ? '今天' : 'Today';
    if (diff < 7 * day) return Math.floor(diff / day) + (locale === 'zh' ? '天前' : ' days ago');
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px]">
        {/* Header */}
        <div className="px-4 py-4 border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">{t(locale, 'tracker.title')}</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '追踪你的心理健康趋势' : 'Track patterns in your mental health'}
            </p>
          </div>
          <Link
            href="/assessment"
            className="text-white rounded px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + {t(locale, 'tracker.newAssessment')}
          </Link>
        </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-xl mx-auto p-4 space-y-4">
        {/* 3+ risk sessions alert */}
        {recentRiskCount >= 3 && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)', borderWidth: '1px', borderStyle: 'solid' }}>
            <p className="font-medium mb-1" style={{ color: 'var(--error)' }}>
              {locale === 'zh' ? '建议寻求支持' : 'Consider reaching out for support'}
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--error)' }}>
              {locale === 'zh'
                ? `你最近有 ${recentRiskCount} 次评估显示需要关注。心理健康专业人士可以帮助你建立有效的应对策略。`
                : `You've had ${recentRiskCount} sessions with safety concerns recently. A mental health professional can help you build coping strategies that work for you.`}
            </p>
            <a
              href="https://findahelpline.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline hover:no-underline"
              style={{ color: 'var(--error)' }}
            >
              {locale === 'zh' ? '寻找附近的治疗师 →' : 'Find a therapist near you →'}
            </a>
          </div>
        )}

        {/* 7-day trend chart */}
        <TrendChart scores={weekScores} locale={locale} />

        {/* Pattern insights */}
        {patterns.length > 0 && (
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
              {t(locale, 'tracker.patternsDetected')}
            </h3>
            <div className="space-y-2">
              {patterns.map((p, i) => (
                <div
                  key={i}
                  className="p-3 rounded text-sm"
                  style={{
                    backgroundColor: p.severity === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg)',
                    borderColor: p.severity === 'warning' ? 'var(--warning)' : 'var(--border)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: p.severity === 'warning' ? 'var(--warning)' : 'var(--muted)',
                  }}
                >
                  {p.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment history */}
        {isLoading ? (
          <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
            {t(locale, 'common.loading')}
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            <p className="mb-3" style={{ color: 'var(--muted)' }}>{t(locale, 'tracker.noAssessments')}</p>
            <Link
              href="/assessment"
              className="hover:underline text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {t(locale, 'tracker.startFirst')}
            </Link>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              {t(locale, 'tracker.history')}
            </h3>
            <div className="space-y-2">
              {assessments.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadAssessmentDetails(conv.id)}
                  className="rounded-lg p-3 cursor-pointer transition-colors"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{formatDate(conv.createdAt)}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {(() => { const m = conv.preview.match(/(\d+)\/10/); return m ? m[1] : '?'; })()}/10
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(parseInt(conv.preview.match(/(\d+)\/10/)?.[1] || '5') / 10) * 100}%`, backgroundColor: 'var(--accent)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {new Date(selectedAssessment.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(selectedAssessment.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="text-2xl leading-none"
                style={{ color: 'var(--muted)' }}
              >
                ×
              </button>
            </div>

            {selectedAssessment.riskIndicators.length > 0 && (
              <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--error)' }}>
                <strong>{locale === 'zh' ? '安全提示' : 'Safety note'}:</strong> {locale === 'zh' ? '此评估中存在风险指标，请考虑与心理健康专业人士讨论。' : 'Risk indicators were present in this assessment. Please consider discussing with a mental health professional.'}
              </div>
            )}

            <div className="text-center mb-5">
              <div className="text-5xl font-bold" style={{ color: 'var(--accent)' }}>
                {selectedAssessment.moodScore}/10
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {locale === 'zh' ? '自我报告心情' : 'Self-reported mood'}
              </div>
            </div>

            {selectedAssessment.themes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                  {locale === 'zh' ? '识别的主题' : 'Themes identified'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedAssessment.themes.map(t => (
                    <span key={t} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{selectedAssessment.summary}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleExport(selectedAssessment)}
                className="w-full text-white rounded px-4 py-3 font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                📄 {t(locale, 'tracker.exportReport')}
              </button>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="w-full rounded px-4 py-3 font-medium"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
              >
                {t(locale, 'common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}