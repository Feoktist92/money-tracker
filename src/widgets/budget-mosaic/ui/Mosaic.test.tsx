import { ScrollView, View } from 'react-native';
import { act, create } from 'react-test-renderer';

import type { BudgetRow } from '@/entities/budget';

import { Mosaic } from './Mosaic';
import { Tile } from './Tile';

const row = (i: number, patch: Partial<BudgetRow> = {}): BudgetRow => ({
  categoryId: `c${i}`,
  name: `Категория ${i}`,
  icon: 'house',
  color: 'violet',
  hasLimit: true,
  limit: 100_000 + i,
  carryIn: 0,
  available: 100_000 + i,
  spent: 10_000,
  remaining: 90_000 + i,
  state: 'normal',
  ...patch,
});

/** Рендерит мозаику и сообщает ей размер области, как это делает onLayout на устройстве. */
function render(rows: BudgetRow[], size = { width: 390, height: 608 }, onTilePress?: (row: BudgetRow) => void) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<Mosaic rows={rows} carryFrom="сентября" onTilePress={onTilePress} />);
  });
  const root = tree.root.findAllByType(View)[0]!;
  act(() => {
    root.props.onLayout({ nativeEvent: { layout: size } });
  });
  return tree;
}

describe('Mosaic', () => {
  it('до измерения области плиток нет', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Mosaic rows={[row(1)]} carryFrom="сентября" />);
    });
    expect(tree.root.findAllByType(Tile)).toHaveLength(0);
  });

  it('после измерения — по плитке на категорию, без прокрутки', () => {
    const tree = render(Array.from({ length: 8 }, (_, i) => row(i)));
    expect(tree.root.findAllByType(Tile)).toHaveLength(8);
    expect(tree.root.findAllByType(ScrollView)).toHaveLength(0);
  });

  it('много категорий — область прокручивается, плитки не сжимаются ниже минимума', () => {
    const tree = render(Array.from({ length: 30 }, (_, i) => row(i)));
    expect(tree.root.findAllByType(ScrollView)).toHaveLength(1);
    for (const tile of tree.root.findAllByType(Tile)) expect(tile.props.rect.height).toBeGreaterThanOrEqual(48);
  });

  it('нулевая область (0×0) не даёт плиток', () => {
    expect(render([row(1)], { width: 0, height: 0 }).root.findAllByType(Tile)).toHaveLength(0);
  });

  it('без категорий ничего не рисует и не падает', () => {
    expect(render([]).root.findAllByType(Tile)).toHaveLength(0);
  });

  it('нажатие на плитку передаётся наружу вместе со строкой бюджета', () => {
    const onTilePress = jest.fn();
    const rows = [row(1), row(2)];
    const tree = render(rows, undefined, onTilePress);
    const tile = tree.root.findAllByType(Tile)[0]!;
    act(() => tile.props.onPress(rows[0]));
    expect(onTilePress).toHaveBeenCalledWith(rows[0]);
  });

  describe('пустое состояние', () => {
    const renderEmpty = (onAddCategory?: () => void) => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(<Mosaic rows={[]} carryFrom="сентября" onAddCategory={onAddCategory} />);
      });
      return tree;
    };
    const addButton = (tree: ReturnType<typeof create>) =>
      tree.root.findAll(
        (n) => n.props.accessibilityLabel === 'Добавить категорию' && typeof n.props.onPress === 'function',
      )[0];

    it('нет категорий и есть обработчик: подсказка и кнопка «Добавить категорию»', () => {
      const onAdd = jest.fn();
      const tree = renderEmpty(onAdd);
      act(() => addButton(tree)!.props.onPress());
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('без обработчика пустая мозаика ничего не рисует', () => {
      expect(addButton(renderEmpty())).toBeUndefined();
    });

    it('с категориями кнопки нет', () => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(<Mosaic rows={[row(1)]} carryFrom="сентября" onAddCategory={jest.fn()} />);
      });
      expect(addButton(tree)).toBeUndefined();
    });
  });

  it('действие «Записать расход» передаётся плиткам', () => {
    const onQuick = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Mosaic rows={[row(1)]} carryFrom="сентября" onTileQuickEntry={onQuick} />);
    });
    act(() =>
      tree.root.findAllByType(View)[0]!.props.onLayout({ nativeEvent: { layout: { width: 390, height: 608 } } }),
    );
    expect(tree.root.findAllByType(Tile)[0]!.props.onQuickEntry).toBe(onQuick);
  });
});
