import { describe, expect, it } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('lets later layout classes win', () => {
    expect(cn('flex w-full gap-1', 'w-56')).toBe('flex gap-1 w-56');
    expect(cn('h-12 w-full', 'w-28 shrink-0')).toBe('h-12 w-28 shrink-0');
  });
  it('keeps custom font sizes and text colours together', () => {
    expect(cn('text-title text-ink', 'text-muted')).toBe('text-title text-muted');
    expect(cn('text-body', 'text-small')).toBe('text-small');
  });
  it('keeps responsive and custom variants separate', () => {
    expect(cn('hidden md:flex', 'land:hidden')).toBe('hidden md:flex land:hidden');
  });
});
