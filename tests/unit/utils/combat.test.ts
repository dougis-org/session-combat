import { calcConSaveDC } from '@/lib/utils/combat';

describe('calcConSaveDC', () => {
  it('returns 10 for 0 damage (edge: zero damage)', () => {
    expect(calcConSaveDC(0)).toBe(10);
  });

  it('returns 10 for 14 damage (floor(14/2)=7 → max(10,7)=10)', () => {
    expect(calcConSaveDC(14)).toBe(10);
  });

  it('returns 10 for 19 damage (floor(19/2)=9 → max(10,9)=10)', () => {
    expect(calcConSaveDC(19)).toBe(10);
  });

  it('returns 10 for 20 damage (floor(20/2)=10 → max(10,10)=10)', () => {
    expect(calcConSaveDC(20)).toBe(10);
  });

  it('returns 10 for 21 damage (floor(21/2)=10 → max(10,10)=10)', () => {
    expect(calcConSaveDC(21)).toBe(10);
  });

  it('returns 25 for 50 damage (floor(50/2)=25 → max(10,25)=25)', () => {
    expect(calcConSaveDC(50)).toBe(25);
  });
});
