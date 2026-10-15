import { useColorScheme } from 'react-native';

import { coinColors, type ThemeTokens, tokens } from './tokens';

/** Токены текущей системной темы — для style, SVG и Reanimated, где классы недоступны. */
export function useTokens(): ThemeTokens {
  return useColorScheme() === 'dark' ? tokens.dark : tokens.light;
}

export function useCoinColors(): (typeof coinColors)['light'] | (typeof coinColors)['dark'] {
  return useColorScheme() === 'dark' ? coinColors.dark : coinColors.light;
}
