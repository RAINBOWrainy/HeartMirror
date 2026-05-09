'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { Sidebar } from '@/components/navigation/Sidebar';
import { phq9Questions, phq9Options, calculatePHQ9 } from '@/components/assessments/PHQ9';
import { gad7Questions, gad7Options, calculateGAD7 } from '@/components/assessments/GAD7';
import type { StandardizedTestType, StandardizedTestResult } from '@/features/tracker/types';
import type { Message } from '@/features/ai/shared/types';

type AssessmentType = 'conversational' | 'standardized' | null;
type StandardizedTest = 'phq-9' | 'gad-7' | null;
type Screen = 'select-type' | 'select-test' | 'test' | 'result' | 'settings';

const API_KEY_STORAGE_KEY = 'heartmirror-api-key';

export default function AssessmentPage() {
  const { locale } = useLocale();
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(null);
  const [standardizedTest, setStandardizedTest] = useState<StandardizedTest>(null);
  const [screen, setScreen] = useState<Screen>('select-type');
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // PHQ-9/GAD-7 state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [testResult, setTestResult] = useState<StandardizedTestResult | null>(null);

  // Conversational state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsLoadingSettings(false);
    } else {
      setShowSettings(true);
      setIsLoadingSettings(false);
    }
  }, []);

  const handleSelectType = (type: AssessmentType) => {
    setAssessmentType(type);
    if (type === 'conversational') {
      setScreen('settings');
    } else {
      setScreen('select-test');
    }
  };

  const handleSelectTest = (test: StandardizedTest) => {
    setStandardizedTest(test);
    setAnswers([]);
    setCurrentQuestion(0);
    setScreen('test');
  };

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    const questions = standardizedTest === 'phq-9' ? phq9Questions : gad7Questions;

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Test complete - calculate result
      const result = standardizedTest === 'phq-9'
        ? calculatePHQ9(newAnswers)
        : calculateGAD7(newAnswers);

      const testResult: StandardizedTestResult = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        type: standardizedTest as StandardizedTestType,
        status: 'completed',
        rawScores: newAnswers,
        totalScore: result.total,
        severity: locale === 'zh' ? result.severityZh : result.severity,
        interpretation: locale === 'zh' ? result.interpretationZh : result.interpretation,
        crisisTriggered: standardizedTest === 'phq-9' && newAnswers[8] > 0,
      };

      setTestResult(testResult);
      setScreen('result');
    }
  };

  const handleSaveSettings = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setShowSettings(false);
    setScreen('select-type');
  };

  const startNew = () => {
    setAssessmentType(null);
    setStandardizedTest(null);
    setTestResult(null);
    setAnswers([]);
    setCurrentQuestion(0);
    setScreen('select-type');
  };

  // Loading
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <p style={{ color: 'var(--muted)' }}>{t(locale, 'common.loading')}</p>
      </div>
    );
  }

  // Settings screen
  if (showSettings) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md p-6 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-semibold mb-2">{t(locale, 'settings.title')}</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '请配置您的AI服务商以开始评估' : 'Configure your AI provider to start the assessment'}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t(locale, 'settings.apiKey')}</label>
              <input
                type="password"
                id="apiKeyInput"
                placeholder="sk-..."
                className="w-full px-3 py-2.5 rounded border text-base-text focus:outline-none focus:ring-2 focus:ring-accent-primary min-h-[44px]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <button
              onClick={() => {
                const input = document.getElementById('apiKeyInput') as HTMLInputElement;
                if (input.value.trim()) {
                  handleSaveSettings(input.value.trim());
                }
              }}
              className="w-full text-white rounded px-4 py-3 font-medium min-h-[44px]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t(locale, 'settings.save')}
            </button>
          </div>
          <div className="mt-4 text-xs text-center" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? 'HeartMirror 不能替代专业心理健康护理' : 'HeartMirror is not a substitute for professional mental health care.'}
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Type selection
  if (screen === 'select-type') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col items-center justify-center p-4 min-h-screen pb-20">
          <div className="w-full max-w-lg">
            <h1 className="text-2xl font-semibold text-center mb-2">{t(locale, 'assessment.title')}</h1>
            <p className="text-center mb-8" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.selectType')}</p>

            <div className="grid grid-cols-1 gap-4">
              {/* Conversational Assessment */}
              <button
                onClick={() => handleSelectType('conversational')}
                className="p-6 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">💬</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(locale, 'assessment.conversational')}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.conversationalDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Standardized Test */}
              <button
                onClick={() => handleSelectType('standardized')}
                className="p-6 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📋</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(locale, 'assessment.standardized')}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.standardizedDesc')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <Sidebar locale={locale} />
      </div>
    );
  }

  // Test selection (PHQ-9 or GAD-7)
  if (screen === 'select-test') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col items-center justify-center p-4 min-h-screen pb-20">
          <div className="w-full max-w-lg">
            <h2 className="text-xl font-semibold text-center mb-8">{t(locale, 'assessment.standardized')}</h2>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleSelectTest('phq-9')}
                className="p-6 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📊</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(locale, 'assessment.phq9')}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.phq9Desc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectTest('gad-7')}
                className="p-6 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">😰</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(locale, 'assessment.gad7')}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.gad7Desc')}</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setScreen('select-type')}
              className="mt-6 w-full py-3 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              ← {t(locale, 'common.previous')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test questions screen
  if (screen === 'test') {
    const questions = standardizedTest === 'phq-9' ? phq9Questions : gad7Questions;
    const options = standardizedTest === 'phq-9' ? phq9Options : gad7Options;
    const question = questions[currentQuestion];
    const questionText = locale === 'zh' ? question.question.zh : question.question.en;

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col min-h-screen pb-20">
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setScreen('select-test')}
                className="text-sm"
                style={{ color: 'var(--muted)' }}
              >
                ← {t(locale, 'common.backToChat')}
              </button>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {t(locale, 'assessment.question')} {currentQuestion + 1} {t(locale, 'assessment.of')} {questions.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: 'var(--accent)',
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-xl font-medium text-center mb-8 max-w-md">
              {questionText}
            </h2>

            <div className="w-full max-w-md space-y-3">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full p-4 rounded-lg border text-left transition-colors hover:border-accent-primary"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  {t(locale, `assessment.${option.labelKey}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  if (screen === 'result' && testResult) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col items-center justify-center p-4 min-h-screen pb-20">
          <div className="w-full max-w-md">
          <h2 className="text-xl font-semibold text-center mb-2">{t(locale, 'result.title')}</h2>
          <p className="text-center mb-8" style={{ color: 'var(--muted)' }}>
            {standardizedTest === 'phq-9' ? t(locale, 'assessment.phq9') : t(locale, 'assessment.gad7')}
          </p>

          {/* Score display */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4" style={{ borderColor: 'var(--accent)' }}>
              <div>
                <div className="text-4xl font-bold">{testResult.totalScore}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  /{standardizedTest === 'phq-9' ? '27' : '21'}
                </div>
              </div>
            </div>
          </div>

          {/* Severity */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
              {t(locale, 'assessment.severity')}: {testResult.severity}
            </p>
          </div>

          {/* Interpretation */}
          <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm">{testResult.interpretation}</p>
          </div>

          {/* Crisis warning */}
          {testResult.crisisTriggered && (
            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)' }}>
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                {locale === 'zh'
                  ? '根据你的回答，你可能需要寻求专业帮助。请考虑联系心理健康专业人士。'
                  : 'Based on your responses, you may need professional help. Please consider reaching out to a mental health professional.'}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--error)' }}>
                {t(locale, 'assessment.crisisHotline')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={startNew}
              className="w-full text-white rounded px-4 py-3 font-medium"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t(locale, 'assessment.startNew')}
            </button>
            <button
              onClick={() => setScreen('select-type')}
              className="w-full py-3 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {t(locale, 'assessment.title')}
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex items-center justify-center min-h-screen">
        <p>{t(locale, 'common.loading')}</p>
      </div>
    </div>
  );
}