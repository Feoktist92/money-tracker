import { readdirSync } from 'node:fs';
import path from 'node:path';

import { NAV_ITEMS } from './BottomNav';

it('у каждого экрана вкладок есть пункт нижней навигации, и наоборот', () => {
  const routes = readdirSync(path.join(__dirname, '../../app/(tabs)'))
    .filter((file) => file.endsWith('.tsx') && !file.startsWith('_'))
    .map((file) => file.replace(/\.tsx$/, ''))
    .sort();
  expect(Object.keys(NAV_ITEMS).sort()).toEqual(routes);
});

it('подписи как в макете', () => {
  expect(Object.values(NAV_ITEMS).map((i) => i.label)).toEqual(['Бюджет', 'Операции', 'Отчёты', 'Ещё']);
});
