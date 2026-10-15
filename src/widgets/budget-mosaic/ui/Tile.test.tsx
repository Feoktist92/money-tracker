import { type ReactTestInstance } from 'react-test-renderer';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

import type { BudgetRow } from '@/entities/budget';

import { Tile } from './Tile';

const NB = ' ';

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

  it('перерасход: остаток со знаком «−»', () => {
    const { texts } = render(
      row({ name: 'Кафе', limit: 700_000, available: 700_000, spent: 786_000, remaining: -86_000, state: 'over' }),
      { x: 12, y: 484, width: 194, height: 120 },
    );
    expect(texts).toContain(`−860${NB}₽`);
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
});
