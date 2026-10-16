import { Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { finishDrag, hoverDrag } from './dragActions';
import { hitTest } from './hitTest';
import { dragMotion } from './motion';

/** Долгое нажатие перед началом перетаскивания (DESIGN.md): короче — это прокрутка лотка. */
export const LONG_PRESS_MS = 150;

/**
 * Жест перетаскивания монеты. Колбэки работают на потоке UI и пишут в общие значения dragMotion; в JS уходят только
 * смена цели под пальцем и конец жеста. `begin` вызывается в JS при активации жеста.
 * Вынесено из хука: линтер запрещает менять значения вне компонента прямо в хуке.
 */
export function createCoinGesture(begin: () => void) {
  return Gesture.Pan()
    .maxPointers(1)
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart((event) => {
      'worklet';
      dragMotion.active.value = 1;
      dragMotion.hoverKey.value = null;
      dragMotion.rects.value = [];
      dragMotion.x.value = event.absoluteX;
      dragMotion.y.value = event.absoluteY;
      scheduleOnRN(begin);
    })
    .onUpdate((event) => {
      'worklet';
      dragMotion.x.value = event.absoluteX;
      dragMotion.y.value = event.absoluteY;
      const key = hitTest(event.absoluteX, event.absoluteY, dragMotion.rects.value);
      if (key !== dragMotion.hoverKey.value) {
        dragMotion.hoverKey.value = key;
        scheduleOnRN(hoverDrag, key);
      }
    })
    .onEnd((_event, success) => {
      'worklet';
      dragMotion.active.value = 0;
      // жест отменён системой после активации (success = false): бросок не засчитывается
      scheduleOnRN(finishDrag, success ? dragMotion.hoverKey.value : null);
    })
    .onFinalize(() => {
      'worklet';
      // жест прерван системой (звонок, смена экрана) без onEnd: монета возвращается
      if (dragMotion.active.value === 1) {
        dragMotion.active.value = 0;
        scheduleOnRN(finishDrag, null);
      }
    });
}
