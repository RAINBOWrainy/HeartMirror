/**
 * HeartMirror Tracker — Types
 * Conversational mental health self-assessment
 */

import type { Message } from '@/features/ai/shared/types';

/** Session states */
export type AssessmentSessionStatus = 'in-progress' | 'completed' | 'abandoned';

/** Risk indicators that may appear during assessment */
export type RiskIndicator = 'none' | 'self-harm' | 'ideation' | 'crisis-disclosed';

/** Result of a completed assessment */
export interface AssessmentResult {
  id: string;
  createdAt: number;
  type: 'assessment'; // discriminator for conversation vs assessment
  status: AssessmentSessionStatus;
  moodScore: number; // 1-10, self-reported
  aiEstimatedScore?: number; // AI's estimate from summary conversation
  themes: string[]; // e.g. ['anxiety', 'sleep', 'work']
  riskIndicators: RiskIndicator[];
  summary: string; // AI-generated 2-3 sentence summary
  conversation: Message[]; // Full chat transcript (encrypted)
}

/** What the UI needs to display an assessment in history list */
export interface AssessmentSummary {
  id: string;
  createdAt: number;
  moodScore: number;
  summary: string;
  status: AssessmentSessionStatus;
}

/** Formatted export output for therapist */
export interface AssessmentExport {
  date: string;
  durationMinutes: number;
  moodScore: number;
  themes: string[];
  copingPatterns: {
    positive: string[];
    concerning: string[];
  };
  riskIndicators: RiskIndicator[];
  summary: string;
  note: string;
}

/** Tracker feature configuration */
export interface TrackerConfig {
  maxQuestions: number; // 8
  includeCrisisProtocol: boolean; // always true
  exportFormat: 'text' | 'json';
}

/** Standardized test types */
export type StandardizedTestType = 'phq-9' | 'gad-7' | 'conversational';

/** Result of a standardized test (PHQ-9 or GAD-7) */
export interface StandardizedTestResult {
  id: string;
  createdAt: number;
  type: StandardizedTestType;
  status: AssessmentSessionStatus;
  rawScores: number[]; // per-question scores (0-3 each)
  totalScore: number; // sum of rawScores
  severity: string; // e.g. "Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"
  severityZh: string; // e.g. "极轻微", "轻度", "中度", "中重度", "重度"
  interpretation: string; // clinical interpretation in English
  interpretationZh: string; // clinical interpretation in Chinese
  crisisTriggered: boolean; // true if PHQ-9 Q9 > 0
}

/** Mood journal entry */
export interface MoodJournalEntry {
  id: string;
  createdAt: number;
  moodScore: number; // 1-10
  textEntry: string; // free-text reflection
  tags: string[]; // e.g. ['睡眠', '工作', '运动']
}

/** All conversation types for discriminator */
export type ConversationType = 'chat' | 'assessment' | 'phq-9' | 'gad-7' | 'journal';