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

  describe('цели в области прокрутки (clipRef)', () => {
    const viewport: [number, number, number, number] = [0, 100, 400, 500];
    const registerClipped = (info: DropTargetInfo, box: [number, number, number, number], clip = fakeRef(viewport)) => {
      cleanups.push(registerTarget(info, fakeRef(box), clip));
      return clip;
    };

    it('цель целиком за областью отбрасывается', async () => {
      registerClipped(food, [12, 700, 194, 100]); // ниже низа области (100 + 500 = 600)
      registerClipped(savings, [12, -50, 194, 100]); // выше верха области
      expect(await measureTargets(collectCandidates(account))).toEqual([]);
    });

    it('частично видимая цель обрезается по области', async () => {
      registerClipped(food, [12, 550, 194, 200]);
      registerClipped(savings, [-20, 60, 100, 100]);
      const rects = await measureTargets(collectCandidates(account));
      expect(rects).toEqual(
        expect.arrayContaining([
          { key: 'category:food', x: 12, y: 550, width: 194, height: 50 },
          { key: 'account:savings', x: 0, y: 100, width: 80, height: 60 },
        ]),
      );
      expect(rects).toHaveLength(2);
    });

    it('общая область измеряется один раз', async () => {
      const measure = jest.fn((cb: (...a: number[]) => void) => cb(...viewport));
      const clip = { current: { measureInWindow: measure } as unknown as View } as RefObject<View | null>;
      registerClipped(food, [12, 150, 194, 100], clip);
      registerClipped(savings, [12, 300, 194, 100], clip);
      expect(await measureTargets(collectCandidates(account))).toHaveLength(2);
      expect(measure).toHaveBeenCalledTimes(1);
    });

    it('цель без области ведёт себя как прежде', async () => {
      register(food, [12, 5000, 194, 100]);
      expect(await measureTargets(collectCandidates(account))).toEqual([
        { key: 'category:food', x: 12, y: 5000, width: 194, height: 100 },
      ]);
    });

    it('область не измерилась (размонтирована) — её цели отбрасываются', async () => {
      const gone = fakeRef(null);
      registerClipped(food, [12, 150, 194, 100], gone);
      register(savings, [12, 300, 194, 100]);
      expect(await measureTargets(collectCandidates(account))).toEqual([
        { key: 'account:savings', x: 12, y: 300, width: 194, height: 100 },
      ]);
    });
  });
});
