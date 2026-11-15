/** Same normalisation and prefix tokens as the client (src/domain/nutrition.ts) so search matches. */
export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, (m) => (/[ऀ-෿؀-ۿ]/.test(m) ? m : ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchTokens(names: string[]): string[] {
  const set = new Set<string>();
  for (const n of names) {
    for (const w of normalize(n).split(' ')) {
      const chars = [...w];
      for (let i = 2; i <= Math.min(15, chars.length); i++) set.add(chars.slice(0, i).join(''));
    }
  }
  return [...set];
}
