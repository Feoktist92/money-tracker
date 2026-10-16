import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { type CoinColor } from '@/shared/theme/tokens';
import { useCoinColors, useCoinIconColors, useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

import { GHOST, returnGhost, SHIFT } from '../model/dragActions';
import { useDragStore } from '../model/dragStore';
import { dragMotion } from '../model/motion';

const LABEL_WIDTH = 260;

const isCoinColor = (value: string, palette: Record<CoinColor, string>): value is CoinColor =>
  Object.hasOwn(palette, value);

/**
 * Призрак монеты и плавающая метка «Основная → Продукты». Кладётся поверх всего экрана и не перехватывает касания.
 * Пока монета в руке, положение берётся из общих значений жеста; при броске мимо призрак пружиной летит в лоток.
 */
export function DragLayer() {
  const phase = useDragStore((state) => state.phase);
  const source = useDragStore((state) => state.source);
  const hoverKey = useDragStore((state) => state.hoverKey);
  const hoverName = useDragStore((state) => (state.hoverKey ? state.candidates[state.hoverKey]?.name : undefined));
  const reduceMotion = useReducedMotion();
  const t = useTokens();
  const fills = useCoinColors();
  const icons = useCoinIconColors();

  useEffect(() => {
    if (phase === 'returning') returnGhost(reduceMotion);
  }, [phase, reduceMotion]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: dragMotion.x.value - SHIFT }, { translateY: dragMotion.y.value - SHIFT }],
  }));

  if (phase === 'idle' || !source) return null;

  const income = source.kind === 'income';
  const colorKey: CoinColor = !income && source.color && isCoinColor(source.color, fills) ? source.color : 'violet';
  const label = hoverKey && hoverName ? `${source.name} → ${hoverName}` : source.name;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.anchor, animated]}>
        <View style={styles.labelBox}>
          <View style={[styles.label, { backgroundColor: t.ink }]}>
            <AppText variant="label" color={t.ground} numberOfLines={1}>
              {label}
            </AppText>
          </View>
        </View>
        <View
          style={[
            styles.ghost,
            income
              ? { backgroundColor: t.surface, borderWidth: 3, borderColor: t.accent }
              : { backgroundColor: fills[colorKey], borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' },
          ]}
        >
          <AppIcon name={source.icon} size={26} color={income ? t.accent : icons[colorKey]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', top: 0, left: 0, width: GHOST },
  ghost: {
    width: GHOST,
    height: GHOST,
    borderRadius: GHOST / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  // обёртка шире якоря в 64dp: иначе Yoga обрезает ширину метки до якоря; сама метка обнимает текст
  labelBox: { position: 'absolute', bottom: GHOST + 8, left: 0, width: LABEL_WIDTH, alignItems: 'flex-start' },
  label: {
    alignSelf: 'flex-start',
    minWidth: GHOST,
    maxWidth: LABEL_WIDTH,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
