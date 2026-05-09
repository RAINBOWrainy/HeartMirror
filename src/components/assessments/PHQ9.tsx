/**
 * PHQ-9 (Patient Health Questionnaire-9)
 * Depression screening questionnaire
 * Score interpretation:
 * 0-4: Minimal depression
 * 5-9: Mild depression
 * 10-14: Moderate depression
 * 15-19: Moderately severe depression
 * 20-27: Severe depression
 */

import { useLocale } from '@/lib/i18n/LocaleContext';
import { t } from '@/lib/i18n/translations';
import type { StandardizedTestType } from '@/features/tracker/types';

export const phq9Questions = [
  {
    id: 1,
    question: {
      zh: '在过去的两周里，你有多少天感到做事没有兴趣或没有乐趣？',
      en: 'Over the past 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
    },
  },
  {
    id: 2,
    question: {
      zh: '在过去的两周里，你有多少天感到心情低落、沮丧或绝望？',
      en: 'Over the past 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
    },
  },
  {
    id: 3,
    question: {
      zh: '在过去的两周里，你有多少天难以入睡、睡不安稳，或睡得过多？',
      en: 'Over the past 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?',
    },
  },
  {
    id: 4,
    question: {
      zh: '在过去的两周里，你有多少天感到疲倦或没有精力？',
      en: 'Over the past 2 weeks, how often have you been bothered by feeling tired or having little energy?',
    },
  },
  {
    id: 5,
    question: {
      zh: '在过去的两周里，你有多少天感到食欲不振或吃得过多？',
      en: 'Over the past 2 weeks, how often have you been bothered by poor appetite or overeating?',
    },
  },
  {
    id: 6,
    question: {
      zh: '在过去的两周里，你有多少天对自己感到不满意、觉得自己让自己或家人失望？',
      en: 'Over the past 2 weeks, how often have you been bothered by feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
    },
  },
  {
    id: 7,
    question: {
      zh: '在过去的两周里，你有多少天难以集中注意力做事，例如阅读报纸或看电视？',
      en: 'Over the past 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?',
    },
  },
  {
    id: 8,
    question: {
      zh: '在过去的两周里，你有多少天行动或说话比平时慢，或比平时快得多，以至于其他人都注意到了？或者情况完全相反：比平时活动更多，比平时更需要别人关注？',
      en: 'Over the past 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
    },
  },
  {
    id: 9,
    question: {
      zh: '在过去的两周里，你有多少天想到自己最好已经死了，或者想过伤害自己？',
      en: 'Over the past 2 weeks, how often have you been bothered by thoughts that you would be better off dead or of hurting yourself in some way?',
    },
  },
] as const;

export const phq9Options = [
  { value: 0, labelKey: 'notAtAll' },
  { value: 1, labelKey: 'severalDays' },
  { value: 2, labelKey: 'moreThanHalf' },
  { value: 3, labelKey: 'nearlyEveryDay' },
] as const;

export function calculatePHQ9(scores: number[]): {
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
    interpretation = 'Minimal depression — monitor and reassess if symptoms persist.';
    interpretationZh = '极轻微抑郁 — 如症状持续请继续观察和重新评估。';
  } else if (total <= 9) {
    severity = 'Mild';
    severityZh = '轻度';
    interpretation = 'Mild depression — consider counseling, monitor symptoms.';
    interpretationZh = '轻度抑郁 — 建议考虑心理咨询，监测症状变化。';
  } else if (total <= 14) {
    severity = 'Moderate';
    severityZh = '中度';
    interpretation = 'Moderate depression — recommend counseling, consider professional support.';
    interpretationZh = '中度抑郁 — 建议寻求心理咨询，考虑专业支持。';
  } else if (total <= 19) {
    severity = 'Moderately Severe';
    severityZh = '中重度';
    interpretation = 'Moderately severe depression — strongly recommend professional mental health support.';
    interpretationZh = '中重度抑郁 — 强烈建议寻求专业心理健康支持。';
  } else {
    severity = 'Severe';
    severityZh = '重度';
    interpretation = 'Severe depression — immediate professional help recommended.';
    interpretationZh = '重度抑郁 — 建议立即寻求专业帮助。';
  }

  return { total, severity, severityZh, interpretation, interpretationZh };
}

export function getPHQ9Type(): StandardizedTestType {
  return 'phq-9';
}