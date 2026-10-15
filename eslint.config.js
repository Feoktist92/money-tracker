const fs = require('node:fs');
const path = require('node:path');

const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

/**
 * Feature-Sliced Design. Слои сверху вниз: слой импортирует только нижележащие.
 *   app — слой приложения: маршруты Expo Router (src/app), тонкие реэкспорты страниц и корневой layout
 *   pages → widgets → features → entities → shared
 * Срезы одного слоя (pages/*, widgets/*, features/*, entities/*) друг друга не импортируют.
 * Срез открывает наружу только index.ts; так же и модуль shared (папка с index.ts). Циклы запрещены.
 */
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
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

const SLICE_PUBLIC_API = {
  group: SLICED_LAYERS.flatMap((layer) => [`@/${layer}/*/*`, `**/${layer}/*/*`]),
  message: 'FSD: импортируйте срез через его публичный API (index.ts), а не вглубь.',
};
// shared делится на сегменты (lib, db, theme, ui), сегмент — на модули-папки: @/shared/<сегмент>/<модуль>.
const SHARED_MODULE_PUBLIC_API = {
  group: ['@/shared/*/*/*', '**/shared/*/*/*'],
  message: 'FSD: модуль shared импортируется через его index.ts (@/shared/<сегмент>/<модуль>), а не вглубь.',
};
// Внутри shared соседний модуль подключается как '../<модуль>', а не '../<модуль>/<файл>'.
const SHARED_SIBLING_PUBLIC_API = {
  group: ['../*/*'],
  message: 'FSD: соседний модуль shared подключайте через его index.ts: "../<модуль>".',
};

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'import/no-restricted-paths': ['error', { zones }],
      'import/no-cycle': ['error', { maxDepth: Infinity }],
      'no-restricted-imports': ['error', { patterns: [SLICE_PUBLIC_API, SHARED_MODULE_PUBLIC_API] }],
    },
  },
  {
    // позже в списке — переопределяет правило целиком, поэтому правила для всех файлов повторены
    files: ['src/shared/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [SLICE_PUBLIC_API, SHARED_MODULE_PUBLIC_API, SHARED_SIBLING_PUBLIC_API] },
      ],
    },
  },
  {
    ignores: ['dist/*', 'drizzle/*', 'src/uniwind-types.d.ts'],
  },
]);
