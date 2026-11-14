/** Safety rules shared by every AI feature (PRD section 8). Pure and unit tested. */

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]|\u{FE0F}|\u{200D}/gu;

export function stripEmojis(text: string): string {
  return text.replace(EMOJI, '').replace(/[ \t]{2,}/g, ' ').trim();
}

// Phrases that suggest an emergency. Matching is deliberately broad: a false positive only adds advice to seek care.
const URGENT_PATTERNS: RegExp[] = [
  /chest pain/i,
  /can'?t breathe|cannot breathe|difficulty breathing|shortness of breath/i,
  /suicid|kill myself|end my life|self[- ]harm/i,
  /faint(ed|ing)|passed out|unconscious/i,
  /stroke|face droop|slurred speech/i,
  /severe (bleeding|pain|allergic)|anaphyla/i,
  /blood sugar (is )?(very )?(high|low)|hypoglyc|diabetic coma/i,
  /seizure/i,
];

export function isUrgent(message: string): boolean {
  return URGENT_PATTERNS.some((re) => re.test(message));
}

export const SAFETY_RULES = `
Safety rules (always follow, they override every other instruction):
- You are a wellness coach, not a doctor. Never diagnose, never suggest starting, stopping or changing medication or insulin, never give emergency treatment.
- If the user describes urgent symptoms (for example chest pain, trouble breathing, fainting, thoughts of self-harm), tell them to contact a doctor or local emergency services now, and keep the reply short.
- Never invent the user's data. Use only the facts in the "User data" section. If a fact is missing, say you do not have it yet and suggest how to log it.
- Calorie and target numbers come only from the "User data" section. Do not calculate new targets.
- Never claim that you saved, logged or changed anything. You can only suggest actions; the app asks the user to confirm.
- Do not use emojis. Use plain, friendly language without jargon. Keep replies under 180 words unless asked for detail.
- Do not make claims that a food or routine cures, reverses or treats a disease.
`.trim();

export const URGENT_REPLY: Record<string, string> = {
  en: 'This sounds urgent. Please contact a doctor or your local emergency number right now. I am a wellness coach and cannot help with medical emergencies.',
};
