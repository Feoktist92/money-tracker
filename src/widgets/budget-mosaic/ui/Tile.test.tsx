import { type ReactTestInstance } from 'react-test-renderer';
import { act, create } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { useDragStore } from '@/features/coin-drag';

import { Tile } from './Tile';

const NB = '\u00A0';

const row = (patch: Partial<BudgetRow>): BudgetRow => ({
  categoryId: 'c',
  name: 'Продукты',
  icon: 'shopping-basket',
  hasLimit: true,
  limit: 1_800_000,
  carryIn: 0,
  available: 1_800_000,
  spent: 1_124_000,
  remaining: 676_000,
  state: 'normal',
  ...patch,
});

function render(tileRow: BudgetRow, rect = { x: 12, y: 4, width: 194, height: 309 }, fontScale = 1) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<Tile row={tileRow} rect={rect} carryFrom="сентября" fontScale={fontScale} />);
  });
  const texts = tree.root
    .findAllByType(Text)
    .map((node: ReactTestInstance) => String(node.props.children).replace(/,/g, ''));
  return { tree, texts };
}

describe('Tile', () => {
  it('обычная плитка: имя, остаток крупно и «потрачено из лимита»', () => {
    const { texts } = render(row({}));
    expect(texts).toContain('Продукты');
    expect(texts).toContain(`6${NB}760${NB}₽`);
    expect(texts).toContain(`11${NB}240 из 18${NB}000`);
  });

  it('перерасход: остаток со знаком «\u2212»', () => {
    const { texts } = render(
      row({ name: 'Кафе', limit: 700_000, available: 700_000, spent: 786_000, remaining: -86_000, state: 'over' }),
      { x: 12, y: 484, width: 194, height: 120 },
    );
    expect(texts).toContain(`\u2212860${NB}₽`);
  });

  it('перенос: третья строка «+700 с сентября»', () => {
    const { texts } = render(
      row({
        name: 'Развлечения',
        limit: 600_000,
        carryIn: 70_000,
        available: 670_000,
        spent: 214_000,
        remaining: 456_000,
      }),
      { x: 210, y: 285, width: 168, height: 130 },
    );
    expect(texts.some((t) => t.includes('+700') && t.includes('с сентября'))).toBe(true);
  });

  it('низкая плитка: одна строка, без «потрачено из»', () => {
    const { texts } = render(
      row({ name: 'Подписки', limit: 250_000, available: 250_000, spent: 234_000, remaining: 16_000, state: 'near' }),
      { x: 210, y: 555, width: 168, height: 49 },
    );
    expect(texts).toEqual(['Подписки', `160${NB}₽`]);
  });

  it('крупный шрифт: остаток остаётся, лишние строки прячутся', () => {
    const carryRow = row({
      name: 'Развлечения',
      limit: 600_000,
      carryIn: 70_000,
      available: 670_000,
      spent: 214_000,
      remaining: 456_000,
    });
    const rect = { x: 210, y: 285, width: 168, height: 130 };
    const normal = render(carryRow, rect, 1).texts;
    const large = render(carryRow, rect, 2).texts;
    expect(large).toContain(`4${NB}560${NB}₽`);
    expect(large.length).toBeLessThan(normal.length);
  });

  it('низкая плитка с длинным названием: название сжимается, а остаток остаётся', () => {
    const longName = 'Очень длинное название категории которое не должно вытеснять сумму из плитки';
    const { tree, texts } = render(
      row({ name: longName, limit: 250_000, available: 250_000, spent: 234_000, remaining: 16_000, state: 'near' }),
      { x: 210, y: 555, width: 168, height: 49 },
    );
    expect(texts).toContain(`160${NB}₽`);
    const nameText = tree.root.findAllByType(Text).find((node) => node.props.children === longName);
    let container: ReactTestInstance | null = nameText ?? null;
    while (container && StyleSheet.flatten(container.props.style)?.minWidth !== 0) container = container.parent;
    expect(container).not.toBeNull();
    expect(StyleSheet.flatten(container!.props.style)).toMatchObject({ flexShrink: 1 });
  });

  it('у плитки есть подпись для TalkBack', () => {
    const { tree } = render(row({}));
    const node = tree.root.findByProps({ accessible: true });
    expect(node.props.accessibilityLabel).toBe('Продукты, осталось 6 760 рублей из 18 000, потрачено 62 процента');
  });

  it('размер и положение берутся из раскладки', () => {
    const { tree } = render(row({}), { x: 12, y: 317, width: 194, height: 163 });
    const style = tree.root.findByProps({ accessible: true }).props.style;
    expect(JSON.stringify(style)).toContain('"left":12');
    expect(JSON.stringify(style)).toContain('"height":163');
  });

  describe('во время перетаскивания монеты', () => {
    const account = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' } as const;
    const income = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' } as const;
    const target = { kind: 'category', id: 'c', name: 'Продукты' } as const;
    const root = (tree: ReturnType<typeof create>) => tree.root.findByProps({ accessible: true });
    const flat = (tree: ReturnType<typeof create>) => StyleSheet.flatten(root(tree).props.style);

    afterEach(() => {
      act(() => {
        useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
      });
    });

    it('доход в руке: плитка расхода тускнеет, бросить на неё нельзя', () => {
      act(() => useDragStore.getState().begin(income, []));
      expect(flat(render(row({})).tree).opacity).toBe(0.55);
    });

    it('счёт в руке: плитка остаётся яркой, а под пальцем получает рамку', () => {
      act(() => useDragStore.getState().begin(account, [target]));
      const plain = render(row({}));
      expect(flat(plain.tree).opacity).toBeUndefined();
      expect(plain.tree.root.findAllByProps({ pointerEvents: 'none' })).toHaveLength(0);
      act(() => useDragStore.getState().setHover('category:c'));
      const hovered = render(row({}));
      expect(hovered.tree.root.findAllByProps({ pointerEvents: 'none' }).length).toBeGreaterThan(0);
    });

    it('без жеста вид обычный', () => {
      const { tree } = render(row({}));
      expect(flat(tree).opacity).toBeUndefined();
    });
  });
});
