import { moveId } from './order';

describe('moveId', () => {
  const ids = ['a', 'b', 'c'];

  it('вверх и вниз на одну позицию', () => {
    expect(moveId(ids, 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveId(ids, 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('у края порядок не меняется', () => {
    expect(moveId(ids, 'a', -1)).toEqual(ids);
    expect(moveId(ids, 'c', 1)).toEqual(ids);
  });

  it('неизвестный id и пустой список — без изменений', () => {
    expect(moveId(ids, 'x', 1)).toEqual(ids);
    expect(moveId([], 'a', 1)).toEqual([]);
  });

  it('исходный массив не меняется, результат — новый массив', () => {
    const input = ['a', 'b'];
    const out = moveId(input, 'a', 1);
    expect(input).toEqual(['a', 'b']);
    expect(out).not.toBe(input);
  });

  it('два сдвига подряд по id дают ожидаемый порядок', () => {
    expect(moveId(moveId(ids, 'c', -1), 'c', -1)).toEqual(['c', 'a', 'b']);
  });
});
