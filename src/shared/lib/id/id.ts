import { randomUUID } from 'expo-crypto';

/** UUID v4 для первичных ключей. */
export function newId(): string {
  return randomUUID();
}
