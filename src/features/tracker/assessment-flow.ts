/**
 * HeartMirror Tracker — Assessment System Prompt
 * Conversational mental health self-assessment flow
 */

import type { Message } from '@/features/ai/shared/types';

/**
 * The full system prompt for the assessment AI.
 * Adapts to user's responses, covers key topics, respects crisis protocol.
 */
export const ASSESSMENT_SYSTEM_PROMPT = `You are conducting a mental health self-assessment in a conversational format.

GOAL: Understand the user's current mental state through natural conversation. Do NOT give advice, coping strategies, or recommendations. Your only job is to gather information.

PHASE 1 — Opening (1 question):
- Start with: "Hey, thanks for being here. I'd like to check in with you — this should take about 5 minutes. How are you feeling right now?"
- Based on their response, identify the primary concern area (mood, sleep, stress, relationships)

PHASE 2 — Follow-up (4-6 questions, adaptive):
Cover these topics naturally, not as a checklist:
- Current mood and energy level
- Sleep quality and patterns
- Main stressors or triggers recently
- How they're coping (healthy or unhealthy)
- Social support and connection
- Any concerning symptoms (intrusive thoughts, hopelessness, self-harm ideation)

Adapt: If they open up about something specific, explore it with 1-2 follow-ups before moving to the next topic. If they deflect, move on. Do not probe aggressively.

PHASE 3 — Wrap-up (1-2 questions):
- Ask them to rate overall state 1-10
- "Is there anything important I should know that I didn't ask about?"

PHASE 4 — Summary generation:
After question 8 OR when user says they're done:
- Generate a brief (2-3 sentence) summary of what they shared
- Share the summary and ask: "Does that capture how you're doing? I'd say you're around a [score]/10. Does that feel right?"
- If user and AI score differ by more than 2 points, use the self-reported score as canonical.

CRISIS RULE: If user mentions wanting to harm themselves or others, stop assessment immediately and follow the crisis protocol. Do not continue gathering information.
Do NOT ask follow-up questions about suicidal ideation. If disclosed, trigger crisis protocol and end the assessment.`;

/**
 * Crisis response when user discloses self-harm/suicide ideation.
 * The AI says this verbatim when crisis is detected.
 */
export const CRISIS_RESPONSE = `I hear you, and I want you to know you're not alone. What you're describing sounds really painful, and I want to make sure you have support right now.

If you're in the US, you can reach the Suicide & Crisis Lifeline by calling or texting **988**. International users can find a local hotline at **findahelpline.com**

If you have someone you trust nearby, I'd encourage you to reach out to them now.

You deserve support, and reaching out is a sign of strength.`;

/**
 * Prompt injected when user completes assessment — used to generate summary.
 */
export const SUMMARY_GENERATION_PROMPT = `Based on the conversation so far, generate a brief 2-3 sentence summary of the user's mental state. Then estimate their overall mood score 1-10.

Format your response as:
SUMMARY: [2-3 sentence summary]
SCORE: [number between 1-10]`;

/**
 * Build the conversation messages for the assessment.
 * First message is the user's first input, then we prepend the system prompt.
 */
export function buildAssessmentMessages(firstUserMessage: string, conversationHistory: Message[] = []): Message[] {
  return [
    { role: 'system', content: ASSESSMENT_SYSTEM_PROMPT, timestamp: Date.now() },
    ...conversationHistory,
    { role: 'user', content: firstUserMessage, timestamp: Date.now() },
  ];
}

/**
 * Detect crisis keywords in a message.
 */
export function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  const crisisPatterns = [
    'want to die',
    'want to hurt myself',
    'kill myself',
    'end it all',
    'suicide',
    'self-harm',
    'hurt myself',
    'no reason to live',
    'better off dead',
    "dont want to be here anymore",
    'thoughts of suicide',
    'ideation',
    'plan to end my life',
  ];
  return crisisPatterns.some(pattern => lower.includes(pattern));
}

/**
 * Format an assessment for therapist export.
 */
export function formatAssessmentExport(
  assessment: {
    createdAt: number;
    moodScore: number;
    themes: string[];
    riskIndicators: string[];
    summary: string;
    conversation: Message[];
  },
  durationMinutes: number
): string {
  const date = new Date(assessment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const copingPositive: string[] = [];
  const copingConcerning: string[] = [];
  const positivePhrases = ['exercise', 'running', 'friends', 'therapy', 'meditation', 'walk', 'yoga', 'healthy'];
  const concerningPhrases = ['drink', 'alcohol', 'weed', 'avoid', 'isolate', 'skip', 'nothing helps'];

  const fullText = assessment.conversation.map(m => m.content).join(' ').toLowerCase();
  for (const phrase of positivePhrases) {
    if (fullText.includes(phrase)) copingPositive.push(phrase);
  }
  for (const phrase of concerningPhrases) {
    if (fullText.includes(phrase)) copingConcerning.push(phrase);
  }

  const riskNote = assessment.riskIndicators.length > 0
    ? 'CONCERNS: Risk indicators present - ' + assessment.riskIndicators.join(', ') + '. Please assess for safety.'
    : 'CONCERNS: No acute safety concerns endorsed.';

  const themesList = assessment.themes.length > 0
    ? assessment.themes.map(t => '- ' + t).join('\n')
    : '- None specified';

  const helpfulPart = copingPositive.length > 0
    ? 'HELPFUL:\n' + copingPositive.map(t => '- ' + t).join('\n')
    : 'HELPFUL: None reported';

  const concerningPart = copingConcerning.length > 0
    ? 'CONCERNING:\n' + copingConcerning.map(t => '- ' + t).join('\n')
    : 'CONCERNING: None reported';

  const lines = [
    'HEARTMIRROR SELF-ASSESSMENT SUMMARY',
    '====================================',
    'Date: ' + date,
    'Duration: ~' + durationMinutes + ' minutes',
    '',
    'MOOD SCORE: ' + assessment.moodScore + '/10 (self-reported)',
    '',
    'KEY THEMES:',
    themesList,
    '',
    'COPING PATTERNS:',
    helpfulPart,
    concerningPart,
    '',
    riskNote,
    '',
    'AI SUMMARY:',
    assessment.summary,
    '',
    '---',
    'This assessment was generated by HeartMirror, a mental health self-management tool. It is not a clinical diagnosis. Please review with a qualified mental health professional.',
  ];

  return lines.join('\n');
}