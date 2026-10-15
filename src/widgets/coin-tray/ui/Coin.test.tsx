import { act, create } from 'react-test-renderer';

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
    expect(label(<Coin kind="income" name="Зарплата" icon="arrow-down-to-line" />)).toBe('Зарплата, доход');
  });

  it('монета счёта подписана балансом', () => {
    expect(label(<Coin kind="account" name="Основная" icon="credit-card" color="violet" balance={4_821_500} />)).toBe(
      `Основная, баланс 48${NB}215${NB}₽`,
    );
  });

  it('неизвестный цвет счёта не роняет экран', () => {
    expect(() =>
      label(<Coin kind="account" name="Счёт" icon="banknote" color="неизвестный" balance={0} />),
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
      json(<Coin kind="account" name="Счёт" icon="banknote" color="constructor" balance={0} />),
    ).not.toThrow();
    expect(json(<Coin kind="account" name="Счёт" icon="banknote" color="constructor" balance={0} />)).toEqual(
      json(<Coin kind="account" name="Счёт" icon="banknote" color="violet" balance={0} />),
    );
  });
});
