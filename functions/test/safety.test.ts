import { describe, expect, it } from 'vitest';
import { isUrgent, stripEmojis, SAFETY_RULES } from '../src/ai/safety';
import { systemPrompt, languageName } from '../src/ai/personas';

describe('safety', () => {
  it('removes emojis', () => {
    expect(stripEmojis('Great job 💪🔥 keep going 😊')).toBe('Great job keep going');
  });
  it('detects urgent symptoms', () => {
    expect(isUrgent('I have chest pain since morning')).toBe(true);
    expect(isUrgent('I feel like I want to end my life')).toBe(true);
    expect(isUrgent('my blood sugar is very low and I am shaking')).toBe(true);
    expect(isUrgent('What should I eat for dinner?')).toBe(false);
  });
  it('rules forbid diagnosis, medication advice, invented data and emojis', () => {
    expect(SAFETY_RULES).toMatch(/Never diagnose/);
    expect(SAFETY_RULES).toMatch(/insulin/);
    expect(SAFETY_RULES).toMatch(/Never invent the user's data/);
    expect(SAFETY_RULES).toMatch(/Do not use emojis/);
  });
});
describe('personas', () => {
  it('replies in the user language and embeds user data and safety', () => {
    const p = systemPrompt('jaya', 'te', 'Name: Ravi', SAFETY_RULES);
    expect(p).toContain('Jaya');
    expect(p).toContain('Telugu');
    expect(p).toContain('Name: Ravi');
    expect(p).toContain('Safety rules');
    expect(languageName('xx')).toBe('English');
    expect(languageName('ar')).toBe('Arabic');
  });
});
