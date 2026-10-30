import { useColorScheme } from 'react-native';

import { categoryColors, coinColors, coinIconColors, resolveCategoryColor, type ThemeTokens, tokens } from '../tokens';

/** Токены текущей системной темы — для style, SVG и Reanimated, где классы недоступны. */
export function useTokens(): ThemeTokens {
  return useColorScheme() === 'dark' ? tokens.dark : tokens.light;
}

export function useCoinColors(): (typeof coinColors)['light'] | (typeof coinColors)['dark'] {
  return useColorScheme() === 'dark' ? coinColors.dark : coinColors.light;
}

export function useCoinIconColors(): (typeof coinIconColors)['light'] | (typeof coinIconColors)['dark'] {
  return useColorScheme() === 'dark' ? coinIconColors.dark : coinIconColors.light;
}

export interface CategoryPalette {
  tile: string;
  fill: string;
  strong: string;
}

/** Цвета категории (tile, fill, strong) для текущей темы; неизвестный ключ даёт фиолетовый. */
export function useCategoryColor(key: string): CategoryPalette {
  const palette = useColorScheme() === 'dark' ? categoryColors.dark : categoryColors.light;
  return palette[resolveCategoryColor(key)];
}
