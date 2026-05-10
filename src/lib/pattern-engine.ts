/**
 * HeartMirror Pattern Engine
 * Phase 2: Core intelligence layer — analyzes mood patterns client-side
 *
 * Runs in the browser (NOT a Next.js API route). Uses user's own API key.
 * Local mode: reads from localStorage
 * Cloud mode: calls /api/settings to get API key at runtime
 */

import type { MoodJournalEntry, StandardizedTestResult } from '@/features/tracker/types';

const PATTERN_CACHE_KEY = 'heartmirror-pattern-cache';
const PATTERN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const PATTERN_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Pattern {
  id: string;
  trigger: string; // e.g. "No exercise for 3+ days"
  description: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string[]; // supporting data points
}

export interface PatternAnalysis {
  generatedAt: number;
  patterns: Pattern[];
  summary: string;
  avgMood7d: number;
  avgMood14d: number;
}

interface CacheEntry {
  data: PatternAnalysis;
  timestamp: number;
}

// System prompt for pattern analysis
const PATTERN_SYSTEM_PROMPT = `You are a mental health pattern analyzer. Analyze the user's mood data and identify clear, actionable patterns.

Output a JSON object with this exact structure:
{
  "patterns": [
    {
      "id": "pattern-1",
      "trigger": "concise trigger description (e.g. 'No exercise for 3+ days')",
      "description": "2-3 sentence explanation of why this matters",
      "severity": "high|medium|low",
      "evidence": ["evidence point 1", "evidence point 2"]
    }
  ],
  "summary": "2-3 sentence overall summary of the week",
  "avgMood7d": number,
  "avgMood14d": number
}

Rules:
- Identify 2-4 of the most significant patterns
- Severity: high = immediate attention needed, medium = watch closely, low = positive trend
- Evidence must be specific data points from the input
- If data is insufficient (< 7 days), return empty patterns with "Not enough data yet" summary
- Language: respond in the same language as the user's data (English or Chinese)`;

function buildPatternPrompt(
  journalEntries: MoodJournalEntry[],
  assessmentResults: StandardizedTestResult[]
): string {
  // Build a structured data summary for the LLM
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const last14d = journalEntries.filter(e => now - e.createdAt < 14 * dayMs);
  const last7d = journalEntries.filter(e => now - e.createdAt < 7 * dayMs);

  // Calculate averages
  const avg14d = last14d.length > 0
    ? last14d.reduce((sum, e) => sum + e.moodScore, 0) / last14d.length
    : null;
  const avg7d = last7d.length > 0
    ? last7d.reduce((sum, e) => sum + e.moodScore, 0) / last7d.length
    : null;

  // Group entries by date for pattern detection
  const entriesByDate: Record<string, MoodJournalEntry[]> = {};
  last14d.forEach(e => {
    const dateKey = new Date(e.createdAt).toDateString();
    if (!entriesByDate[dateKey]) entriesByDate[dateKey] = [];
    entriesByDate[dateKey].push(e);
  });

  // Tag frequency analysis
  const tagFrequency: Record<string, number> = {};
  last14d.forEach(e => {
    e.tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  const assessmentsByDate: Record<string, StandardizedTestResult[]> = {};
  const recentAssessments = assessmentResults.filter(r => now - r.createdAt < 14 * dayMs);
  recentAssessments.forEach(r => {
    const dateKey = new Date(r.createdAt).toDateString();
    if (!assessmentsByDate[dateKey]) assessmentsByDate[dateKey] = [];
    assessmentsByDate[dateKey].push(r);
  });

  let dataSummary = '## Mood Data (Last 14 days)\n\n';

  if (last14d.length === 0) {
    dataSummary += 'No mood entries in the last 14 days.\n';
  } else {
    dataSummary += `Total entries: ${last14d.length}\n`;
    if (avg14d !== null) dataSummary += `14-day average: ${avg14d.toFixed(1)}/10\n`;
    if (avg7d !== null) dataSummary += `7-day average: ${avg7d.toFixed(1)}/10\n`;
    dataSummary += `\n### Daily averages\n`;
    Object.keys(entriesByDate).sort().forEach(date => {
      const entries = entriesByDate[date];
      const avg = entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length;
      dataSummary += `- ${date}: ${avg.toFixed(1)}/10 (${entries.length} entries)\n`;
    });

    if (Object.keys(tagFrequency).length > 0) {
      dataSummary += `\n### Tag frequency\n`;
      Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tag, count]) => {
          dataSummary += `- ${tag}: ${count} times\n`;
        });
    }
  }

  if (recentAssessments.length > 0) {
    dataSummary += `\n## Assessment Results (Last 14 days)\n`;
    recentAssessments.forEach(r => {
      dataSummary += `- ${new Date(r.createdAt).toDateString()}: ${r.type.toUpperCase()} score ${r.totalScore} (${r.severity})\n`;
    });
  } else {
    dataSummary += `\n## Assessment Results\nNo assessments in the last 14 days.\n`;
  }

  return `${PATTERN_SYSTEM_PROMPT}\n\n${dataSummary}`;
}

async function callAI(
  prompt: string,
  apiKey: string,
  provider: string,
  baseUrl: string,
  model: string
): Promise<{ patterns: Pattern[]; summary: string; avgMood7d: number; avgMood14d: number }> {
  // Build messages for chat completion
  const messages = [
    { role: 'system' as const, content: PATTERN_SYSTEM_PROMPT },
    { role: 'user' as const, content: prompt },
  ];

  // Call the appropriate API based on provider
  if (provider === 'anthropic') {
    // Anthropic API
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json() as { content: Array<{ text: string }> };
    const text = data.content?.[0]?.text ?? '';
    return parsePatternResponse(text);
  } else {
    // OpenAI-compatible API (OpenAI, DeepSeek, Ollama, etc.)
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const text = data.choices?.[0]?.message?.content ?? '';
    return parsePatternResponse(text);
  }
}

function parsePatternResponse(text: string): { patterns: Pattern[]; summary: string; avgMood7d: number; avgMood14d: number } {
  // Extract JSON from the response (handles markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Find JSON object in the text
  const startIdx = jsonStr.indexOf('{');
  const endIdx = jsonStr.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON found in response');
  }

  jsonStr = jsonStr.substring(startIdx, endIdx + 1);
  const parsed = JSON.parse(jsonStr) as {
    patterns?: Array<{
      id?: string;
      trigger?: string;
      description?: string;
      severity?: string;
      evidence?: string[];
    }>;
    summary?: string;
    avgMood7d?: number;
    avgMood14d?: number;
  };

  const patterns: Pattern[] = (parsed.patterns || []).map((p, i) => ({
    id: p.id || `pattern-${i + 1}`,
    trigger: p.trigger || 'Unknown pattern',
    description: p.description || '',
    severity: (p.severity as 'high' | 'medium' | 'low') || 'medium',
    evidence: p.evidence || [],
  }));

  return {
    patterns,
    summary: parsed.summary || 'Unable to generate summary.',
    avgMood7d: parsed.avgMood7d || 0,
    avgMood14d: parsed.avgMood14d || 0,
  };
}

function getCachedAnalysis(): PatternAnalysis | null {
  try {
    const cached = localStorage.getItem(PATTERN_CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is too old (maxAge: 7 days)
    if (now - entry.timestamp > PATTERN_CACHE_MAX_AGE) {
      localStorage.removeItem(PATTERN_CACHE_KEY);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

function setCachedAnalysis(analysis: PatternAnalysis): void {
  try {
    const entry: CacheEntry = {
      data: analysis,
      timestamp: Date.now(),
    };
    localStorage.setItem(PATTERN_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — skip cache
  }
}

async function getApiKeyForMode(): Promise<{ apiKey: string; provider: string; baseUrl: string; model: string } | null> {
  // Check for cloud mode via auth context
  try {
    const res = await fetch('/api/settings', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const settings = await res.json() as {
        apiKey?: string;
        provider?: string;
        baseUrl?: string;
        model?: string;
      };
      if (settings.apiKey && settings.provider) {
        return {
          apiKey: settings.apiKey,
          provider: settings.provider,
          baseUrl: settings.baseUrl || '',
          model: settings.model || '',
        };
      }
    }
  } catch {
    // Not in cloud mode or error — fall through to local mode
  }

  // Local mode: read from localStorage
  const apiKey = localStorage.getItem('heartmirror-api-key');
  const provider = localStorage.getItem('heartmirror-provider') || 'anthropic';
  const baseUrl = localStorage.getItem('heartmirror-base-url') || 'https://api.anthropic.com';
  const model = localStorage.getItem('heartmirror-model') || 'claude-3-sonnet-20240229';

  if (!apiKey) return null;

  return { apiKey, provider, baseUrl, model };
}

/**
 * Main entry point: analyze mood patterns
 * Returns cached result if available and fresh, otherwise runs AI analysis
 */
export async function analyzePatterns(
  journalEntries: MoodJournalEntry[],
  assessmentResults: StandardizedTestResult[],
  forceRefresh = false
): Promise<PatternAnalysis | { error: string; canRetry: boolean }> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedAnalysis();
    if (cached && Date.now() - cached.generatedAt < PATTERN_CACHE_TTL) {
      return cached;
    }
  }

  // Get API key
  const credentials = await getApiKeyForMode();
  if (!credentials) {
    return {
      error: 'No API key configured. Please set your API key in settings.',
      canRetry: false,
    };
  }

  // Check minimum data
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hasEnoughData = journalEntries.filter(e => now - e.createdAt < 14 * dayMs).length >= 3;

  if (!hasEnoughData) {
    return {
      error: 'Not enough data yet. Need at least 3 entries over the past 14 days.',
      canRetry: true,
    };
  }

  try {
    const prompt = buildPatternPrompt(journalEntries, assessmentResults);
    const result = await callAI(prompt, credentials.apiKey, credentials.provider, credentials.baseUrl, credentials.model);

    const analysis: PatternAnalysis = {
      generatedAt: Date.now(),
      patterns: result.patterns,
      summary: result.summary,
      avgMood7d: result.avgMood7d,
      avgMood14d: result.avgMood14d,
    };

    setCachedAnalysis(analysis);
    return analysis;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      error: `Analysis failed: ${message}`,
      canRetry: true,
    };
  }
}

/**
 * Clear the pattern cache (useful when user adds new data)
 */
export function clearPatternCache(): void {
  localStorage.removeItem(PATTERN_CACHE_KEY);
}

/**
 * Phase 6: Check if push notification should be triggered.
 * Deterministic rule: decline ≥ 1.0 point in 7-day average vs prior 7-day average.
 * Only triggers between 8AM-10PM local time.
 */
export function checkNudgeTrigger(analysis: PatternAnalysis): boolean {
  const decline = analysis.avgMood14d - analysis.avgMood7d;
  if (decline < 1.0) return false;

  const hour = new Date().getHours();
  if (hour < 8 || hour >= 22) return false;

  return true;
}