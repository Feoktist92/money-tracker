import { act, create } from 'react-test-renderer';

import { StyleSheet } from 'react-native';

import { useDragStore } from '@/features/coin-drag';

import { Coin } from './Coin';

const NB = '\u00A0';

function label(element: React.ReactElement) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(element);
  });
  return tree.root.findByProps({ accessible: true }).props.accessibilityLabel as string;
}

describe('Coin', () => {
  it('монета дохода подписана «доход»', () => {
    expect(label(<Coin kind="income" id="salary" name="Зарплата" icon="arrow-down-to-line" color="violet" />)).toBe(
      'Зарплата, доход',
    );
  });

  it('монета счёта подписана балансом', () => {
    expect(
      label(<Coin kind="account" id="main" name="Основная" icon="credit-card" color="violet" balance={4_821_500} />),
    ).toBe(`Основная, баланс 48${NB}215${NB}₽`);
  });

  it('неизвестный цвет счёта не роняет экран', () => {
    expect(() =>
      label(<Coin kind="account" id="main" name="Счёт" icon="banknote" color="неизвестный" balance={0} />),
    ).not.toThrow();
  });

  it('ключ из прототипа («constructor») откатывается к violet, а не ломает палитру', () => {
    const json = (element: React.ReactElement) => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(element);
      });
      return tree.toJSON();
    };
    expect(() =>
      json(<Coin kind="account" id="main" name="Счёт" icon="banknote" color="constructor" balance={0} />),
    ).not.toThrow();
    expect(json(<Coin kind="account" id="main" name="Счёт" icon="banknote" color="constructor" balance={0} />)).toEqual(
      json(<Coin kind="account" id="main" name="Счёт" icon="banknote" color="violet" balance={0} />),
    );
  });

  describe('во время перетаскивания', () => {
    const main = { kind: 'account', id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet' } as const;
    const salary = { kind: 'income', id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line' } as const;
    const accountCoin = <Coin kind="account" id="main" name="Основная" icon="credit-card" color="violet" balance={0} />;
    const incomeCoin = <Coin kind="income" id="salary" name="Зарплата" icon="arrow-down-to-line" color="violet" />;
    const mount = (element: React.ReactElement) => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(element);
      });
      return tree;
    };
    const pill = (tree: ReturnType<typeof create>) =>
      StyleSheet.flatten(tree.root.findByProps({ accessible: true }).props.style);
    // Оверлеи рамки жеста — это View с pointerEvents="none" внутри пилюли.
    const overlays = (tree: ReturnType<typeof create>) =>
      tree.root.findAllByProps({ pointerEvents: 'none' }).map((node) => StyleSheet.flatten(node.props.style));
    const resetDrag = () =>
      act(() => {
        useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
      });

    afterEach(resetDrag);

    it('исходная монета — пунктирный оверлей, сама пилюля без рамки', () => {
      act(() => useDragStore.getState().begin(main, []));
      const tree = mount(accountCoin);
      expect(overlays(tree)).toContainEqual(expect.objectContaining({ borderStyle: 'dashed', borderWidth: 2 }));
      expect(pill(tree).borderStyle).toBeUndefined();
    });

    it('чужая монета дохода тускнеет: она не цель', () => {
      act(() => useDragStore.getState().begin(main, []));
      expect(pill(mount(incomeCoin)).opacity).toBe(0.35);
    });

    it('монета счёта при броске дохода — цель, под пальцем получает рамку-оверлей', () => {
      act(() => useDragStore.getState().begin(salary, []));
      expect(pill(mount(accountCoin)).opacity).toBeUndefined();
      act(() => useDragStore.getState().setHover('account:main'));
      const tree = mount(accountCoin);
      expect(overlays(tree)).toContainEqual(expect.objectContaining({ borderWidth: 3 }));
      expect(pill(tree).borderWidth).toBeUndefined();
    });

    it('без жеста вид обычный', () => {
      const tree = mount(accountCoin);
      expect(pill(tree).borderStyle).toBeUndefined();
      expect(pill(tree).opacity).toBeUndefined();
      expect(overlays(tree)).toHaveLength(0);
    });

    it('размер монеты не меняется в состояниях жеста', () => {
      const sized = (style: ReturnType<typeof pill>) => ({
        borderWidth: style.borderWidth,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        minHeight: style.minHeight,
      });
      const rest = pill(mount(accountCoin));
      expect(rest.borderWidth).toBeUndefined();
      expect(rest.minHeight).toBe(56);

      act(() => useDragStore.getState().begin(main, []));
      const source = mount(accountCoin);
      expect(sized(pill(source))).toEqual(sized(rest));
      expect(overlays(source)).toContainEqual(expect.objectContaining({ borderStyle: 'dashed' }));

      resetDrag();
      act(() => useDragStore.getState().begin(salary, []));
      act(() => useDragStore.getState().setHover('account:main'));
      const hover = mount(accountCoin);
      expect(sized(pill(hover))).toEqual(sized(rest));
      expect(overlays(hover)).toContainEqual(expect.objectContaining({ borderWidth: 3 }));
    });
  });
});
