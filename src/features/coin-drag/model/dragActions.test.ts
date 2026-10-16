import type { RefObject } from 'react';
import type { View } from 'react-native';

import { GHOST, returnGhost, SHIFT, startDrag } from './dragActions';
import { useDragStore } from './dragStore';
import { dragMotion } from './motion';
import { registerTarget } from './registry';
import type { DragSource, DropTargetInfo } from './types';

// Самодостаточная заглушка: официальная заглушка Reanimated делает makeMutable тождественной функцией
// (значение без поля .value) и не знает useReducedMotion, а здесь нужны настоящие общие значения.
jest.mock('react-native-reanimated', () => ({
  makeMutable: (value: unknown) => ({ value }),
  withSpring: (value: number) => value,
  useReducedMotion: () => false,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

type Callback = (x: number, y: number, width: number, height: number) => void;

/** Вид, чьё измерение завершается вручную: callbacks копятся по порядку вызовов measureInWindow. */
function deferredRef() {
  const callbacks: Callback[] = [];
  const ref = {
    current: { measureInWindow: (cb: Callback) => callbacks.push(cb) } as unknown as View,
  } as RefObject<View | null>;
  /** Завершает i-е измерение этого вида. */
  const resolve = (index: number, x: number, y: number, width: number, height: number) => {
    const callback = callbacks[index];
    if (!callback) throw new Error(`measureInWindow №${index} не вызывался`);
    callback(x, y, width, height);
  };
  return { ref, callbacks, resolve };
}

const food: DropTargetInfo = { kind: 'category', id: 'food', name: 'Продукты' };
const main: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const cash: DragSource = { kind: 'account', id: 'cash', name: 'Наличные', icon: 'wallet', color: 'green' };

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

let cleanups: (() => void)[] = [];

beforeEach(() => {
  dragMotion.rects.value = [];
  dragMotion.originX.value = 0;
  dragMotion.originY.value = 0;
  dragMotion.x.value = 0;
  dragMotion.y.value = 0;
  useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
});

afterEach(() => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});

const registerFood = () => {
  const target = deferredRef();
  cleanups.push(registerTarget(food, target.ref));
  return target;
};

describe('startDrag', () => {
  it('второй startDrag при монете в руке игнорируется', async () => {
    registerFood();
    const first = deferredRef();
    const second = deferredRef();
    const pending = startDrag(main, first.ref);
    await startDrag(cash, second.ref);
    expect(useDragStore.getState().source).toEqual(main);
    expect(second.callbacks).toHaveLength(0);
    first.resolve(0, 10, 20, 64, 64);
    await pending;
  });

  it('исходный слот записывается, даже если палец отпустили до конца измерения; цели — нет', async () => {
    const target = registerFood();
    const origin = deferredRef();
    const pending = startDrag(main, origin.ref);
    useDragStore.getState().finish(null); // палец отпущен: фаза returning
    target.resolve(0, 12, 4, 194, 309);
    origin.resolve(0, 100, 700, 60, 60);
    await pending;
    expect(dragMotion.originX.value).toBe(130);
    expect(dragMotion.originY.value).toBe(730);
    expect(dragMotion.rects.value).toEqual([]);
  });

  it('цели записываются, пока монета в руке', async () => {
    const target = registerFood();
    const origin = deferredRef();
    const pending = startDrag(main, origin.ref);
    target.resolve(0, 12, 4, 194, 309);
    origin.resolve(0, 100, 700, 60, 60);
    await pending;
    expect(dragMotion.rects.value).toEqual([{ key: 'category:food', x: 12, y: 4, width: 194, height: 309 }]);
  });

  it('запоздалое измерение прошлого жеста не затирает данные следующего', async () => {
    const target1 = registerFood();
    const origin1 = deferredRef();
    const drag1 = startDrag(main, origin1.ref);
    useDragStore.getState().finish(null);
    useDragStore.getState().settle(); // фаза idle: можно начинать новый жест

    cleanups.forEach((fn) => fn());
    cleanups = [];
    const target2 = registerFood();
    const origin2 = deferredRef();
    const drag2 = startDrag(cash, origin2.ref);

    // сначала приходит второе измерение, потом — запоздалое первое
    target2.resolve(0, 50, 60, 70, 80);
    origin2.resolve(0, 300, 400, 60, 60);
    await flush();
    target1.resolve(0, 1, 1, 1, 1);
    origin1.resolve(0, 900, 900, 60, 60);
    await Promise.all([drag1, drag2]);

    expect(dragMotion.originX.value).toBe(330);
    expect(dragMotion.originY.value).toBe(430);
    expect(dragMotion.rects.value).toEqual([{ key: 'category:food', x: 50, y: 60, width: 70, height: 80 }]);
  });
});

describe('returnGhost', () => {
  it('без анимации ставит призрак на исходный слот и завершает жест', () => {
    dragMotion.originX.value = 130;
    dragMotion.originY.value = 730;
    useDragStore.getState().begin(main, []);
    useDragStore.getState().finish(null);
    expect(useDragStore.getState().phase).toBe('returning');

    returnGhost(true);

    expect(dragMotion.x.value).toBe(130 + SHIFT - GHOST / 2);
    expect(dragMotion.y.value).toBe(730 + SHIFT - GHOST / 2);
    expect(useDragStore.getState().phase).toBe('idle');
  });
});
