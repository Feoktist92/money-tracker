import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { BudgetHeader } from './BudgetHeader';

const NB = '\u00A0';

function render(notificationCount: number, onPeriodPress?: () => void) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <BudgetHeader
        title="Октябрь"
        remaining={2_239_000}
        summary="17 дней до конца периода"
        notificationCount={notificationCount}
        onPeriodPress={onPeriodPress}
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
    expect(labels(3)).toContain('Из уведомлений, новых: 3');
  });

  it('бейдж больше 99 показывает «99+»', () => {
    expect(texts(render(150))).toContain('99+');
    expect(texts(render(150))).not.toContain('150');
  });

  it('длинный период обрезается в одну строку', () => {
    const title = render(0)
      .root.findAllByType(Text)
      .find((n) => n.props.children === 'Октябрь');
    expect(title?.props.numberOfLines).toBe(1);
  });

  it('название периода и пилюля сжимаются по ширине, а не обрезаются', () => {
    const hosts = render(0).root.findAll((n) => typeof n.type === 'string' && n.props.adjustsFontSizeToFit === true);
    expect(hosts.map((n) => n.props.numberOfLines)).toEqual([1, 1]);
    const children = hosts.map((n) => (Array.isArray(n.props.children) ? n.props.children.join('') : n.props.children));
    expect(children).toEqual(['Октябрь', `Осталось 22${NB}390${NB}₽`]);
  });

  it('кнопка периода без обработчика помечена отключённой', () => {
    const period = (onPress?: () => void) =>
      render(0, onPress).root.find(
        (n) => typeof n.type === 'string' && n.props.accessibilityLabel === 'Выбрать период: Октябрь',
      );
    expect(period().props.accessibilityState).toEqual({ disabled: true });
    expect(period(() => {}).props.accessibilityState).toEqual({ disabled: false });
  });
});
