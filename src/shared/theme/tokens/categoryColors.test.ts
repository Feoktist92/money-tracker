import { categoryColors, CATEGORY_COLOR_KEYS, COLOR_NAMES, coinColors, resolveCategoryColor, tokens } from './tokens';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Контраст WCAG двух цветов. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(['light', 'dark'] as const)('цвета категорий (%s)', (theme) => {
  const t = tokens[theme];
  it.each(CATEGORY_COLOR_KEYS)('%s: текст читается на плитке и на заливке (≥ 4,5:1), значок заметен (≥ 3:1)', (key) => {
    const c = categoryColors[theme][key];
    expect(contrast(t.ink, c.tile)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.inkSecondary, c.tile)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.ink, c.fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.inkSecondary, c.fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.strong, t.ground)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.strong, c.tile)).toBeGreaterThanOrEqual(3);
  });

  it('фиолетовый совпадает с токенами плитки по умолчанию', () => {
    expect(categoryColors[theme].violet).toEqual({ tile: t.tile, fill: t.fill, strong: t.accent });
  });
});

describe('resolveCategoryColor', () => {
  it('известный ключ остаётся, неизвестный и имена из прототипа — фиолетовый', () => {
    expect(resolveCategoryColor('teal')).toBe('teal');
    expect(resolveCategoryColor('нет такого')).toBe('violet');
    expect(resolveCategoryColor('constructor')).toBe('violet');
    expect(resolveCategoryColor('')).toBe('violet');
  });

  it('шесть цветов, фиолетовый первый (по умолчанию)', () => {
    expect(CATEGORY_COLOR_KEYS).toEqual(['violet', 'blue', 'teal', 'green', 'magenta', 'slate']);
  });
});

describe('COLOR_NAMES', () => {
  it('у каждого цвета категории и монеты есть русское название', () => {
    for (const key of [
      ...CATEGORY_COLOR_KEYS,
      ...(Object.keys(coinColors.light) as (keyof typeof coinColors.light)[]),
    ]) {
      expect(COLOR_NAMES[key]).toMatch(/^[А-ЯЁ][а-яё-]+$/);
    }
  });
});
