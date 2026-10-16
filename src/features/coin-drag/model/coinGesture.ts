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
      // монета уже в руке у другого пальца: этот жест ничего не трогает (его onEnd/onFinalize тоже отсекаются владельцем)
      if (dragMotion.active.value === 1) return;
      dragMotion.owner.value = event.handlerTag;
      dragMotion.active.value = 1;
      dragMotion.hoverKey.value = null;
      dragMotion.rects.value = [];
      dragMotion.x.value = event.absoluteX;
      dragMotion.y.value = event.absoluteY;
      scheduleOnRN(begin);
    })
    .onUpdate((event) => {
      'worklet';
      if (event.handlerTag !== dragMotion.owner.value) return;
      dragMotion.x.value = event.absoluteX;
      dragMotion.y.value = event.absoluteY;
      const key = hitTest(event.absoluteX, event.absoluteY, dragMotion.rects.value);
      if (key !== dragMotion.hoverKey.value) {
        dragMotion.hoverKey.value = key;
        scheduleOnRN(hoverDrag, key);
      }
    })
    .onEnd((event, success) => {
      'worklet';
      if (event.handlerTag !== dragMotion.owner.value) return;
      dragMotion.active.value = 0;
      dragMotion.owner.value = -1;
      // жест отменён системой после активации (success = false): бросок не засчитывается
      scheduleOnRN(finishDrag, success ? dragMotion.hoverKey.value : null);
    })
    .onFinalize((event) => {
      'worklet';
      // жест прерван системой (звонок, смена экрана) без onEnd: монета возвращается; чужой жест не трогаем
      if (event.handlerTag !== dragMotion.owner.value) return;
      dragMotion.active.value = 0;
      dragMotion.owner.value = -1;
      scheduleOnRN(finishDrag, null);
    });
}
