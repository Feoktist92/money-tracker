import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Счётчик, который растёт после изменений в базе (пачкой, раз в 50 мс) и при возврате приложения
 * на передний план (могла смениться дата). Кладите его в зависимости эффекта, который перечитывает данные.
 */
export function useDataVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => setVersion((v) => v + 1);
    const changes = addDatabaseChangeListener(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        bump();
      }, 50);
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') bump();
    });
    return () => {
      changes.remove();
      appState.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);
  return version;
}
