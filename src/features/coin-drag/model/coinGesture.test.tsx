import { DeviceEventEmitter, View } from 'react-native';
import { act, create } from 'react-test-renderer';
import { GestureDetector, State } from 'react-native-gesture-handler';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';

import { createCoinGesture } from './coinGesture';
import { useDragStore } from './dragStore';
import { dragMotion } from './motion';
import type { DragSource, DropTargetInfo } from './types';

// Самодостаточная заглушка: официальная заглушка Reanimated делает makeMutable тождественной функцией
// (значение без поля .value), а жесту нужны настоящие общие значения.
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

const main: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const food: DropTargetInfo = { kind: 'category', id: 'food', name: 'Продукты' };
const FOOD_RECT = { key: 'category:food', x: 100, y: 100, width: 100, height: 100 };

/** Монтирует жест в GestureDetector (присваивается handlerTag) и возвращает его. */
function mount() {
  // begin в приложении запускает startDrag: он заводит хранилище и (после измерения) записывает прямоугольники целей;
  // onStart очищает rects, поэтому «измерение» эмулируется здесь
  const gesture = createCoinGesture(() => {
    useDragStore.getState().begin(main, [food]);
    dragMotion.rects.value = [FOOD_RECT];
  });
  act(() => {
    create(
      <GestureDetector gesture={gesture}>
        <View />
      </GestureDetector>,
    );
  });
  return gesture;
}

const reset = () => {
  dragMotion.active.value = 0;
  dragMotion.owner.value = -1;
  dragMotion.hoverKey.value = null;
  dragMotion.rects.value = [FOOD_RECT];
  useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
};

beforeEach(reset);

// scheduleOnRN в заглушке Worklets идёт через микрозадачу: после жеста ждём, пока JS-колбэки выполнятся
const settled = () => act(async () => {});

const onFood = { absoluteX: 150, absoluteY: 150 };
const away = { absoluteX: 10, absoluteY: 10 };

const tagOf = (gesture: { handlerTag?: number }) => gesture.handlerTag as number;

const emit = (
  tag: number,
  state: State,
  oldState: State,
  point: { absoluteX: number; absoluteY: number },
  change = true,
) =>
  DeviceEventEmitter.emit(change ? 'onGestureHandlerStateChange' : 'onGestureHandlerEvent', {
    handlerTag: tag,
    state,
    // у события обновления (то же состояние) oldState нет: так жест отличает его от смены состояния
    ...(change ? { oldState } : {}),
    numberOfPointers: 1,
    x: 0,
    y: 0,
    translationX: 0,
    translationY: 0,
    velocityX: 0,
    velocityY: 0,
    ...point,
  });

/** Палец коснулся и жест активировался; ждём JS-колбэки (begin записывает цели). */
async function pickUp(tag: number, point = away) {
  emit(tag, State.BEGAN, State.UNDETERMINED, point);
  emit(tag, State.ACTIVE, State.BEGAN, point);
  await settled();
}

describe('createCoinGesture', () => {
  it('конец жеста над целью засчитывает бросок', async () => {
    const tag = tagOf(mount());
    await pickUp(tag);
    emit(tag, State.ACTIVE, State.ACTIVE, onFood, false);
    emit(tag, State.END, State.ACTIVE, onFood);
    await settled();
    expect(useDragStore.getState().dropped).toEqual({ source: main, target: food });
    expect(useDragStore.getState().phase).toBe('idle');
    expect(dragMotion.active.value).toBe(0);
    expect(dragMotion.owner.value).toBe(-1);
  });

  it('отменённый жест над целью бросок не засчитывает', async () => {
    const gesture = mount();
    fireGestureHandler(gesture, [
      { state: State.BEGAN },
      { state: State.ACTIVE, ...onFood },
      { state: State.CANCELLED, ...onFood },
    ]);
    await settled();
    expect(useDragStore.getState().dropped).toBeNull();
    expect(useDragStore.getState().phase).toBe('returning');
    expect(dragMotion.active.value).toBe(0);
  });

  it('конец жеста мимо целей — возврат монеты', async () => {
    const gesture = mount();
    fireGestureHandler(gesture, [
      { state: State.BEGAN },
      { state: State.ACTIVE, ...away },
      { state: State.END, ...away },
    ]);
    await settled();
    expect(useDragStore.getState().dropped).toBeNull();
    expect(useDragStore.getState().phase).toBe('returning');
  });

  it('второй жест не перехватывает перетаскивание, а его конец не сбрасывает чужое', async () => {
    const first = mount();
    const second = mount();
    expect(first.handlerTag).not.toBe(second.handlerTag);

    // первый палец взял монету и держит её над целью
    const firstTag = tagOf(first);
    await pickUp(firstTag);
    emit(firstTag, State.ACTIVE, State.ACTIVE, onFood, false);
    await settled();
    expect(dragMotion.owner.value).toBe(first.handlerTag);
    expect(useDragStore.getState().hoverKey).toBe('category:food');

    // второй палец проходит весь жест где-то в другом месте
    fireGestureHandler(second, [
      { state: State.BEGAN },
      { state: State.ACTIVE, ...away },
      { state: State.END, ...away },
    ]);
    await settled();
    expect(dragMotion.owner.value).toBe(first.handlerTag);
    expect(dragMotion.active.value).toBe(1);
    expect(dragMotion.x.value).toBe(150);
    expect(useDragStore.getState().phase).toBe('dragging');
    expect(useDragStore.getState().hoverKey).toBe('category:food');

    // первый палец отпускает над целью: бросок засчитан
    emit(firstTag, State.END, State.ACTIVE, onFood);
    await settled();
    expect(useDragStore.getState().dropped).toEqual({ source: main, target: food });
  });
});
