/**
 * GAD-7 (Generalized Anxiety Disorder-7)
 * Anxiety screening questionnaire
 * Score interpretation:
 * 0-4: Minimal anxiety
 * 5-9: Mild anxiety
 * 10-14: Moderate anxiety
 * 15-21: Severe anxiety
 */

import type { StandardizedTestType } from '@/features/tracker/types';

export const gad7Questions = [
  {
    id: 1,
    question: {
      zh: '在过去的两周里，你有多少天感到紧张、焦虑或烦躁？',
      en: 'Over the past 2 weeks, how often have you been feeling nervous, anxious, or on edge?',
    },
  },
  {
    id: 2,
    question: {
      zh: '在过去的两周里，你有多少天无法停止或控制担心？',
      en: 'Over the past 2 weeks, how often have you been unable to stop or control worrying?',
    },
  },
  {
    id: 3,
    question: {
      zh: '在过去的两周里，你有多少天对不同的事情过度担心？',
      en: 'Over the past 2 weeks, how often have you been worrying too much about different things?',
    },
  },
  {
    id: 4,
    question: {
      zh: '在过去的两周里，你有多少天难以放松？',
      en: 'Over the past 2 weeks, how often have you had trouble relaxing?',
    },
  },
  {
    id: 5,
    question: {
      zh: '在过去的两周里，你有多少天因为不安而难以坐定？',
      en: 'Over the past 2 weeks, how often have you been so restless that it is hard to sit still?',
    },
  },
  {
    id: 6,
    question: {
      zh: '在过去的两周里，你有多少天变得容易烦恼或容易被激怒？',
      en: 'Over the past 2 weeks, how often have you become easily annoyed or irritable?',
    },
  },
  {
    id: 7,
    question: {
      zh: '在过去的两周里，你有多少天感到害怕，像是有什么可怕的事将要发生？',
      en: 'Over the past 2 weeks, how often have you been feeling afraid, as if something awful might happen?',
    },
  },
] as const;

export const gad7Options = [
  { value: 0, labelKey: 'notAtAll' },
  { value: 1, labelKey: 'severalDays' },
  { value: 2, labelKey: 'moreThanHalf' },
  { value: 3, labelKey: 'nearlyEveryDay' },
] as const;

export function calculateGAD7(scores: number[]): {
  total: number;
  severity: string;
  severityZh: string;
  interpretation: string;
  interpretationZh: string;
} {
  const total = scores.reduce((sum, s) => sum + s, 0);

  let severity: string;
  let severityZh: string;
  let interpretation: string;
  let interpretationZh: string;

  if (total <= 4) {
    severity = 'Minimal';
    severityZh = '极轻微';
    interpretation = 'Minimal anxiety — monitor and reassess if symptoms persist.';
    interpretationZh = '极轻微焦虑 — 如症状持续请继续观察和重新评估。';
  } else if (total <= 9) {
    severity = 'Mild';
    severityZh = '轻度';
    interpretation = 'Mild anxiety — consider counseling, monitor symptoms.';
    interpretationZh = '轻度焦虑 — 建议考虑心理咨询，监测症状变化。';
  } else if (total <= 14) {
    severity = 'Moderate';
    severityZh = '中度';
    interpretation = 'Moderate anxiety — recommend counseling, consider professional support.';
    interpretationZh = '中度焦虑 — 建议寻求心理咨询，考虑专业支持。';
  } else {
    severity = 'Severe';
    severityZh = '重度';
    interpretation = 'Severe anxiety — strongly recommend professional mental health support.';
    interpretationZh = '重度焦虑 — 强烈建议寻求专业心理健康支持。';
  }

  return { total, severity, severityZh, interpretation, interpretationZh };
}

export function getGAD7Type(): StandardizedTestType {
  return 'gad-7';
}