import { hitTest } from './hitTest';
import type { TargetRect } from './types';

const rects: TargetRect[] = [
  { key: 'category:a', x: 12, y: 4, width: 194, height: 309 },
  { key: 'category:b', x: 12, y: 317, width: 194, height: 163 },
  { key: 'account:main', x: 210, y: 4, width: 168, height: 156 },
];

describe('hitTest', () => {
  it('находит плитку под пальцем', () => {
    expect(hitTest(100, 100, rects)).toBe('category:a');
    expect(hitTest(100, 400, rects)).toBe('category:b');
    expect(hitTest(300, 50, rects)).toBe('account:main');
  });

  it('зазор между плитками и пустое место — не цель', () => {
    expect(hitTest(100, 314, rects)).toBeNull();
    expect(hitTest(208, 100, rects)).toBeNull();
    expect(hitTest(0, 0, rects)).toBeNull();
    expect(hitTest(100, 100, [])).toBeNull();
  });

  it('границы: левая и верхняя входят, правая и нижняя нет', () => {
    expect(hitTest(12, 4, rects)).toBe('category:a');
    expect(hitTest(206, 100, rects)).toBeNull();
    expect(hitTest(100, 313, rects)).toBeNull();
  });

  it('при пересечении побеждает последний прямоугольник', () => {
    const overlapping: TargetRect[] = [
      { key: 'category:low', x: 0, y: 0, width: 100, height: 100 },
      { key: 'category:high', x: 50, y: 50, width: 100, height: 100 },
    ];
    expect(hitTest(75, 75, overlapping)).toBe('category:high');
    expect(hitTest(25, 25, overlapping)).toBe('category:low');
  });
});
