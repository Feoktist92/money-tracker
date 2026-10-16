import type { RefObject } from 'react';
import type { View } from 'react-native';

import { collectCandidates, MEASURE_TIMEOUT_MS, measureTargets, measureView, registerTarget } from './registry';
import type { DragSource, DropTargetInfo } from './types';

const fakeRef = (box: [number, number, number, number] | null): RefObject<View | null> =>
  ({
    current: box ? ({ measureInWindow: (cb: (...a: number[]) => void) => cb(...box) } as unknown as View) : null,
  }) as RefObject<View | null>;

const food: DropTargetInfo = { kind: 'category', id: 'food', name: 'Продукты' };
const savings: DropTargetInfo = { kind: 'account', id: 'savings', name: 'Накопления' };
const main: DropTargetInfo = { kind: 'account', id: 'main', name: 'Основная' };
const account: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const income: DragSource = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' };

const silentRef = (): RefObject<View | null> =>
  ({ current: { measureInWindow: () => undefined } as unknown as View }) as RefObject<View | null>;

let cleanups: (() => void)[] = [];
afterEach(() => {
  jest.useRealTimers();
  cleanups.forEach((fn) => fn());
  cleanups = [];
});
const register = (info: DropTargetInfo, box: [number, number, number, number] | null) => {
  const ref = fakeRef(box);
  cleanups.push(registerTarget(info, ref));
  return ref;
};

describe('registry', () => {
  it('collectCandidates оставляет только допустимые цели', () => {
    register(food, [0, 0, 10, 10]);
    register(savings, [0, 0, 10, 10]);
    register(main, [0, 0, 10, 10]);
    expect(
      collectCandidates(account)
        .map((c) => c.info.id)
        .sort(),
    ).toEqual(['food', 'savings']);
    expect(
      collectCandidates(income)
        .map((c) => c.info.id)
        .sort(),
    ).toEqual(['main', 'savings']);
  });

  it('отмена регистрации убирает цель', () => {
    const off = registerTarget(food, fakeRef([0, 0, 10, 10]));
    expect(collectCandidates(account)).toHaveLength(1);
    off();
    expect(collectCandidates(account)).toHaveLength(0);
  });

  it('старая отмена не сносит новую регистрацию того же ключа', () => {
    const offOld = registerTarget(food, fakeRef([0, 0, 10, 10]));
    cleanups.push(registerTarget(food, fakeRef([5, 5, 20, 20])));
    offOld();
    expect(collectCandidates(account)).toHaveLength(1);
  });

  it('measureTargets возвращает прямоугольники с ключами', async () => {
    register(food, [12, 4, 194, 309]);
    register(savings, [210, 4, 168, 156]);
    const rects = await measureTargets(collectCandidates(account));
    expect(rects).toEqual(
      expect.arrayContaining([
        { key: 'category:food', x: 12, y: 4, width: 194, height: 309 },
        { key: 'account:savings', x: 210, y: 4, width: 168, height: 156 },
      ]),
    );
    expect(rects).toHaveLength(2);
  });

  it('размонтированные и нулевые по размеру цели отбрасываются', async () => {
    register(food, null);
    register(savings, [0, 0, 0, 40]);
    expect(await measureTargets(collectCandidates(account))).toEqual([]);
  });

  it('measureView не зависает, если measureInWindow не отвечает', async () => {
    jest.useFakeTimers();
    const pending = measureView(silentRef());
    jest.advanceTimersByTime(MEASURE_TIMEOUT_MS);
    expect(await pending).toBeNull();
  });

  it('measureTargets отбрасывает не ответившую цель и оставляет остальные', async () => {
    jest.useFakeTimers();
    register(food, [12, 4, 194, 309]);
    cleanups.push(registerTarget(savings, silentRef()));
    const pending = measureTargets(collectCandidates(account));
    jest.advanceTimersByTime(MEASURE_TIMEOUT_MS);
    expect(await pending).toEqual([{ key: 'category:food', x: 12, y: 4, width: 194, height: 309 }]);
  });
});
