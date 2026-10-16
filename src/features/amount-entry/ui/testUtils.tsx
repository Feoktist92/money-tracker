import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

/** Рендер в SafeAreaProvider с фиксированными отступами (в Jest системных нет). */
export function render(element: ReactElement): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 28, left: 0, right: 0, bottom: 0 },
        }}
      >
        {element}
      </SafeAreaProvider>,
    );
  });
  return tree;
}

/** Тексты всех Text в дереве, склеенные по узлам. */
export function texts(tree: ReactTestRenderer): string[] {
  return tree.root.findAllByType(Text).map((node) => [node.props.children].flat().join(''));
}

/** Нажимаемый узел по accessibilityLabel (композит Pressable с onPress). */
export function pressable(tree: ReactTestRenderer, label: string): ReactTestInstance {
  const found = tree.root.findAll(
    (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
  );
  if (found.length === 0) throw new Error(`Нет кнопки «${label}»`);
  return found[0]!;
}

export function tap(tree: ReactTestRenderer, label: string): void {
  act(() => {
    pressable(tree, label).props.onPress();
  });
}
