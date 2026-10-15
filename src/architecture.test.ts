/** @jest-environment node */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * Границы FSD проверяет ESLint (eslint.config.js). Этот тест гарантирует, что правила действительно срабатывают:
 * иначе поломанный конфиг тихо пропустил бы любые нарушения. ESLint запускается отдельным процессом, потому что
 * его конфиг грузится через dynamic import, который Jest без флагов не поддерживает. Проверяемый код подставляется
 * через stdin вместо содержимого реального файла: для несуществующего файла import/no-cycle падает.
 */
const root = path.join(__dirname, '..');
const eslintBin = path.join(root, 'node_modules/eslint/bin/eslint.js');

jest.setTimeout(60_000);

async function rules(file: string, code: string): Promise<string[]> {
  const run = spawnSync(
    process.execPath,
    [eslintBin, '--stdin', '--stdin-filename', path.join(root, file), '--format', 'json'],
    { cwd: root, input: code, encoding: 'utf8', timeout: 50_000 },
  );
  if (run.error || !run.stdout) throw new Error(`ESLint не отработал: ${run.error?.message ?? run.stderr}`);
  const [result] = JSON.parse(run.stdout) as { messages: { ruleId: string | null }[] }[];
  if (!result) throw new Error('ESLint не вернул результат: файл попал под ignores?');
  return result.messages.map((m) => m.ruleId ?? 'parse-error');
}

describe('границы слоёв FSD', () => {
  it('нижний слой не импортирует верхний (shared → pages)', async () => {
    expect(await rules('src/shared/ui/Screen/Screen.tsx', "import '@/pages/budget';\n")).toContain(
      'import/no-restricted-paths',
    );
  });

  it('виджет не импортирует страницу (widgets → pages)', async () => {
    expect(await rules('src/widgets/bottom-nav/index.ts', "import '@/pages/budget';\n")).toContain(
      'import/no-restricted-paths',
    );
  });

  it('срез не импортирует соседний срез своего слоя (pages/history → pages/budget)', async () => {
    expect(await rules('src/pages/history/index.ts', "import '@/pages/budget';\n")).toContain(
      'import/no-restricted-paths',
    );
  });

  it('обход через относительный путь тоже ловится', async () => {
    expect(await rules('src/shared/ui/Screen/Screen.tsx', "import '../../../pages/budget';\n")).toContain(
      'import/no-restricted-paths',
    );
  });

  it('внутрь среза другого слоя — только через index.ts', async () => {
    expect(await rules('src/app/(tabs)/index.tsx', "import '@/pages/budget/ui/BudgetPage';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('внутрь среза относительным путём тоже нельзя', async () => {
    expect(await rules('src/app/(tabs)/index.tsx', "import '../../pages/budget/ui/BudgetPage';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('модуль shared — только через index.ts (алиас)', async () => {
    expect(await rules('src/entities/settings/index.ts', "import '@/shared/lib/money/money';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('внутри shared соседний модуль — через "../<модуль>", не вглубь', async () => {
    expect(await rules('src/shared/lib/carry/carry.ts', "import '../money/money';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('циклическая зависимость ловится (money ↔ calc)', async () => {
    expect(
      await rules(
        'src/shared/lib/money/money.ts',
        "import { evaluateExpression } from '../calc';\nexport const z = evaluateExpression;\n",
      ),
    ).toContain('import/no-cycle');
  });

  it('срез entities не импортирует соседний срез entities', async () => {
    expect(await rules('src/entities/account/index.ts', "import '@/entities/settings';\n")).toContain(
      'import/no-restricted-paths',
    );
  });

  it('допустимые импорты проходят: app → pages, pages → widgets, widgets → shared', async () => {
    expect(
      await rules('src/app/(tabs)/index.tsx', "export { BudgetPage as default } from '@/pages/budget';\n"),
    ).toEqual([]);
    expect(await rules('src/pages/history/index.ts', "export { BottomNav } from '@/widgets/bottom-nav';\n")).toEqual(
      [],
    );
    expect(await rules('src/widgets/bottom-nav/index.ts', "export { layout } from '@/shared/theme/tokens';\n")).toEqual(
      [],
    );
    expect(await rules('src/shared/lib/carry/carry.ts', "export * from '../money';\n")).toEqual([]);
  });
});
