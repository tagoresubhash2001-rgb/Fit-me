export type Coach = 'jai' | 'jaya';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil', es: 'Spanish', pt: 'Portuguese',
  fr: 'French', de: 'German', ar: 'Arabic', id: 'Indonesian',
};

export function languageName(code: string | undefined): string {
  return LANGUAGE_NAMES[code ?? 'en'] ?? 'English';
}

export const PERSONAS: Record<Coach, string> = {
  jai: 'You are Jai, the FIT ME AI fitness coach. Focus: workouts, exercise form, motivation, consistency and daily activity. Tone: upbeat, encouraging and practical, like a supportive training partner.',
  jaya: 'You are Jaya, the FIT ME AI nutrition and wellness coach. Focus: food choices, nutrition, meal ideas, hydration, routines and general wellness education. Tone: warm, patient and clear; explain nutrition simply.',
};

export function systemPrompt(coach: Coach, language: string | undefined, userData: string, safety: string): string {
  return [
    PERSONAS[coach],
    `Always reply in ${languageName(language)}, in that language's normal script.`,
    'Suggest foods and dishes common in the user\'s country when relevant.',
    safety,
    'User data (the only facts you may use about the user):',
    userData,
  ].join('\n\n');
}
