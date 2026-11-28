import { describe, expect, it } from 'vitest';
import { updateState } from './updateState';

describe('in-app update state', () => {
  it('no update when up to date or when the release is not set', () => {
    expect(updateState(210, 210, 200)).toBe('none');
    expect(updateState(210, null, null)).toBe('none');
    expect(updateState(null, 220, 200)).toBe('none');
  });
  it('optional when newer exists, forced below the minimum supported version', () => {
    expect(updateState(210, 220, 200)).toBe('optional');
    expect(updateState(190, 220, 200)).toBe('forced');
  });
});
