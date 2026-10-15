// expo-crypto — нативный модуль; в Node берём randomUUID из node:crypto.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));
