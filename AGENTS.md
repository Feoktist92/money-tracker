This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Architecture (Feature-Sliced Design)

Слои сверху вниз: `app` (`src/app`, маршруты Expo Router) → `application` (`src/application`, запуск приложения) → `pages` → `widgets` → `features` → `entities` → `shared`. Слой импортирует только нижележащие. Срезы одного слоя друг друга не импортируют, срез снаружи открывает только `index.ts`, циклов нет. Нарушения ловит `npm run lint` (`eslint.config.js`, тест `src/architecture.test.ts`).

- Маршруты в `src/app` — тонкие реэкспорты страниц из `src/pages`.
- Всё, что общее для нескольких срезов одного слоя (схема БД, тестовые хелперы), живёт ниже — в `shared`; склеивает срезы вышестоящий слой (виджет, страница, `application`).
- В срезе: `ui/` (компоненты), `model/` (хуки, запросы, логика), `index.ts` (публичный API).
- `shared` делится на сегменты (`lib`, `db`, `theme`, `ui`), сегмент — на модули-папки `<сегмент>/<модуль>/` с `index.ts`. Снаружи модуль импортируется как `@/shared/<сегмент>/<модуль>`, внутри `shared` соседний — как `../<модуль>`; импорт вглубь (`.../money/money`) запрещён линтом. Тесты лежат рядом с кодом.
- Внутри своего среза импортируйте относительными путями (`../model/x`): алиас вглубь среза запрещён даже для собственного среза.
- Миграции Drizzle идут в транзакции, где SQLite игнорирует `foreign_keys = OFF`, а пересборка таблицы (`DROP TABLE`) при включённых ключах каскадно удаляет данные. Поэтому внешние ключи включаются только после миграций (`DatabaseGate`, `createTestDb`) — не переносите `PRAGMA foreign_keys = ON` в `client.ts`.
- Округление до копеек — только через `src/shared/lib/money`; другие модули могут считать в float, но результат всегда проходит `roundToKopecks`.
