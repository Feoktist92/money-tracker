const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);
// Миграции Drizzle импортируются как .sql (см. babel.config.js)
config.resolver.sourceExts.push('sql');

// withUniwindConfig — обязательно внешняя обёртка
module.exports = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
