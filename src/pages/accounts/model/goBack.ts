import { router } from 'expo-router';

/** «Назад»: если истории нет (экран открыт по ссылке или после перезапуска), уходим на главный экран. */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
