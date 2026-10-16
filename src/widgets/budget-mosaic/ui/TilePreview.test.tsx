import { act, create } from 'react-test-renderer';
import { View } from 'react-native';

import type { BudgetRow } from '@/entities/budget';

import { Tile } from './Tile';
import { TilePreview } from './TilePreview';

const row = (patch: Partial<BudgetRow> = {}): BudgetRow => ({
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

function render(before: BudgetRow, after: BudgetRow) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<TilePreview before={before} after={after} carryFrom="сентября" />);
  });
  return tree;
}

const measure = (tree: ReturnType<typeof create>, width: number) =>
  act(() => {
    tree.root.findAllByType(View)[0]!.props.onLayout({ nativeEvent: { layout: { width, height: 128 } } });
  });

describe('TilePreview', () => {
  it('до измерения ширины плитки нет, после — «поднятая» плитка с введённой суммой', () => {
    const tree = render(row(), row({ spent: 1_248_000, remaining: 552_000 }));
    expect(tree.root.findAllByType(Tile)).toHaveLength(0);
    measure(tree, 366);
    const tile = tree.root.findByType(Tile);
    expect(tile.props.raised).toBe(true);
    expect(tile.props.row.remaining).toBe(552_000);
    expect(tile.props.rect).toEqual({ x: 0, y: 0, width: 366, height: 120 });
  });

  it('полоска «было / прибавка» есть у категории с лимитом и пропадает без лимита', () => {
    const withLimit = render(row(), row({ spent: 1_248_000 }));
    // плитка-превью + трек полоски: трек — вид высотой 8
    const strips = (tree: ReturnType<typeof create>) =>
      tree.root.findAll(
        (n) =>
          typeof n.type === 'string' && JSON.stringify(n.props.style ?? '').includes('"height":8,"borderRadius":4'),
      );
    expect(strips(withLimit).length).toBeGreaterThan(0);
    const noLimit = render(row({ hasLimit: false }), row({ hasLimit: false }));
    expect(strips(noLimit)).toHaveLength(0);
  });
});
