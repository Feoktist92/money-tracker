/** Ступени крупной цифры остатка в плитке (DESIGN.md, «Типографика»), sp. */
export const AMOUNT_STEPS = [30, 26, 24, 20, 15] as const;
export type AmountSize = (typeof AMOUNT_STEPS)[number];

export interface TilePlanInput {
  width: number;
  height: number;
  /** Масштаб системного шрифта (PixelRatio.getFontScale / useWindowDimensions().fontScale). */
  fontScale: number;
  /** Есть ли строка «+700 с сентября». */
  hasCarry: boolean;
}

export interface TilePlan {
  /** stacked: имя, остаток, подпись; row: одна строка «имя … остаток» для низких плиток. */
  mode: 'stacked' | 'row';
  amountSize: AmountSize;
  showCaption: boolean;
  showCarry: boolean;
  padVertical: number;
  padHorizontal: number;
}

const LINE_HEIGHT = 1.25;
const NAME_SIZE = 14;
const CAPTION_SIZE = 12;

const lineHeight = (size: number, fontScale: number) => Math.ceil(size * LINE_HEIGHT * fontScale);

/** Ступень по размеру плитки. Пороги выведены из макета C-main (все восемь плиток дают его размеры шрифта). */
function baseStep(width: number, height: number): number {
  if (height >= 250) return 0; // 30
  if (height >= 150) return width >= 180 ? 1 : 2; // 26 или 24
  if (height >= 100) return width >= 180 ? 1 : 3; // 26 или 20
  return 3; // 20
}

function requiredHeight(plan: TilePlan, fontScale: number): number {
  const margin = plan.amountSize >= 30 ? 6 : plan.amountSize >= 24 ? 4 : 2;
  const lines = 2 + (plan.showCaption ? 1 : 0) + (plan.showCarry ? 1 : 0);
  return (
    2 * plan.padVertical +
    lineHeight(NAME_SIZE, fontScale) +
    margin +
    lineHeight(plan.amountSize, fontScale) +
    (plan.showCaption ? lineHeight(CAPTION_SIZE, fontScale) : 0) +
    (plan.showCarry ? lineHeight(CAPTION_SIZE, fontScale) : 0) +
    2 * (lines - 2)
  );
}

/**
 * Как разместить текст в плитке. Начинаем со ступени по размеру плитки; если при текущем масштабе шрифта текст
 * не помещается, идём вниз: меньшая цифра → прячем «потрачено из …» → прячем перенос → одна строка.
 * Остаток поэтому никогда не обрезается (DESIGN.md: проверять при font_scale 1,3).
 */
export function planTileText({ width, height, fontScale, hasCarry }: TilePlanInput): TilePlan {
  const scale = Math.max(1, fontScale);
  const tall = height >= 160;
  const rowPlan: TilePlan = {
    mode: 'row',
    amountSize: 15,
    showCaption: false,
    showCarry: false,
    padVertical: 0,
    padHorizontal: 14,
  };
  if (height < 64) return rowPlan;

  const plan: TilePlan = {
    mode: 'stacked',
    amountSize: AMOUNT_STEPS[baseStep(width, height)]!,
    showCaption: true,
    showCarry: hasCarry,
    padVertical: tall ? 14 : 12,
    padHorizontal: tall ? 16 : 14,
  };
  let step = AMOUNT_STEPS.indexOf(plan.amountSize);
  while (requiredHeight(plan, scale) > height) {
    if (step < AMOUNT_STEPS.length - 2) {
      step += 1;
      plan.amountSize = AMOUNT_STEPS[step]!;
    } else if (plan.showCaption) {
      plan.showCaption = false;
    } else if (plan.showCarry) {
      plan.showCarry = false;
    } else {
      return rowPlan;
    }
  }
  return plan;
}
