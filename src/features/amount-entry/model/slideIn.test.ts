import { startSlideIn } from './slideIn';

jest.mock('react-native-reanimated', () => ({
  withTiming: (value: number, config: unknown) => ({ target: value, config }),
  Easing: { out: (fn: unknown) => fn, cubic: 'cubic' },
}));

describe('startSlideIn', () => {
  it('«Убрать анимации»: шторка сразу на месте', () => {
    const progress = { value: 1 };
    startSlideIn(progress as never, true);
    expect(progress.value).toBe(0);
  });

  it('обычный режим: плавно к нулю за 220 мс', () => {
    const progress = { value: 1 };
    startSlideIn(progress as never, false);
    expect(progress.value).toEqual({ target: 0, config: { duration: 220, easing: 'cubic' } });
  });
});
