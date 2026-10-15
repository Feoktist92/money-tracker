import { readFileSync } from 'node:fs';
import path from 'node:path';

import { type ThemeTokens, tokens } from './tokens';

const css = readFileSync(path.join(__dirname, '../../../../global.css'), 'utf8');

/** Переменные одного блока «@variant <name> { … }». */
function variables(variant: 'light' | 'dark'): Record<string, string> {
  const block = new RegExp(`@variant ${variant} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]));
}

/** Токен → CSS-переменная. surface/accent/onAccent живут в переменных HeroUI. */
const CSS_VARIABLE: Record<string, (t: ThemeTokens) => string> = {
  '--color-ground': (t) => t.ground,
  '--background': (t) => t.ground,
  '--surface': (t) => t.surface,
  '--color-nav': (t) => t.nav,
  '--color-tile': (t) => t.tile,
  '--color-fill': (t) => t.fill,
  '--color-key': (t) => t.key,
  '--color-divider': (t) => t.divider,
  '--color-ink': (t) => t.ink,
  '--foreground': (t) => t.ink,
  '--color-ink-secondary': (t) => t.inkSecondary,
  '--accent': (t) => t.accent,
  '--accent-foreground': (t) => t.onAccent,
  '--color-tonal': (t) => t.tonal,
  '--color-on-tonal': (t) => t.onTonal,
  '--color-carry': (t) => t.carry,
  '--color-near-tile': (t) => t.near.tile,
  '--color-near-fill': (t) => t.near.fill,
  '--color-near-text': (t) => t.near.text,
  '--color-over-tile': (t) => t.over.tile,
  '--color-over-text': (t) => t.over.text,
};

describe.each(['light', 'dark'] as const)('global.css ↔ tokens.ts (%s)', (variant) => {
  const vars = variables(variant);
  it.each(Object.entries(CSS_VARIABLE))('%s', (name, pick) => {
    // Prettier приводит hex в CSS к нижнему регистру
    expect(vars[name]?.toLowerCase()).toBe(pick(tokens[variant]).toLowerCase());
  });
});
