import { describe, expect, it } from 'vitest';
import { percent } from '../../api/queries';

describe('percent', () => {
  it('rounds to one decimal place', () => {
    expect(percent(2, 3)).toBe(66.7);
    expect(percent(17, 20)).toBe(85);
  });

  it('is 0 when there is no max score', () => {
    expect(percent(0, 0)).toBe(0);
  });
});
