import { PREVIEW_BLOCK_HEIGHT, previewFits, sheetBottomPadding } from './sheetLayout';

describe('sheetBottomPadding', () => {
  it('без клавиатуры — отступ от нижнего края и системной панели', () => {
    expect(sheetBottomPadding(0, 0)).toBe(16);
    expect(sheetBottomPadding(24, 0)).toBe(40);
  });

  it('с клавиатурой высота клавиатуры и панель навигации складываются', () => {
    expect(sheetBottomPadding(24, 300)).toBe(16 + 300 + 24);
    expect(sheetBottomPadding(0, 300)).toBe(316);
  });
});

describe('previewFits', () => {
  const base = { windowHeight: 800, insetTop: 28 };

  it('на просторном экране плитка помещается', () => {
    expect(previewFits({ ...base, sheetHeight: 500 })).toBe(true);
  });

  it('граница: шторка + блок превью ровно умещаются в окно без верхнего отступа и 8 dp', () => {
    const limit = base.windowHeight - base.insetTop - 8 - PREVIEW_BLOCK_HEIGHT;
    expect(previewFits({ ...base, sheetHeight: limit })).toBe(true);
    expect(previewFits({ ...base, sheetHeight: limit + 1 })).toBe(false);
  });

  it('шторка во весь экран — превью скрыто', () => {
    expect(previewFits({ ...base, sheetHeight: base.windowHeight - base.insetTop })).toBe(false);
  });
});
