// Токены DESIGN.md («Токены в коде», «Цвет»). Те же значения продублированы в global.css —
// синхронность проверяет tokens.test.ts.

export interface ThemeTokens {
  ground: string;
  surface: string;
  nav: string;
  tile: string;
  fill: string;
  key: string;
  divider: string;
  ink: string;
  inkSecondary: string;
  accent: string;
  onAccent: string;
  tonal: string;
  onTonal: string;
  carry: string;
  near: { tile: string; fill: string; text: string };
  over: { tile: string; text: string };
}

export const tokens = {
  light: {
    ground: '#F4F3F8',
    surface: '#FFFFFF',
    nav: '#FFFFFF',
    tile: '#E7E4F4',
    fill: '#C9C1EE',
    key: '#F4F3F8',
    divider: '#ECE9F6',
    ink: '#1B1730',
    inkSecondary: '#4A4470',
    accent: '#5B3FD6',
    onAccent: '#FFFFFF',
    tonal: '#E3DFF6',
    onTonal: '#3B2A9E',
    carry: '#3B2A9E',
    near: { tile: '#F6E7C6', fill: '#EBCB87', text: '#3A2600' },
    over: { tile: '#F3B6B3', text: '#6E0D14' },
  },
  dark: {
    ground: '#12101C',
    surface: '#1E1B30',
    nav: '#1A1728',
    tile: '#1E1B30',
    fill: '#3A3366',
    key: '#2A2546',
    divider: '#2A2546',
    ink: '#EFEDFA',
    inkSecondary: '#B2ABD6',
    accent: '#A99BFF',
    onAccent: '#12101C',
    tonal: '#2F2A55',
    onTonal: '#CFC7FF',
    carry: '#CFC7FF',
    near: { tile: '#3A2C12', fill: '#6E5220', text: '#F7D58D' },
    over: { tile: '#5A2025', text: '#FFC9C6' },
  },
} as const satisfies Record<'light' | 'dark', ThemeTokens>;

/** Цвета монет счетов (DESIGN.md, «Цвет»). Ключ хранится в accounts.color. */
export const coinColors = {
  light: { violet: '#2A1F66', teal: '#0F766E', amber: '#7A4B12' },
  dark: { violet: '#5A4BC4', teal: '#2BB5A8', amber: '#D9922F' },
} as const;
export type CoinColor = keyof (typeof coinColors)['light'];

/** Цвет значка внутри монеты счёта (DESIGN.md): белый; в тёмной теме на бирюзовой и янтарной монете — тёмный. */
export const coinIconColors = {
  light: { violet: '#FFFFFF', teal: '#FFFFFF', amber: '#FFFFFF' },
  dark: { violet: '#FFFFFF', teal: '#06201D', amber: '#2B1A04' },
} as const;

export const radii = { tile: 20, block: 24, key: 16, button: 28, sheet: 28 } as const;
export const layout = {
  gap: 4,
  minTile: 48,
  sidePad: 12,
  minColumnShare: 0.4,
  header: 56,
  tray: 72,
  nav: 80,
  navIndicator: { width: 64, height: 32 },
  touch: 48,
} as const;

/** Доля потраченного от доступного, с которой плитка становится «почти». */
export const NEAR_THRESHOLD = 0.9;
