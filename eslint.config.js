const fs = require('node:fs');
const path = require('node:path');

const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

/**
 * Feature-Sliced Design. Слои сверху вниз: слой импортирует только нижележащие.
 *   app         — маршруты Expo Router (src/app); тонкие реэкспорты страниц
 *   application — запуск приложения: провайдеры, миграции (это FSD-слой «app»; src/app занят роутером)
 *   pages → widgets → features → entities → shared
 * Срезы одного слоя (pages/*, widgets/*, features/*, entities/*) друг друга не импортируют.
 * Срез открывает наружу только index.ts. Циклы запрещены.
 */
const LAYERS = ['app', 'application', 'pages', 'widgets', 'features', 'entities', 'shared'];
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities'];

const slicesOf = (layer) => {
  const dir = path.join(__dirname, 'src', layer);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};

const zones = [];
LAYERS.forEach((layer, index) => {
  for (const upper of LAYERS.slice(0, index)) {
    zones.push({
      target: `./src/${layer}`,
      from: `./src/${upper}`,
      message: `FSD: слой «${layer}» не может импортировать вышележащий слой «${upper}».`,
    });
  }
});
for (const layer of SLICED_LAYERS) {
  for (const slice of slicesOf(layer)) {
    zones.push({
      target: `./src/${layer}/${slice}`,
      from: `./src/${layer}`,
      except: [`./${slice}`],
      message: `FSD: срез «${layer}/${slice}» не может импортировать другие срезы слоя «${layer}».`,
    });
  }
}

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'import/no-restricted-paths': ['error', { zones }],
      'import/no-cycle': ['error', { maxDepth: Infinity }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: SLICED_LAYERS.map((layer) => `@/${layer}/*/*`),
              message: 'FSD: импортируйте срез через его публичный API (index.ts), а не вглубь.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/*', 'drizzle/*', 'src/uniwind-types.d.ts'],
  },
]);
