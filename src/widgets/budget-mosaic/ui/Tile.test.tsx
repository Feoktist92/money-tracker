import { type ReactTestInstance } from 'react-test-renderer';
import { act, create } from 'react-test-renderer';
import { StyleSheet, Text, View } from 'react-native';

import type { BudgetRow } from '@/entities/budget';
import { useDragStore } from '@/features/coin-drag';

import { Tile } from './Tile';

const NB = '\u00A0';

/** Корневой узел плитки: хост-вью (у Pressable есть ещё и композит с теми же пропсами). */
const rootNode = (tree: ReturnType<typeof create>) =>
  tree.root.findAll((node) => typeof node.type === 'string' && node.props.accessible === true)[0]!;

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

  it('название, подпись и перенос подгоняются по ширине, а не обрезаются', () => {
    const fitted = (tileRow: BudgetRow, rect: { x: number; y: number; width: number; height: number }) =>
      render(tileRow, rect)
        .tree.root.findAll((n) => typeof n.type === 'string' && n.props.adjustsFontSizeToFit === true)
        .map((n) => ({ text: String(n.props.children).replace(/,/g, ''), min: n.props.minimumFontScale }));
    const carryRow = row({
      name: 'Развлечения',
      carryIn: 70_000,
      available: 670_000,
      spent: 214_000,
      remaining: 456_000,
    });
    const stacked = fitted(carryRow, { x: 210, y: 285, width: 168, height: 130 });
    expect(stacked.filter((n) => n.min === 0.8).map((n) => n.text)).toEqual(
      expect.arrayContaining(['Развлечения', `2${NB}140 из 18${NB}000`]),
    );
    expect(stacked.some((n) => n.min === 0.8 && n.text.includes('с сентября'))).toBe(true);
    const compact = fitted(row({ name: 'Подписки', state: 'near' }), { x: 210, y: 555, width: 168, height: 49 });
    expect(compact).toContainEqual({ text: 'Подписки', min: 0.8 });
  });

  it('у плитки есть подпись для TalkBack', () => {
    const { tree } = render(row({}));
    const node = rootNode(tree);
    expect(node.props.accessibilityLabel).toBe('Продукты, осталось 6 760 рублей из 18 000, потрачено 62 процента');
  });

  it('размер и положение берутся из раскладки', () => {
    const { tree } = render(row({}), { x: 12, y: 317, width: 194, height: 163 });
    const style = rootNode(tree).props.style;
    expect(JSON.stringify(style)).toContain('"left":12');
    expect(JSON.stringify(style)).toContain('"height":163');
  });

  describe('во время перетаскивания монеты', () => {
    const account = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' } as const;
    const income = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' } as const;
    const target = { kind: 'category', id: 'c', name: 'Продукты' } as const;
    const root = rootNode;
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

    it('перерасход под монетой: фон меняется, заливки по-прежнему нет', () => {
      const over = row({ limit: 700_000, available: 700_000, spent: 786_000, remaining: -86_000, state: 'over' });
      act(() => useDragStore.getState().begin(account, [target]));
      act(() => useDragStore.getState().setHover('category:c'));
      const { tree } = render(over);
      const rootStyle = flat(tree);
      expect(rootStyle.backgroundColor).toBeDefined();
      // единственный потомок с абсолютным позиционированием и процентной высотой — заливка; её быть не должно
      const fills = tree.root
        .findAllByType(View)
        .filter((node) => typeof StyleSheet.flatten(node.props.style)?.height === 'string');
      expect(fills).toHaveLength(0);
      expect(tree.root.findAllByProps({ pointerEvents: 'none' }).length).toBeGreaterThan(0);
    });

    it('без жеста вид обычный', () => {
      const { tree } = render(row({}));
      expect(flat(tree).opacity).toBeUndefined();
    });
  });

  describe('нажатие и превью', () => {
    const renderTile = (props: Partial<React.ComponentProps<typeof Tile>> = {}) => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(
          <Tile
            row={row({})}
            rect={{ x: 12, y: 4, width: 194, height: 309 }}
            carryFrom="сентября"
            fontScale={1}
            {...props}
          />,
        );
      });
      return tree;
    };

    /** Композит Pressable (внешний узел с подписью): у него onPress и disabled. */
    const pressNode = (tree: ReturnType<typeof create>) =>
      tree.root.findAll((node) => typeof node.type !== 'string' && node.props.accessibilityLabel !== undefined)[0]!;

    it('нажатие отдаёт строку бюджета; плитка становится кнопкой', () => {
      const onPress = jest.fn();
      const tree = renderTile({ onPress });
      expect(rootNode(tree).props.accessibilityRole).toBe('button');
      act(() => {
        pressNode(tree).props.onPress();
      });
      expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c', name: 'Продукты' }));
    });

    it('без onPress плитка не кнопка, не объявляется отключённой и не реагирует на нажатие', () => {
      const tree = renderTile();
      expect(rootNode(tree).props.accessibilityRole).toBeUndefined();
      expect(pressNode(tree).props.disabled).toBeUndefined();
      expect(rootNode(tree).props.accessibilityState?.disabled).not.toBe(true);
      expect(pressNode(tree).props.onPress).toBeUndefined();
      expect(() =>
        act(() => {
          pressNode(tree).props.onPress?.();
        }),
      ).not.toThrow();
    });

    it('превью («поднята»): рамка accent 2 dp и не тускнеет, когда настоящая плитка тускнеет', () => {
      act(() => useDragStore.getState().begin({ kind: 'income', id: 'salary', name: 'Зарплата', icon: 'x' }, []));
      const real = renderTile();
      const raised = renderTile({ raised: true });
      expect(StyleSheet.flatten(rootNode(real).props.style).opacity).toBe(0.55);
      expect(StyleSheet.flatten(rootNode(raised).props.style).opacity).toBeUndefined();
      const frame = raised.root.findAll(
        (node) => node.props.pointerEvents === 'none' && StyleSheet.flatten(node.props.style)?.borderWidth === 2,
      );
      expect(frame.length).toBeGreaterThan(0);
      act(() => {
        useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
      });
    });
  });
});
