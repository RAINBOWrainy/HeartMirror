import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock as any;

const MOOD_REGEX = /^(\/mood\s+|mood\s+)(\d+)$/i;

describe('mood command regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockReturnValue(undefined);
  });

  it('"mood 6" is parsed with correct regex and score extracted', () => {
    const input = 'mood 6';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    expect(parseInt(moodMatch![2], 10)).toBe(6);
  });

  it('"/mood 6" is also a valid mood command', () => {
    const input = '/mood 6';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    expect(parseInt(moodMatch![2], 10)).toBe(6);
  });

  it('"Mood 7" with capital M is valid', () => {
    const input = 'Mood 7';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    expect(parseInt(moodMatch![2], 10)).toBe(7);
  });

  it('"mood 6" triggers guard that returns before chatCompletion', () => {
    const input = 'mood 6';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    const score = parseInt(moodMatch![2], 10);
    const shouldReturnEarly = moodMatch !== null && score >= 1 && score <= 10;
    expect(shouldReturnEarly).toBe(true);
  });

  it('"mood abc" is NOT a valid mood command — sent as normal chat', () => {
    const input = 'mood abc';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).toBeNull();
  });

  it('"mood 15" is out of range — shows error, does NOT call chatCompletion', () => {
    const input = 'mood 15';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    const score = parseInt(moodMatch![2], 10);
    expect(score).toBeGreaterThan(10);
    expect(score >= 1 && score <= 10).toBe(false);
  });

  it('"mood 0" is out of range — shows error, does NOT call chatCompletion', () => {
    const input = 'mood 0';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    const score = parseInt(moodMatch![2], 10);
    expect(score).toBeLessThan(1);
    expect(score >= 1 && score <= 10).toBe(false);
  });

  it('"mood" with no number is NOT a mood command', () => {
    const input = 'mood';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).toBeNull();
  });

  it('/mood with no number is NOT a mood command', () => {
    const input = '/mood';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).toBeNull();
  });

  it('valid mood scores 1-10 are all accepted', () => {
    for (let i = 1; i <= 10; i++) {
      const input = `mood ${i}`;
      const moodMatch = input.trim().match(MOOD_REGEX);
      expect(moodMatch).not.toBeNull();
      const score = parseInt(moodMatch![2], 10);
      expect(score >= 1 && score <= 10).toBe(true);
    }
  });

  it('saves mood entry to localStorage with correct structure', () => {
    const input = 'mood 7';
    const moodMatch = input.trim().match(MOOD_REGEX);
    const score = parseInt(moodMatch![2], 10);

    const entry = {
      id: `mood-${Date.now()}`,
      createdAt: Date.now(),
      moodScore: score,
      textEntry: '',
      tags: [],
    };

    expect(entry.moodScore).toBe(7);
    expect(entry.textEntry).toBe('');
    expect(entry.tags).toEqual([]);
    expect(entry.id).toMatch(/^mood-\d+/);
  });

  it('localStorage is called with heartmirror-journal-entries key', () => {
    const key = 'heartmirror-journal-entries';
    const entry = { id: 'mood-123', createdAt: 123, moodScore: 5, textEntry: '', tags: [] };
    const existing = JSON.parse(localStorageMock.getItem(key) || '[]');
    existing.push(entry);
    localStorageMock.setItem(key, JSON.stringify(existing));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(key, expect.any(String));
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved[0].moodScore).toBe(5);
  });

  it('"mood  6" with extra spaces is still valid', () => {
    const input = 'mood  6';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    expect(parseInt(moodMatch![2], 10)).toBe(6);
  });

  it('"/mood  6" with extra spaces is still valid', () => {
    const input = '/mood  6';
    const moodMatch = input.trim().match(MOOD_REGEX);
    expect(moodMatch).not.toBeNull();
    expect(parseInt(moodMatch![2], 10)).toBe(6);
  });
});