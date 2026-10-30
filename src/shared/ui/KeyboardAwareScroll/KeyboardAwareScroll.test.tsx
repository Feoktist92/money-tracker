import { Dimensions, Keyboard, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { KeyboardAwareScroll } from './KeyboardAwareScroll';

type Handler = (event: { endCoordinates: { height: number } }) => void;

function setup(inputY: number, inputHeight = 48) {
  const handlers: Record<string, Handler> = {};
  const remove = jest.fn();
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, handler: Handler) => {
    handlers[name] = handler;
    return { remove };
  }) as never);
  jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockReturnValue({
    measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, inputY, 300, inputHeight),
  } as never);
  const scrollTo = jest.fn();
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 780 },
          insets: { top: 28, left: 0, right: 0, bottom: 48 },
        }}
      >
        <KeyboardAwareScroll contentContainerStyle={{ padding: 20 }}>
          <Text>поле</Text>
        </KeyboardAwareScroll>
      </SafeAreaProvider>,
    );
  });
  // в Jest ScrollView — обычный компонент с ref на экземпляр: подменяем его scrollTo
  (tree.root.findByType(ScrollView).instance as { scrollTo: jest.Mock }).scrollTo = scrollTo;
  const style = () => StyleSheet.flatten(tree.root.findByType(ScrollView).props.contentContainerStyle);
  const padding = () => style().paddingBottom ?? style().padding;
  return { handlers, scrollTo, padding, remove, tree };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('KeyboardAwareScroll', () => {
  it('без клавиатуры отступ только из стиля формы', () => {
    const { padding } = setup(300);
    expect(padding()).toBe(20);
  });

  it('клавиатура открыта: внизу добавляется место под неё, после закрытия убирается', () => {
    const { handlers, padding } = setup(300);
    act(() => handlers['keyboardDidShow']!({ endCoordinates: { height: 400 } }));
    expect(padding()).toBe(416);
    act(() => handlers['keyboardDidHide']!({ endCoordinates: { height: 0 } }));
    expect(padding()).toBe(20);
  });

  it('поле под клавиатурой прокручивается вверх ровно на перекрытие', () => {
    const windowHeight = Dimensions.get('window').height;
    // граница = высота окна − 48 (панель навигации) − 400 (клавиатура) − 16 (зазор); низ подсказки под полем (56 dp) на 30 dp ниже границы
    const limit = windowHeight - 48 - 400 - 16;
    const { handlers, scrollTo } = setup(limit + 30 - 48 - 56);
    act(() => handlers['keyboardDidShow']!({ endCoordinates: { height: 400 } }));
    act(() => jest.advanceTimersByTime(80));
    expect(scrollTo).toHaveBeenCalledWith({ y: 30, animated: true });
  });

  it('поле над клавиатурой не прокручивается', () => {
    const { handlers, scrollTo } = setup(100);
    act(() => handlers['keyboardDidShow']!({ endCoordinates: { height: 400 } }));
    act(() => jest.advanceTimersByTime(80));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('при размонтировании подписки снимаются', () => {
    const { tree, remove } = setup(300);
    act(() => tree.unmount());
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
