import { Text, type TextProps, type TextStyle } from 'react-native';

import { type FontWeight, fontFamily, type TypeRole, typeScale } from '@/shared/theme/fonts';
import { useTokens } from '@/shared/theme/useTokens';

export type AppTextProps = TextProps & {
  /** Роль из типографики DESIGN.md. Не `role`: это имя занято accessibility-пропом Text. */
  variant?: TypeRole;
  /** Переопределить вес роли. */
  weight?: FontWeight;
  color?: string;
};

/** Text с Golos Text, табличными цифрами и цветом ink по умолчанию. */
export function AppText({ variant = 'body', weight, color, style, ...rest }: AppTextProps) {
  const t = useTokens();
  const scale = typeScale[variant];
  const base: TextStyle = {
    fontFamily: fontFamily[weight ?? scale.weight],
    fontSize: scale.size,
    lineHeight: Math.round(scale.size * 1.3),
    color: color ?? t.ink,
    fontVariant: ['tabular-nums'],
  };
  return <Text {...rest} style={[base, style]} />;
}
