module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Миграции Drizzle (drizzle/migrations.js) импортируют .sql как строку
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
