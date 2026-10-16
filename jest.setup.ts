// expo-crypto — нативный модуль; в Node берём randomUUID из node:crypto.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

// Reanimated, Worklets и Gesture Handler — нативные модули; в Jest берём их официальные заглушки.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
require('react-native-gesture-handler/jestSetup');
