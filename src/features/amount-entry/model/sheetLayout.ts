/** Высота блока над шторкой: плитка-превью 120 + зазор до полоски 6 + полоска 8 + отступ 8. */
export const PREVIEW_BLOCK_HEIGHT = 142;

const SHEET_BOTTOM_GAP = 16;
const TOP_MARGIN = 8;

/**
 * Нижний отступ шторки. React Native сообщает высоту клавиатуры без системной панели навигации (Android), поэтому
 * при открытой клавиатуре отступы складываются: клавиатура и панель навигации под ней.
 */
export function sheetBottomPadding(insetBottom: number, keyboard: number): number {
  return SHEET_BOTTOM_GAP + (keyboard > 0 ? keyboard + insetBottom : insetBottom);
}

/** Помещается ли плитка-превью над шторкой: на малых экранах и при крупном шрифте она скрывается. */
export function previewFits({
  windowHeight,
  insetTop,
  sheetHeight,
}: {
  windowHeight: number;
  insetTop: number;
  sheetHeight: number;
}): boolean {
  return sheetHeight + PREVIEW_BLOCK_HEIGHT <= windowHeight - insetTop - TOP_MARGIN;
}
