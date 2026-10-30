import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { Coin } from './Coin';
import { CoinTray } from './CoinTray';

const income = [{ id: 'salary', name: 'Зарплата', icon: 'arrow-down-to-line', color: 'teal' }];
const accounts = [{ id: 'main', name: 'Основная', icon: 'credit-card', color: 'violet', balance: 4_821_500 }];

function render(props: Partial<React.ComponentProps<typeof CoinTray>> = {}) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<CoinTray income={income} accounts={accounts} {...props} />);
  });
  const add = tree.root.findAll(
    (n) => n.props.accessibilityLabel === 'Добавить счёт' && typeof n.props.onPress === 'function',
  )[0];
  const texts = tree.root.findAllByType(Text).map((n) => String(n.props.children));
  return { tree, add, texts };
}

describe('CoinTray', () => {
  it('сначала монеты дохода, затем счета', () => {
    const { tree } = render();
    expect(tree.root.findAllByType(Coin).map((c) => c.props.kind)).toEqual(['income', 'account']);
  });

  it('цвет категории дохода доходит до монеты', () => {
    const { tree } = render();
    expect(tree.root.findAllByType(Coin)[0]!.props.color).toBe('teal');
  });

  it('монета-плюс «Счёт» есть только с обработчиком и вызывает его', () => {
    expect(render().add).toBeUndefined();
    const onAddAccount = jest.fn();
    const { add } = render({ onAddAccount });
    act(() => add!.props.onPress());
    expect(onAddAccount).toHaveBeenCalledTimes(1);
  });

  it('нет счетов: вместо них подсказка, монета-плюс остаётся', () => {
    const { texts, add, tree } = render({ accounts: [], onAddAccount: jest.fn() });
    expect(texts).toContain('Добавьте счёт, чтобы записывать траты');
    expect(add).toBeDefined();
    expect(tree.root.findAllByType(Coin).map((c) => c.props.kind)).toEqual(['income']);
  });

  it('счета есть: подсказки нет', () => {
    expect(render().texts).not.toContain('Добавьте счёт, чтобы записывать траты');
  });
});
