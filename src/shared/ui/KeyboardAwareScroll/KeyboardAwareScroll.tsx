import { type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, type StyleProp, TextInput, useWindowDimensions, type ViewStyle } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

/** Зазор между полем и клавиатурой после прокрутки. */
const GAP = 16;
/** Место под полем для подсказки или ошибки (две строки): она тоже должна остаться над клавиатурой. */
const BELOW_FIELD = 56;

/**
 * ScrollView для форм: пока открыта системная клавиатура, добавляет внизу место под неё и прокручивает так, чтобы
 * поле в фокусе не оказалось под клавиатурой. На Android 16 окно не сжимается (edge-to-edge), поэтому ни система, ни
 * `adjustResize` этого не делают. Высота клавиатуры у React Native приходит без панели навигации, её даёт отступ окна.
 */
export function KeyboardAwareScroll({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  // без SafeAreaProvider (тесты форм) отступ считается нулевым
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const { height: windowHeight } = useWindowDimensions();
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      const height = event.endCoordinates.height;
      setKeyboard(height);
      // место под клавиатуру появляется после перерисовки: прокручиваем чуть позже
      timer = setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput();
        input?.measureInWindow((_x, y, _width, inputHeight) => {
          const limit = windowHeight - insetBottom - height - GAP;
          const overlap = y + inputHeight + BELOW_FIELD - limit;
          if (overlap > 0) ref.current?.scrollTo({ y: offset.current + overlap, animated: true });
        });
      }, 60);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
      if (timer) clearTimeout(timer);
    };
  }, [windowHeight, insetBottom]);

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={(event) => {
        offset.current = event.nativeEvent.contentOffset.y;
      }}
      contentContainerStyle={[contentContainerStyle, keyboard > 0 && { paddingBottom: keyboard + GAP }]}
    >
      {children}
    </ScrollView>
  );
}
