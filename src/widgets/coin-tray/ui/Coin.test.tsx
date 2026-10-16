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
    expect(label(<Coin kind="income" id="salary" name="Зарплата" icon="arrow-down-to-line" />)).toBe('Зарплата, доход');
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
    const pill = (element: React.ReactElement) => {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(element);
      });
      return StyleSheet.flatten(tree.root.findByProps({ accessible: true }).props.style);
    };
    const incomeCoin = <Coin kind="income" id="salary" name="Зарплата" icon="arrow-down-to-line" />;
    const accountCoin = <Coin kind="account" id="main" name="Основная" icon="credit-card" color="violet" balance={0} />;

    afterEach(() => {
      act(() => {
        useDragStore.setState({ phase: 'idle', source: null, hoverKey: null, candidates: {}, dropped: null });
      });
    });

    it('исходная монета — пунктирный слот', () => {
      act(() => useDragStore.getState().begin(main, []));
      expect(pill(accountCoin).borderStyle).toBe('dashed');
    });

    it('чужая монета дохода тускнеет: она не цель', () => {
      act(() => useDragStore.getState().begin(main, []));
      expect(pill(incomeCoin).opacity).toBe(0.35);
    });

    it('монета счёта при броске дохода — цель, под пальцем получает рамку', () => {
      act(() => useDragStore.getState().begin(salary, []));
      expect(pill(accountCoin).opacity).toBeUndefined();
      act(() => useDragStore.getState().setHover('account:main'));
      expect(pill(accountCoin).borderWidth).toBe(3);
    });

    it('без жеста вид обычный', () => {
      expect(pill(accountCoin).borderStyle).toBeUndefined();
      expect(pill(accountCoin).opacity).toBeUndefined();
    });
  });
});
