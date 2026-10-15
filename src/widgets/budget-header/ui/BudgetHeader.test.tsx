import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { BudgetHeader } from './BudgetHeader';

const NB = '\u00A0';

function render(notificationCount: number) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <BudgetHeader
        title="Октябрь"
        remaining={2_239_000}
        summary="17 дней до конца периода"
        notificationCount={notificationCount}
      />,
    );
  });
  return tree;
}

const texts = (tree: ReturnType<typeof create>) =>
  tree.root
    .findAllByType(Text)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : String(n.props.children)));

describe('BudgetHeader', () => {
  it('показывает период и «Осталось …»', () => {
    expect(texts(render(0))).toEqual(['Октябрь', `Осталось 22${NB}390${NB}₽`]);
  });

  it('бейдж колокольчика виден, только если есть новые операции', () => {
    expect(texts(render(0))).not.toContain('3');
    expect(texts(render(3))).toContain('3');
  });

  it('подписи для TalkBack: период, остаток с итогом дня, колокольчик', () => {
    const labels = (count: number) =>
      // findAll отдаёт и составные, и host-элементы с одним и тем же пропсом — оставляем только host
      render(count)
        .root.findAll((n) => typeof n.type === 'string' && typeof n.props.accessibilityLabel === 'string')
        .map((n) => n.props.accessibilityLabel as string);
    expect(labels(0)).toEqual([
      'Выбрать период: Октябрь',
      `Осталось 22${NB}390${NB}₽. 17 дней до конца периода`,
      'Из уведомлений',
    ]);
    expect(labels(3)).toContain('Из уведомлений: 3 ждут подтверждения');
  });
});
