import { planTileText } from './tilePlan';

/** Размеры плиток и размеры шрифта остатка в макете C-main (масштаб 1). */
describe('planTileText на плитках макета', () => {
  it.each([
    ['Продукты', 194, 309, false, 30],
    ['Дом и ЖКХ', 194, 163, false, 26],
    ['Кафе', 194, 120, false, 26],
    ['Одежда', 168, 156, false, 24],
    ['Транспорт', 168, 117, false, 20],
    ['Развлечения (с переносом)', 168, 130, true, 20],
    ['Здоровье (с переносом)', 168, 132, true, 20],
  ])('%s %p×%p → цифра %p', (_name, width, height, hasCarry, size) => {
    const plan = planTileText({ width, height, fontScale: 1, hasCarry });
    expect(plan.mode).toBe('stacked');
    expect(plan.amountSize).toBe(size);
    expect(plan.showCaption).toBe(true);
    expect(plan.showCarry).toBe(hasCarry);
  });

  it('«Подписки» 168×49 — одна строка с цифрой 15', () => {
    expect(planTileText({ width: 168, height: 49, fontScale: 1, hasCarry: false })).toMatchObject({
      mode: 'row',
      amountSize: 15,
      showCaption: false,
    });
  });

  it('отступы: 14×16 на высоких плитках, 12×14 на низких', () => {
    expect(planTileText({ width: 194, height: 309, fontScale: 1, hasCarry: false })).toMatchObject({
      padVertical: 14,
      padHorizontal: 16,
    });
    expect(planTileText({ width: 168, height: 117, fontScale: 1, hasCarry: false })).toMatchObject({
      padVertical: 12,
      padHorizontal: 14,
    });
  });
});

describe('planTileText при крупном шрифте', () => {
  it('масштаб 1,3 на плитках макета: цифра остаётся читаемой, подпись на месте', () => {
    const plan = planTileText({ width: 168, height: 117, fontScale: 1.3, hasCarry: false });
    expect(plan.mode).toBe('stacked');
    expect(plan.showCaption).toBe(true);
  });

  it('если не влезает — цифра уменьшается, потом прячется подпись, потом перенос, потом одна строка', () => {
    const small = { width: 168, height: 90, hasCarry: true };
    const steps = [1, 1.3, 1.6, 2, 3].map((fontScale) => planTileText({ ...small, fontScale }));
    // чем крупнее шрифт, тем меньше деталей: показанных строк не прибавляется
    const detail = steps.map((p) => (p.mode === 'row' ? 0 : 1 + Number(p.showCaption) + Number(p.showCarry)));
    expect(detail).toEqual([...detail].sort((a, b) => b - a));
    expect(steps[steps.length - 1]!.mode).toBe('row');
  });

  it('масштаб меньше 1 считается как 1', () => {
    const a = planTileText({ width: 194, height: 163, fontScale: 0.8, hasCarry: false });
    const b = planTileText({ width: 194, height: 163, fontScale: 1, hasCarry: false });
    expect(a).toEqual(b);
  });

  it('остаток не обрезается: у каждого плана высота текста не больше высоты плитки', () => {
    for (const height of [64, 80, 100, 117, 130, 163, 250, 309]) {
      for (const fontScale of [1, 1.3, 1.6, 2]) {
        const plan = planTileText({ width: 168, height, fontScale, hasCarry: true });
        if (plan.mode === 'row') continue;
        const lines = 2 + Number(plan.showCaption) + Number(plan.showCarry);
        // грубая нижняя оценка: строки не могут быть выше 14·1,25·масштаб каждая
        expect(2 * plan.padVertical + lines * 12 * fontScale).toBeLessThanOrEqual(height + 1);
      }
    }
  });
});
