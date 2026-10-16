import { Easing, type SharedValue, withTiming } from 'react-native-reanimated';

/** Появление шторки снизу (DESIGN.md: 220 мс). */
export const SLIDE_IN_MS = 220;

/**
 * Запускает появление: progress идёт от 1 (шторка за нижним краем) к 0 (на месте). Своя анимация вместо
 * `entering={SlideInDown}`: слой layout-анимаций Reanimated внутри `Modal` на Android 16 оставляет шторку смещённой
 * вверх на высоту статус-бара и панели навигации. При «Убрать анимации» шторка появляется сразу.
 */
export function startSlideIn(progress: SharedValue<number>, reduceMotion: boolean): void {
  progress.value = reduceMotion ? 0 : withTiming(0, { duration: SLIDE_IN_MS, easing: Easing.out(Easing.cubic) });
}
