import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** Высота системной клавиатуры (0, пока она скрыта): шторке нужен нижний отступ, чтобы поле комментария не перекрывалось. */
export function useKeyboardInset(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
