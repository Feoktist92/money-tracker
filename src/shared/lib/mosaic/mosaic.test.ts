import { layoutMosaic, type MosaicItem, type MosaicOptions } from './mosaic';

/** Область главного экрана макета C-main: 390×844 минус статус-бар 28, шапка 56, лоток 72, навигация 80. */
const SCREEN: MosaicOptions = {
  width: 390,
  height: 608,
  gap: 4,
  minTile: 48,
  sidePad: 12,
  verticalPad: 4,
  minColumnShare: 0.4,
};

/** Категории макета в порядке пользователя; вес = доступно (лимит + перенос), в рублях. */
const MOCK: MosaicItem[] = [
  { id: 'Продукты', weight: 18000 },
  { id: 'Дом и ЖКХ', weight: 9500 },
  { id: 'Кафе', weight: 7000 },
  { id: 'Одежда', weight: 8000 },
  { id: 'Транспорт', weight: 6000 },
  { id: 'Развлечения', weight: 6700 },
  { id: 'Здоровье', weight: 6800 },
  { id: 'Подписки', weight: 2500 },
];

const box = (t: { x: number; y: number; width: number; height: number }) => [t.x, t.y, t.width, t.height];

describe('layoutMosaic на данных макета C-main', () => {
  const { tiles, contentHeight } = layoutMosaic(MOCK, SCREEN);
  const byId = Object.fromEntries(tiles.map((t) => [t.id, t]));

  it('левая колонка — первые три категории: 194 dp, высоты 309 / 163 / 120', () => {
    expect(box(byId['Продукты']!)).toEqual([12, 4, 194, 309]);
    expect(box(byId['Дом и ЖКХ']!)).toEqual([12, 317, 194, 163]);
    expect(box(byId['Кафе']!)).toEqual([12, 484, 194, 120]);
  });

  it('правая колонка — остальные пять: 168 dp, высоты 156 / 117 / 130 / 132 / 49', () => {
    expect(box(byId['Одежда']!)).toEqual([210, 4, 168, 156]);
    expect(box(byId['Транспорт']!)).toEqual([210, 164, 168, 117]);
    expect(box(byId['Развлечения']!)).toEqual([210, 285, 168, 130]);
    expect(box(byId['Здоровье']!)).toEqual([210, 419, 168, 132]);
    expect(box(byId['Подписки']!)).toEqual([210, 555, 168, 49]);
  });

  it('помещается без прокрутки, плитки идут в порядке списка', () => {
    expect(contentHeight).toBe(608);
    expect(tiles.map((t) => t.id)).toEqual(MOCK.map((m) => m.id));
  });
});

describe('layoutMosaic: дробная высота из onLayout', () => {
  it('высоты плиток целые, колонка занимает ровно floor(высота) минус отступы и зазоры', () => {
    const { tiles } = layoutMosaic(MOCK, { ...SCREEN, height: 607.64, width: 389.7 });
    for (const column of [0, 1] as const) {
      const col = tiles.filter((t) => t.column === column);
      expect(col.every((t) => Number.isInteger(t.height) && Number.isInteger(t.width))).toBe(true);
      const sum = col.reduce((acc, t) => acc + t.height, 0);
      expect(sum).toBe(607 - 2 * 4 - 4 * (col.length - 1));
    }
  });

  it('пустой список возвращает целую высоту', () => {
    expect(layoutMosaic([], { ...SCREEN, height: 607.64 }).contentHeight).toBe(607);
  });
});

describe('layoutMosaic: общие свойства', () => {
  it('пустой список — нет плиток', () => {
    expect(layoutMosaic([], SCREEN)).toEqual({ tiles: [], contentHeight: 608 });
  });

  it('одна плитка занимает всю область', () => {
    const { tiles } = layoutMosaic([{ id: 'a', weight: 5 }], SCREEN);
    expect(tiles.map(box)).toEqual([[12, 4, 366, 600]]);
  });

  it('две плитки равного веса делят область поровну', () => {
    const { tiles } = layoutMosaic(
      [
        { id: 'a', weight: 10 },
        { id: 'b', weight: 10 },
      ],
      SCREEN,
    );
    expect(tiles.map(box)).toEqual([
      [12, 4, 181, 600],
      [197, 4, 181, 600],
    ]);
  });

  it('нулевые веса — поровну', () => {
    const { tiles } = layoutMosaic(
      [
        { id: 'a', weight: 0 },
        { id: 'b', weight: 0 },
        { id: 'c', weight: 0 },
        { id: 'd', weight: 0 },
      ],
      SCREEN,
    );
    expect(new Set(tiles.map((t) => t.height)).size).toBe(1);
    expect(new Set(tiles.map((t) => t.width)).size).toBe(1);
  });

  it('вес меньше 1% от суммы поднимается до 1%, плитка не ниже minTile', () => {
    const { tiles } = layoutMosaic(
      [
        { id: 'big', weight: 100000 },
        { id: 'zero', weight: 0 },
        { id: 'tiny', weight: 1 },
      ],
      SCREEN,
    );
    for (const t of tiles) expect(t.height).toBeGreaterThanOrEqual(48);
  });

  it('узкая колонка не уже minColumnShare области', () => {
    const { tiles } = layoutMosaic(
      [
        { id: 'huge', weight: 100000 },
        { id: 'small', weight: 10 },
      ],
      SCREEN,
    );
    const usable = 390 - 24 - 4;
    expect(tiles.find((t) => t.id === 'small')!.width).toBeGreaterThanOrEqual(Math.round(usable * 0.4));
  });

  it('много категорий: плитки не ниже minTile, содержимое выше области — нужна прокрутка', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ id: `c${i}`, weight: 1000 + i }));
    const { tiles, contentHeight } = layoutMosaic(items, SCREEN);
    expect(contentHeight).toBeGreaterThan(608);
    for (const t of tiles) expect(t.height).toBeGreaterThanOrEqual(48);
  });

  it('те же веса — та же раскладка (она не зависит от трат, только от весов)', () => {
    expect(layoutMosaic(MOCK, SCREEN)).toEqual(
      layoutMosaic(
        MOCK.map((m) => ({ ...m })),
        SCREEN,
      ),
    );
  });
});

describe('layoutMosaic: инварианты на случайных наборах', () => {
  // Детерминированный генератор, чтобы тест воспроизводился.
  function rng(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  it.each([1, 2, 3, 5, 8, 12, 20])(
    '%p плиток: сумма высот колонки равна доступной, плитки не пересекаются',
    (count) => {
      const random = rng(count * 7919);
      for (let round = 0; round < 25; round += 1) {
        const items = Array.from({ length: count }, (_, i) => ({ id: `t${i}`, weight: Math.floor(random() * 50000) }));
        const { tiles, contentHeight } = layoutMosaic(items, SCREEN);
        expect(tiles).toHaveLength(count);
        for (const col of [0, 1] as const) {
          const column = tiles.filter((t) => t.column === col);
          if (column.length === 0) continue;
          const sum = column.reduce((a, t) => a + t.height, 0) + 4 * (column.length - 1);
          if (contentHeight === 608) expect(sum).toBe(600);
          else expect(sum).toBeLessThanOrEqual(contentHeight - 8);
          column.slice(1).forEach((t, i) => expect(t.y).toBe(column[i]!.y + column[i]!.height + 4));
        }
        for (const t of tiles) {
          expect(t.x).toBeGreaterThanOrEqual(12);
          expect(t.x + t.width).toBeLessThanOrEqual(390 - 12);
          expect(Number.isInteger(t.height) && Number.isInteger(t.width)).toBe(true);
        }
      }
    },
  );
});
