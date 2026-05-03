import { calculateMovementVelocity } from './effects';

describe('GameEffects helpers', () => {
  it('applies move upgrade multipliers to walking movement speed', () => {
    expect(calculateMovementVelocity(1.25, 120)).toBe(5);
    expect(calculateMovementVelocity(1.5, 120)).toBe(6);
    expect(calculateMovementVelocity(1.75, 120)).toBe(7);
  });

  it('keeps walking movement speed synced to music BPM', () => {
    expect(calculateMovementVelocity(1.25, 150)).toBe(6.25);
  });
});
