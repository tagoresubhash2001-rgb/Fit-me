import { describe, expect, it } from 'vitest';
import { foldWord } from '../nutrition';
import { fold } from '../../../functions/src/foods/search';

// The offline search folds words exactly like the server index, so both find the same spelling variants.
describe('food word folding mirror', () => {
  it.each(['idly', 'idli', 'iddli', 'dosai', 'dose', 'dosa', 'wada', 'vadai', 'zeera', 'apples', 'cheese', 'chicken', 'bhindi', 'pasta', 'phulka', 'sambhar', 'uthappam', 'oats', 'glass', 'x', 'ఇడ్లీ', 'naan'])(
    '%s',
    (w) => expect(foldWord(w)).toBe(fold(w)),
  );
});
