/**
 * HeartMirror — Chat-to-Tracker Keyword Allowlist
 * Phase 4 prerequisite: defines keyword matching for post-chat theme offers
 *
 * Categories and keywords for theme detection in chat messages.
 * Match logic: word-boundary match (regex \b keyword \b, case-insensitive)
 * Minimum threshold: 2+ keyword matches from same category, OR 1 keyword from 2+ categories
 * If no keywords found: do NOT show offer, do NOT log anything
 */

export interface KeywordCategory {
  id: string;
  labelZh: string;
  labelEn: string;
  keywords: string[];
}

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    id: 'work',
    labelZh: '工作',
    labelEn: 'Work',
    keywords: [
      'job', 'work', 'boss', 'coworker', 'colleague', 'deadline', 'meeting',
      'presentation', 'project', 'office', 'employer', 'employee', 'salary',
      'promotion', 'career', 'resume', 'interview', 'hired', 'fired',
      '工作', '上班', '老板', '同事', '截止日期', '会议', '加班', '辞职', '面试',
    ],
  },
  {
    id: 'relationships',
    labelZh: '人际关系',
    labelEn: 'Relationships',
    keywords: [
      'friend', 'friends', 'family', 'partner', 'boyfriend', 'girlfriend',
      'spouse', 'husband', 'wife', 'date', 'dating', 'breakup', 'divorce',
      'lonely', 'alone', 'social', 'connection', 'argument', 'fight',
      '朋友', '家人', '约会', '分手', '孤独', '社交', '争吵', '伴侣', '夫妻',
    ],
  },
  {
    id: 'health',
    labelZh: '健康',
    labelEn: 'Health',
    keywords: [
      'health', 'sick', 'illness', 'doctor', 'hospital', 'medicine', 'medication',
      'symptom', 'pain', 'fatigue', 'tired', 'sleep', 'insomnia', 'headache',
      '健康', '生病', '医生', '医院', '吃药', '症状', '疼痛', '疲劳', '失眠',
    ],
  },
  {
    id: 'anxiety',
    labelZh: '焦虑',
    labelEn: 'Anxiety',
    keywords: [
      'anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panic', 'stress',
      'overwhelmed', '紧张', '焦虑', '担心', '恐慌', '压力', '不安',
    ],
  },
  {
    id: 'depression',
    labelZh: '抑郁',
    labelEn: 'Depression',
    keywords: [
      'sad', 'depressed', 'hopeless', 'empty', 'numb', 'low', 'mood',
      'down', 'crying', 'tears', '绝望', '空虚', '麻木', '低落', '哭泣',
    ],
  },
  {
    id: 'sleep',
    labelZh: '睡眠',
    labelEn: 'Sleep',
    keywords: [
      'sleep', 'insomnia', 'night', 'dream', 'tired', 'exhausted', 'rest',
      'bed', 'awake', 'sleeping', '睡眠', '失眠', '夜晚', '做梦', '疲劳', '休息',
    ],
  },
  {
    id: 'exercise',
    labelZh: '运动',
    labelEn: 'Exercise',
    keywords: [
      'exercise', 'gym', 'run', 'running', 'walk', 'yoga', 'workout',
      'sport', 'physical', '运动', '跑步', '健身', '瑜伽', '锻炼', '体育',
    ],
  },
  {
    id: 'mindfulness',
    labelZh: '正念',
    labelEn: 'Mindfulness',
    keywords: [
      'meditation', 'mindful', 'breathing', 'relax', 'calm', 'peace',
      'meditate', '冥想', '正念', '呼吸', '放松', '平静',
    ],
  },
];

/**
 * Scan text for keyword matches.
 * Returns: array of matched category IDs
 */
export function scanForThemes(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matchedCategories: string[] = [];

  for (const category of KEYWORD_CATEGORIES) {
    let matchCount = 0;
    for (const keyword of category.keywords) {
      // Word boundary match (case-insensitive)
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      matchedCategories.push(category.id);
    }
  }

  return matchedCategories;
}

/**
 * Determine if theme offer should be shown based on threshold.
 * Threshold: 2+ keyword matches from same category, OR 1 keyword from 2+ categories
 * Note: scanForThemes returns category IDs (not counts), so >= 2 means 2+ different categories matched.
 * This automatically satisfies the "1 keyword from 2+ categories" condition.
 */
export function shouldOfferTheme(matchedCategories: string[]): boolean {
  return matchedCategories.length >= 2;
}