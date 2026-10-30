import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { Screen } from './Screen';

function edgesOf(bottomInset?: boolean) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 28, left: 0, right: 0, bottom: 48 },
        }}
      >
        <Screen bottomInset={bottomInset} />
      </SafeAreaProvider>,
    );
  });
  return tree.root.findByType(SafeAreaView).props.edges;
}

describe('Screen', () => {
  it('по умолчанию отступ только сверху: низ даёт BottomNav вкладок', () => {
    expect(edgesOf()).toEqual(['top']);
  });

  it('с bottomInset ещё и снизу: экраны вне вкладок не уходят под панель навигации', () => {
    expect(edgesOf(true)).toEqual(['top', 'bottom']);
  });
});
