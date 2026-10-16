import { useDragStore } from './dragStore';
import type { DragSource, DropTargetInfo } from './types';

const source: DragSource = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' };
const food: DropTargetInfo = { kind: 'category', id: 'food', name: 'Продукты' };
const savings: DropTargetInfo = { kind: 'account', id: 'savings', name: 'Накопления' };

const state = () => useDragStore.getState();

beforeEach(() => {
  useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
});

describe('dragStore', () => {
  it('begin запоминает монету и допустимые цели', () => {
    state().begin(source, [food, savings]);
    expect(state().phase).toBe('dragging');
    expect(state().source).toEqual(source);
    expect(Object.keys(state().candidates)).toEqual(['category:food', 'account:savings']);
  });

  it('setHover работает только во время жеста', () => {
    state().setHover('category:food');
    expect(state().hoverKey).toBeNull();
    state().begin(source, [food]);
    state().setHover('category:food');
    expect(state().hoverKey).toBe('category:food');
    state().setHover(null);
    expect(state().hoverKey).toBeNull();
  });

  it('бросок на допустимую цель сохраняет результат и сбрасывает жест', () => {
    state().begin(source, [food, savings]);
    state().finish('category:food');
    expect(state().dropped).toEqual({ source, target: food });
    expect(state().phase).toBe('idle');
    expect(state().source).toBeNull();
    expect(state().candidates).toEqual({});
  });

  it('бросок мимо возвращает монету: фаза returning, результата нет', () => {
    state().begin(source, [food]);
    state().finish(null);
    expect(state().dropped).toBeNull();
    expect(state().phase).toBe('returning');
    state().settle();
    expect(state().phase).toBe('idle');
    expect(state().source).toBeNull();
  });

  it('ключ, которого нет среди допустимых целей, считается броском мимо', () => {
    state().begin(source, [food]);
    state().finish('category:unknown');
    expect(state().dropped).toBeNull();
    expect(state().phase).toBe('returning');
  });

  it('finish без жеста и повторный finish ничего не ломают', () => {
    state().finish('category:food');
    expect(state().dropped).toBeNull();
    state().begin(source, [food]);
    state().finish('category:food');
    state().finish('category:food');
    expect(state().dropped).toEqual({ source, target: food });
  });

  it('settle вне фазы returning не трогает жест, clearDrop очищает результат', () => {
    state().begin(source, [food]);
    state().settle();
    expect(state().phase).toBe('dragging');
    state().finish('category:food');
    state().clearDrop();
    expect(state().dropped).toBeNull();
  });
});
