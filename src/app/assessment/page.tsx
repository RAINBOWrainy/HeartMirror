'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import { Sidebar } from '@/components/navigation/Sidebar';
import { CrisisSupportModal } from '@/components/CrisisSupport';
import { phq9Questions, phq9Options, calculatePHQ9 } from '@/components/assessments/PHQ9';
import { gad7Questions, gad7Options, calculateGAD7 } from '@/components/assessments/GAD7';
import type { StandardizedTestType, StandardizedTestResult } from '@/features/tracker/types';
import type { Message } from '@/features/ai/shared/types';

type AssessmentType = 'conversational' | 'standardized' | null;
type StandardizedTest = 'phq-9' | 'gad-7' | 'eds' | 'oq-45' | 'wsas' | null;
type Screen = 'select-type' | 'select-test' | 'test' | 'result' | 'settings' | 'conversational';

const CONVERSATIONAL_SYSTEM_PROMPT_ZH = `你叫HeartMirror，是一位温暖、善解人意的AI心理健康陪伴助手。你的任务是：

1. 用自然的对话方式了解用户的心理状态
2. 开始时温柔地询问最近有什么让你感到焦虑、难过或者困扰的事情
3. 根据用户的回答，用对话的形式深入了解情况（睡眠、工作、人际关系、情绪等）
4. 保持5-7轮对话，然后用温柔的方式做一个总结
5. 总结要包括：整体心情评分(1-10)、主要感受、可能的原因、简单的自我关爱建议

对话风格：
- 像朋友聊天一样自然，不要像医生问诊
- 可以根据时间调整开场（比如深夜就问"这么晚还没睡，是不是有什么心事？"）
- 如果用户不想说，不要强迫，温柔地换个方式接近
- 观察用户情绪变化，适时表达理解和共情
- 用温暖的语气，偶尔可以有一些轻松的互动

评估标准：
- 心情评分(1-10)：1=非常低落，10=非常好
- 识别主要情绪：焦虑、沮丧、孤独、压力大、迷茫等
- 识别相关生活领域：睡眠、工作、人际关系、家庭、健康等

危机识别：
- 如果用户提到自我伤害或自杀念头，立即提供危机热线信息

总结格式（当对话足够后自动生成）：
【评估总结】
心情评分：X/10
主要感受：[情绪描述]
可能原因：[简要分析]
建议：[1-2个简单的自我关爱方法]

记住：你不是要替代专业心理治疗，而是在用户需要倾诉时提供一个安全的空间。`;

const CONVERSATIONAL_SYSTEM_PROMPT_EN = `You are HeartMirror, a warm and empathetic AI mental health companion. Your task is:

1. Get to know the user's mental state through natural conversation
2. Gently ask what's been making them feel anxious, sad, or troubled at the start
3. Based on their responses, explore deeper (sleep, work, relationships, emotions) through conversation
4. Keep 5-7 turns of dialogue, then gently provide a summary
5. Summary should include: overall mood score (1-10), main feelings, possible reasons, simple self-care suggestions

Conversation style:
- Natural like chatting with a friend, not like a doctor's interrogation
- Adjust opening based on time (e.g., late night: "Still up so late, is something on your mind?")
- If user doesn't want to talk, don't force, gently approach another way
- Watch for emotional changes, express understanding and empathy
- Warm tone, occasional light interaction is fine

Assessment criteria:
- Mood score (1-10): 1=very low, 10=excellent
- Identify main emotions: anxious, depressed, lonely, stressed, confused, etc.
- Identify related life areas: sleep, work, relationships, family, health, etc.

Crisis recognition:
- If user mentions self-harm or suicidal thoughts, immediately provide crisis hotline info

Summary format (auto-generated when conversation is sufficient):
【Assessment Summary】
Mood Score: X/10
Main Feelings: [emotion description]
Possible Reasons: [brief analysis]
Suggestions: [1-2 simple self-care methods]

Remember: you're not replacing professional mental health treatment, but providing a safe space when users need to talk.`;

const API_KEY_STORAGE_KEY = 'heartmirror-api-key';
const PROVIDER_STORAGE_KEY = 'heartmirror-provider';
const BASE_URL_STORAGE_KEY = 'heartmirror-base-url';
const MODEL_STORAGE_KEY = 'heartmirror-model';

const PRESETS = {
  anthropic: { baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-3-sonnet-20240229', requiresApiKey: true },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', requiresApiKey: true },
  ollama: { baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3', requiresApiKey: false },
  custom: { baseUrl: '', defaultModel: '', requiresApiKey: true },
};

const STANDARDIZED_TESTS = [
  {
    id: 'phq-9' as const,
    name: 'PHQ-9',
    nameZh: '抑郁症筛查量表',
    icon: '📊',
    description: 'Patient Health Questionnaire-9',
    descriptionZh: '评估过去两周的抑郁症状严重程度',
    source: 'https://www.phqscreeners.com/',
    questions: 9,
    maxScore: 27,
  },
  {
    id: 'gad-7' as const,
    name: 'GAD-7',
    nameZh: '焦虑障碍自评量表',
    icon: '😰',
    description: 'Generalized Anxiety Disorder-7',
    descriptionZh: '评估过去两周的焦虑症状严重程度',
    source: 'https://www.phqscreeners.com/',
    questions: 7,
    maxScore: 21,
  },
  {
    id: 'eds' as const,
    name: 'EDS',
    nameZh: '情感困难量表',
    icon: '💔',
    description: 'Ewing Depression Scale',
    descriptionZh: '评估情感和身体抑郁症状',
    source: 'https://www.sciencedirect.com/science/article/pii/S1064748812603181',
    questions: 12,
    maxScore: 48,
  },
  {
    id: 'oq-45' as const,
    name: 'OQ-45',
    nameZh: '结果问卷-45',
    icon: '📋',
    description: 'Outcome Questionnaire-45',
    descriptionZh: '评估心理状态和治疗进展',
    source: 'https://www.sWINstitute.org/oq45/',
    questions: 45,
    maxScore: 180,
  },
  {
    id: 'wsas' as const,
    name: 'WSAS',
    nameZh: '工作与社会适应量表',
    icon: '💼',
    description: 'Work and Social Adjustment Scale',
    descriptionZh: '评估工作和社会功能损害程度',
    source: 'https://www.psyctc.org/praz/',
    questions: 5,
    maxScore: 40,
  },
];

// EDS Questions (simplified version based on Ewing depression scale)
const edsQuestions = [
  { question: { en: 'How often have you felt that life was not worth living?', zh: '你多久感觉一次生命不值得活下去？' } },
  { question: { en: 'How often have you felt depressed?', zh: '你多久感觉一次沮丧？' } },
  { question: { en: 'How often have you had crying spells?', zh: '你多久哭一次？' } },
  { question: { en: 'How often have you felt hopeless?', zh: '你多久感觉一次绝望？' } },
  { question: { en: 'How often have you felt pessimistic about the future?', zh: '你多久对未来悲观一次？' } },
  { question: { en: 'How often have you felt irritable?', zh: '你多久感觉一次烦躁？' } },
  { question: { en: 'How often have you had loss of appetite?', zh: '你多久食欲减退一次？' } },
  { question: { en: 'How often have you had trouble sleeping?', zh: '你多久失眠一次？' } },
  { question: { en: 'How often have you felt tired?', zh: '你多久感觉一次疲倦？' } },
  { question: { en: 'How often have you had physical aches and pains?', zh: '你多久身体疼痛一次？' } },
  { question: { en: 'How often have you lost interest in activities?', zh: '你多久对活动失去兴趣一次？' } },
  { question: { en: 'How often have you had difficulty concentrating?', zh: '你多久注意力不集中一次？' } },
];

const edsOptions = [
  { value: 0, labelKey: 'assessment.optionNever' },
  { value: 1, labelKey: 'assessment.optionRarely' },
  { value: 2, labelKey: 'assessment.optionSometimes' },
  { value: 3, labelKey: 'assessment.optionOften' },
  { value: 4, labelKey: 'assessment.optionAlways' },
];

const calculateEDS = (scores: number[]) => {
  const total = scores.reduce((a, b) => a + b, 0);
  let severity = 'Minimal';
  let severityZh = '极轻微';
  let interpretation = 'No significant emotional difficulties detected.';
  let interpretationZh = '未检测到明显的情感困难。';
  if (total >= 20) { severity = 'Severe'; severityZh = '重度'; interpretation = 'Significant emotional distress requiring professional attention.'; interpretationZh = '需要专业关注的显著情感困扰。'; }
  else if (total >= 12) { severity = 'Moderate'; severityZh = '中度'; interpretation = 'Moderate emotional difficulties that may benefit from support.'; interpretationZh = '中等情感困难，可能需要支持。'; }
  else if (total >= 6) { severity = 'Mild'; severityZh = '轻度'; interpretation = 'Mild symptoms that can be managed with self-care.'; interpretationZh = '轻微症状，可以通过自我护理管理。'; }
  return { total, severity, severityZh, interpretation, interpretationZh };
};

// WSAS Questions
const wsasQuestions = [
  { question: { en: 'Work impairment: How much are you unable to work as well as you would like?', zh: '工作损害：你无法按自己想要的方式工作的程度？' } },
  { question: { en: 'Home management impairment: How much is your home management impaired?', zh: '家务管理损害：你的家务管理受损程度？' } },
  { question: { en: 'Social leisure impairment: How much is your social leisure time impaired?', zh: '社交休闲损害：你的社交休闲时间受损程度？' } },
  { question: { en: 'Private leisure impairment: How much is your private leisure activities impaired?', zh: '私人休闲损害：你的私人休闲活动受损程度？' } },
  { question: { en: 'Family and friendship impairment: How much is your ability to form and maintain close relationships impaired?', zh: '家庭友谊损害：你形成和维持亲密关系的能力受损程度？' } },
];

const wsasOptions = [
  { value: 0, labelKey: 'assessment.wsas0' },
  { value: 1, labelKey: 'assessment.wsas1' },
  { value: 2, labelKey: 'assessment.wsas2' },
  { value: 3, labelKey: 'assessment.wsas3' },
  { value: 4, labelKey: 'assessment.wsas4' },
  { value: 5, labelKey: 'assessment.wsas5' },
  { value: 6, labelKey: 'assessment.wsas6' },
  { value: 7, labelKey: 'assessment.wsas7' },
  { value: 8, labelKey: 'assessment.wsas8' },
];

const calculateWSAS = (scores: number[]) => {
  const total = scores.reduce((a, b) => a + b, 0);
  let severity = 'No impairment';
  let severityZh = '无损害';
  let interpretation = 'No significant functional impairment.';
  let interpretationZh = '无显著功能损害。';
  if (total >= 20) { severity = 'Severe impairment'; severityZh = '严重损害'; interpretation = 'Severe impairment in work and social functioning. Professional help recommended.'; interpretationZh = '工作和社交功能严重受损。建议寻求专业帮助。'; }
  else if (total >= 10) { severity = 'Moderate impairment'; severityZh = '中度损害'; interpretation = 'Moderate functional impairment affecting daily life.'; interpretationZh = '影响日常生活的中度功能损害。'; }
  else if (total >= 5) { severity = 'Mild impairment'; severityZh = '轻度损害'; interpretation = 'Mild impairment that may benefit from support.'; interpretationZh = '可能需要支持轻度损害。'; }
  return { total, severity, severityZh, interpretation, interpretationZh };
};

// OQ-45 Questions (simplified set for screening)
const oq45Questions = [
  { question: { en: 'I feel no hope about my future.', zh: '我对未来感到没有希望。' } },
  { question: { en: 'I feel lonely.', zh: '我感到孤独。' } },
  { question: { en: 'I am worried about my health.', zh: '我担心我的健康。' } },
  { question: { en: 'I have trouble sleeping.', zh: '我有睡眠问题。' } },
  { question: { en: 'I feel nervous.', zh: '我感到紧张。' } },
  { question: { en: 'I feel sad.', zh: '我感到悲伤。' } },
  { question: { en: 'I feel worthless.', zh: '我感到无价值。' } },
  { question: { en: 'I have trouble concentrating.', zh: '我难以集中注意力。' } },
  { question: { en: 'I have conflicts with others.', zh: '我与他人有冲突。' } },
  { question: { en: 'I am satisfied with my life.', zh: '我对生活感到满意。' } },
  { question: { en: 'I feel anxious about being with people.', zh: '与人在一起时我感到焦虑。' } },
  { question: { en: 'I feel like I want to give up.', zh: '我想放弃。' } },
  { question: { en: 'I feel irritation or anger.', zh: '我感到烦躁或愤怒。' } },
  { question: { en: 'I am able to complete tasks.', zh: '我能够完成任务。' } },
  { question: { en: 'I enjoy being with people.', zh: '我喜欢与人在一起。' } },
  { question: { en: 'I feel fatigued.', zh: '我感到疲倦。' } },
  { question: { en: 'I feel motivated.', zh: '我感到有动力。' } },
  { question: { en: 'I feel hopeless about relationships.', zh: '我对人际关系感到绝望。' } },
  { question: { en: 'I have good appetite.', zh: '我有好胃口。' } },
  { question: { en: 'I feel comfortable with my family.', zh: '我和家人相处舒适。' } },
  { question: { en: 'I feel loved and wanted.', zh: '我感到被爱和被需要。' } },
  { question: { en: 'I have enough energy for daily activities.', zh: '我有足够的精力进行日常活动。' } },
  { question: { en: 'I feel my life is meaningful.', zh: '我感到我的生活有意义。' } },
  { question: { en: 'I can laugh and see the humor in things.', zh: '我能笑并看到事物中的幽默。' } },
];

const oq45Options = [
  { value: 0, labelKey: 'assessment.optionNever' },
  { value: 1, labelKey: 'assessment.optionRarely' },
  { value: 2, labelKey: 'assessment.optionSometimes' },
  { value: 3, labelKey: 'assessment.optionOften' },
  { value: 4, labelKey: 'assessment.optionAlways' },
];

const calculateOQ45 = (scores: number[]) => {
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = total / scores.length;
  let severity = 'Normal';
  let severityZh = '正常';
  let interpretation = 'Symptoms within normal range.';
  let interpretationZh = '症状在正常范围内。';
  if (avg >= 3) { severity = 'Significant distress'; severityZh = '显著困扰'; interpretation = 'High levels of distress. Professional consultation recommended.'; interpretationZh = '高度困扰。建议专业咨询。'; }
  else if (avg >= 2) { severity = 'Moderate distress'; severityZh = '中度困扰'; interpretation = 'Moderate symptoms that may benefit from support.'; interpretationZh = '可能需要支持的中等症状。'; }
  else if (avg >= 1) { severity = 'Mild distress'; severityZh = '轻度困扰'; interpretation = 'Mild symptoms that can be addressed with self-care.'; interpretationZh = '可以通过自我护理解决的轻微症状。'; }
  return { total, severity, severityZh, interpretation, interpretationZh };
};

const getTestQuestions = (test: StandardizedTest) => {
  switch (test) {
    case 'phq-9': return { questions: phq9Questions, options: phq9Options, maxScore: 27 };
    case 'gad-7': return { questions: gad7Questions, options: gad7Options, maxScore: 21 };
    case 'eds': return { questions: edsQuestions, options: edsOptions, maxScore: 48 };
    case 'oq-45': return { questions: oq45Questions, options: oq45Options, maxScore: 100 };
    case 'wsas': return { questions: wsasQuestions, options: wsasOptions, maxScore: 40 };
    default: return { questions: phq9Questions, options: phq9Options, maxScore: 27 };
  }
};

const getTestCalculator = (test: StandardizedTest) => {
  switch (test) {
    case 'phq-9': return calculatePHQ9;
    case 'gad-7': return calculateGAD7;
    case 'eds': return calculateEDS;
    case 'oq-45': return calculateOQ45;
    case 'wsas': return calculateWSAS;
    default: return calculatePHQ9;
  }
};

export default function AssessmentPage() {
  const { locale } = useLocale();
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(null);
  const [standardizedTest, setStandardizedTest] = useState<StandardizedTest>(null);
  const [screen, setScreen] = useState<Screen>('select-type');
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'ollama' | 'custom'>('anthropic');
  const [baseUrl, setBaseUrl] = useState(PRESETS.anthropic.baseUrl);
  const [model, setModel] = useState(PRESETS.anthropic.defaultModel);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // PHQ-9/GAD-7/EDS/OQ-45/WSAS state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [testResult, setTestResult] = useState<StandardizedTestResult | null>(null);

  // Conversational state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationTurns, setConversationTurns] = useState(0);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [settingsProvider, setSettingsProvider] = useState<'anthropic' | 'openai' | 'ollama' | 'custom'>('anthropic');
  const [settingsBaseUrl, setSettingsBaseUrl] = useState(PRESETS.anthropic.baseUrl);
  const [settingsModel, setSettingsModel] = useState(PRESETS.anthropic.defaultModel);
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as 'anthropic' | 'openai' | 'ollama' | 'custom' | null;
    const savedBaseUrl = localStorage.getItem(BASE_URL_STORAGE_KEY);
    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setSettingsApiKey(savedApiKey);
    }
    if (savedProvider) {
      setProvider(savedProvider);
      setSettingsProvider(savedProvider);
      setBaseUrl(savedBaseUrl || PRESETS[savedProvider].baseUrl);
      setModel(savedModel || PRESETS[savedProvider].defaultModel);
    }
    setIsLoadingSettings(false);
    if (!savedApiKey) {
      setShowSettings(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProviderChange = (newProvider: 'anthropic' | 'openai' | 'ollama' | 'custom') => {
    setSettingsProvider(newProvider);
    const preset = PRESETS[newProvider];
    setSettingsBaseUrl(preset.baseUrl);
    setSettingsModel(preset.defaultModel);
    if (!preset.requiresApiKey) setSettingsApiKey('');
  };

  const handleSaveSettings = () => {
    const preset = PRESETS[settingsProvider];
    if (preset.requiresApiKey && !settingsApiKey.trim()) {
      alert(locale === 'zh' ? '请输入API密钥' : 'API key is required');
      return;
    }
    setApiKey(settingsApiKey.trim());
    setProvider(settingsProvider);
    setBaseUrl(settingsBaseUrl.trim());
    setModel(settingsModel.trim());
    localStorage.setItem(API_KEY_STORAGE_KEY, settingsApiKey.trim());
    localStorage.setItem(PROVIDER_STORAGE_KEY, settingsProvider);
    localStorage.setItem(BASE_URL_STORAGE_KEY, settingsBaseUrl.trim());
    localStorage.setItem(MODEL_STORAGE_KEY, settingsModel.trim());
    setShowSettings(false);
    setScreen('select-type');
  };

  const handleSelectType = (type: AssessmentType) => {
    setAssessmentType(type);
    if (type === 'conversational') {
      if (!apiKey) {
        setShowSettings(true);
      } else {
        setScreen('conversational');
        setMessages([]);
        setInput('');
        setConversationTurns(0);
      }
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
    const { questions } = getTestQuestions(standardizedTest);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const calculator = getTestCalculator(standardizedTest);
      const result = calculator(newAnswers);
      const crisisTriggered = standardizedTest === 'phq-9' && newAnswers[8] > 0;
      const testResult: StandardizedTestResult = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        type: standardizedTest as StandardizedTestType,
        status: 'completed',
        rawScores: newAnswers,
        totalScore: result.total,
        severity: locale === 'zh' ? result.severityZh : result.severity,
        interpretation: locale === 'zh' ? result.interpretationZh : result.interpretation,
        crisisTriggered,
      };
      setTestResult(testResult);
      // Show crisis modal if moderate or worse
      if (result.total >= 15 || crisisTriggered) {
        setShowCrisisModal(true);
      }
      // Save to localStorage for dashboard
      const ASSESSMENTS_KEY = 'heartmirror-assessment-results';
      const stored = localStorage.getItem(ASSESSMENTS_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      existing.unshift(testResult);
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(existing));
      setScreen('result');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !apiKey) return;
    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: Date.now() };
    const newTurns = conversationTurns + 1;
    setConversationTurns(newTurns);

    // Build messages with system prompt
    const systemPrompt = locale === 'zh' ? CONVERSATIONAL_SYSTEM_PROMPT_ZH : CONVERSATIONAL_SYSTEM_PROMPT_EN;
    const allMessages = [
      { role: 'system' as const, content: systemPrompt, timestamp: Date.now() },
      ...messages,
      userMessage,
    ];

    // If 5+ turns and user hasn't asked for summary yet, prompt for summary
    const shouldSuggestSummary = newTurns >= 5 && !input.toLowerCase().includes('总结') && !input.toLowerCase().includes('summary');

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const assistantMessage: Message = { role: 'assistant', content: '', timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMessage]);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          provider,
          baseUrl,
          model,
        }),
      });
      if (!response.ok) throw new Error('API request failed');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = fullContent;
            return newMessages;
          });
        }
      }

      // After response, if enough turns and no summary requested, suggest it
      if (shouldSuggestSummary && newTurns >= 5) {
        const suggestMsg: Message = {
          role: 'assistant',
          content: locale === 'zh'
            ? '\n\n我们已经聊了几轮了，我对你的情况有了些了解。如果你愿意的话，我可以为你做一个简短的总结，帮助你更好地整理一下现在的感受。要现在总结吗？'
            : '\n\nWe\'ve chatted for a few rounds now, and I have a better understanding of how you\'re doing. If you\'d like, I can provide a brief summary to help you organize your current feelings. Would you like a summary now?',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, suggestMsg]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: locale === 'zh' ? '连接出现问题，请重试。' : 'Connection error. Please try again.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSummary = async () => {
    if (!apiKey) return;
    setIsLoading(true);

    const summaryPrompt = locale === 'zh'
      ? '请根据我们之前的对话，做一个温柔的总结：1) 整体心情评分(1-10) 2) 主要感受 3) 可能的原因 4) 简单建议。用【评估总结】开头。'
      : 'Based on our conversation, please provide a gentle summary: 1) Overall mood score (1-10) 2) Main feelings 3) Possible reasons 4) Simple suggestions. Start with [Assessment Summary].';

    const userMessage: Message = { role: 'user', content: summaryPrompt, timestamp: Date.now() };
    const systemPrompt = locale === 'zh' ? CONVERSATIONAL_SYSTEM_PROMPT_ZH : CONVERSATIONAL_SYSTEM_PROMPT_EN;

    setMessages(prev => [...prev, userMessage]);

    try {
      const assistantMessage: Message = { role: 'assistant', content: '', timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMessage]);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt, timestamp: Date.now() },
            ...messages,
            userMessage,
          ],
          provider,
          baseUrl,
          model,
        }),
      });
      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = fullContent;
            return newMessages;
          });
        }
      }

      // Parse mood score from summary if found
      const moodMatch = fullContent.match(/心情评分[：:]\s*(\d+)|Mood Score[：:]\s*(\d+)/i);
      if (moodMatch) {
        const moodScore = parseInt(moodMatch[1] || moodMatch[2]);
        const testResult: StandardizedTestResult = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          type: 'conversational',
          status: 'completed',
          rawScores: [moodScore],
          totalScore: moodScore,
          severity: moodScore >= 7 ? '良好' : moodScore >= 5 ? '一般' : '需要关注',
          interpretation: fullContent,
          crisisTriggered: false,
        };

        // Save to localStorage
        const ASSESSMENTS_KEY = 'heartmirror-assessment-results';
        const stored = localStorage.getItem(ASSESSMENTS_KEY);
        const existing = stored ? JSON.parse(stored) : [];
        existing.unshift(testResult);
        localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(existing));
        setConversationSummary(fullContent);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNew = () => {
    setAssessmentType(null);
    setStandardizedTest(null);
    setTestResult(null);
    setAnswers([]);
    setCurrentQuestion(0);
    setScreen('select-type');
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <p style={{ color: 'var(--muted)' }}>{t(locale, 'common.loading')}</p>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md p-6 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-xl font-semibold mb-2">{t(locale, 'settings.aiProvider')}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '配置您的AI服务商以开始评估' : 'Configure your AI provider to start the assessment'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{locale === 'zh' ? 'AI服务商预设' : 'AI Provider'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['anthropic', 'openai', 'ollama', 'custom'] as const).map(p => (
                    <button key={p} onClick={() => handleProviderChange(p)}
                      className="px-4 py-2.5 rounded-md border min-h-[44px] text-sm"
                      style={{
                        backgroundColor: settingsProvider === p ? 'var(--accent)' : 'var(--surface)',
                        borderColor: settingsProvider === p ? 'var(--accent)' : 'var(--border)',
                        color: settingsProvider === p ? 'white' : 'var(--text)',
                      }}
                    >{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t(locale, 'settings.apiBase')}</label>
                <input type="text" value={settingsBaseUrl} onChange={e => setSettingsBaseUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded border min-h-[44px]"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t(locale, 'settings.apiKey')}</label>
                <input type="password" value={settingsApiKey} onChange={e => setSettingsApiKey(e.target.value)}
                  placeholder="sk-..." className="w-full px-3 py-2.5 rounded border min-h-[44px]"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t(locale, 'settings.model')}</label>
                <input type="text" value={settingsModel} onChange={e => setSettingsModel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded border min-h-[44px]"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <button onClick={handleSaveSettings}
                className="w-full text-white rounded px-4 py-3 font-medium min-h-[44px]"
                style={{ backgroundColor: 'var(--accent)' }}>{t(locale, 'settings.save')}</button>
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
        <div className="ml-[200px] flex flex-col items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-lg">
            <h1 className="text-2xl font-semibold text-center mb-2">{t(locale, 'assessment.title')}</h1>
            <p className="text-center mb-8" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.selectType')}</p>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => handleSelectType('conversational')}
                className="p-6 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">💬</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(locale, 'assessment.conversational')}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.conversationalDesc')}</p>
                  </div>
                </div>
              </button>
              <button onClick={() => handleSelectType('standardized')}
                className="p-6 rounded-lg border text-left transition-colors hover:border-accent-primary"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
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
      </div>
    );
  }

  // Conversational assessment
  if (screen === 'conversational') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col h-screen">
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h1 className="text-lg font-semibold">{t(locale, 'assessment.conversational')}</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{locale === 'zh' ? 'AI对话评估' : 'AI Conversational Assessment'}</p>
            </div>
            <button onClick={startNew} className="text-sm px-3 py-1.5 rounded" style={{ color: 'var(--muted)' }}>
              ← {t(locale, 'common.previous')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-lg ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                  style={{ backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)', color: msg.role === 'user' ? 'white' : 'var(--text)' }}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
            {conversationTurns >= 5 && (
              <div className="mb-3 flex justify-center">
                <button onClick={handleRequestSummary} disabled={isLoading}
                  className="text-sm px-4 py-2 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  📋 {locale === 'zh' ? '请求评估总结' : 'Request Assessment Summary'}
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={locale === 'zh' ? '输入消息...' : 'Type your message...'}
                className="flex-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none min-h-[44px] text-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                disabled={isLoading} rows={1} />
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="text-white rounded-lg px-4 py-2 min-h-[44px] min-w-[44px] font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}>
                {isLoading ? '...' : (locale === 'zh' ? '发送' : 'Send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test selection
  if (screen === 'select-test') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-center mb-8">{t(locale, 'assessment.standardized')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STANDARDIZED_TESTS.map(test => (
                <button key={test.id} onClick={() => handleSelectTest(test.id)}
                  className="p-5 rounded-lg border text-left transition-colors hover:border-accent-primary"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{test.icon}</span>
                    <div>
                      <h3 className="text-base font-semibold">{locale === 'zh' ? test.nameZh : test.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{test.name}</p>
                    </div>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
                    {locale === 'zh' ? test.descriptionZh : test.description}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {test.questions} {locale === 'zh' ? '题' : 'questions'} | {locale === 'zh' ? '来源' : 'Source'}: <a href={test.source} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">{test.source.replace('https://', '')}</a>
                  </p>
                </button>
              ))}
            </div>
            <button onClick={() => setScreen('select-type')}
              className="mt-6 w-full py-3 text-sm" style={{ color: 'var(--muted)' }}>
              ← {t(locale, 'common.previous')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test questions screen
  if (screen === 'test' && standardizedTest) {
    const { questions, options, maxScore } = getTestQuestions(standardizedTest);
    const testInfo = STANDARDIZED_TESTS.find(t => t.id === standardizedTest);
    const question = questions[currentQuestion];
    const questionText = locale === 'zh' ? question.question.zh : question.question.en;

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col min-h-screen">
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setScreen('select-test')} className="text-sm" style={{ color: 'var(--muted)' }}>
                ← {t(locale, 'common.backToChat')}
              </button>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {t(locale, 'assessment.question')} {currentQuestion + 1} {t(locale, 'assessment.of')} {questions.length}
              </span>
            </div>
            <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
              <div className="h-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: 'var(--accent)', width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm font-medium">{testInfo ? (locale === 'zh' ? testInfo.nameZh : testInfo.name) : standardizedTest}</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-xl font-medium text-center mb-8 max-w-md">{questionText}</h2>
            <div className="w-full max-w-md space-y-3">
              {options.map((option) => (
                <button key={option.value} onClick={() => handleAnswer(option.value)}
                  className="w-full p-4 rounded-lg border text-left transition-colors hover:border-accent-primary"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  {t(locale, option.labelKey)}
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
    const testInfo = STANDARDIZED_TESTS.find(t => t.id === standardizedTest);
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar locale={locale} />
        <div className="ml-[200px] flex flex-col items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-center mb-2">{t(locale, 'result.title')}</h2>
            <p className="text-center mb-8" style={{ color: 'var(--muted)' }}>
              {testInfo ? (locale === 'zh' ? testInfo.nameZh : testInfo.name) : standardizedTest}
            </p>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4"
                style={{ borderColor: 'var(--accent)' }}>
                <div>
                  <div className="text-4xl font-bold">{testResult.totalScore}</div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>/{testInfo?.maxScore || 27}</div>
                </div>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                {t(locale, 'assessment.severity')}: {testResult.severity}
              </p>
            </div>
            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-sm">{testResult.interpretation}</p>
            </div>
            {testResult.crisisTriggered && (
              <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)' }}>
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {locale === 'zh' ? '根据你的回答，你可能需要寻求专业帮助。请考虑联系心理健康专业人士。' : 'Based on your responses, you may need professional help. Please consider reaching out to a mental health professional.'}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <button onClick={startNew} className="w-full text-white rounded px-4 py-3 font-medium"
                style={{ backgroundColor: 'var(--accent)' }}>{t(locale, 'assessment.startNew')}</button>
              <button onClick={() => setScreen('select-type')} className="w-full py-3 text-sm"
                style={{ color: 'var(--muted)' }}>{t(locale, 'assessment.title')}</button>
            </div>
          </div>
        </div>
        <CrisisSupportModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} severity={testResult?.severity} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar locale={locale} />
      <div className="ml-[200px] flex items-center justify-center min-h-screen">
        <p>{t(locale, 'common.loading')}</p>
      </div>
      <CrisisSupportModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
    </div>
  );
}
