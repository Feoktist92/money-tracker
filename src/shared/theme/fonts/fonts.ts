import { GolosText_400Regular } from '@expo-google-fonts/golos-text/400Regular';
import { GolosText_500Medium } from '@expo-google-fonts/golos-text/500Medium';
import { GolosText_600SemiBold } from '@expo-google-fonts/golos-text/600SemiBold';
import { GolosText_700Bold } from '@expo-google-fonts/golos-text/700Bold';

/** Карта для useFonts из expo-font. Подпути пакета — чтобы не тянуть в бандл веса 800 и 900. */
export const fontAssets = { GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold, GolosText_700Bold };

/** На Android вес задаётся семейством, а не fontWeight. */
export const fontFamily = {
  400: 'GolosText_400Regular',
  500: 'GolosText_500Medium',
  600: 'GolosText_600SemiBold',
  700: 'GolosText_700Bold',
} as const;
export type FontWeight = keyof typeof fontFamily;

/** Типографика DESIGN.md, размеры в sp. body — для списков и обычного текста. */
export const typeScale = {
  titleApp: { size: 22, weight: 600 },
  amountInput: { size: 44, weight: 700 },
  tileAmount: { size: 20, weight: 700 },
  tileName: { size: 14, weight: 600 },
  label: { size: 14, weight: 600 },
  section: { size: 13, weight: 600 },
  caption: { size: 12, weight: 400 },
  body: { size: 16, weight: 400 },
} as const satisfies Record<string, { size: number; weight: FontWeight }>;
export type TypeRole = keyof typeof typeScale;
