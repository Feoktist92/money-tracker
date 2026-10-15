#!/usr/bin/env bash
# Проверяет подключение Android-телефона по adb и готовит его к разработке.
#
#   scripts/adb-connect.sh          — найти телефон по USB, проброс порта Metro (8081)
#   scripts/adb-connect.sh --wifi   — переключить телефон на отладку по Wi-Fi (кабель можно отключить)
#   scripts/adb-connect.sh <ip>     — подключиться к телефону по Wi-Fi, если отладка по сети уже включена
#
# Код возврата 0 — телефон готов, 1 — нет подходящего устройства.
set -euo pipefail

METRO_PORT="${METRO_PORT:-8081}"
WIFI_PORT=5555

find_adb() {
  if command -v adb >/dev/null 2>&1; then command -v adb; return; fi
  local sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
  if [ -x "$sdk/platform-tools/adb" ]; then echo "$sdk/platform-tools/adb"; return; fi
  echo "adb не найден. Установите Android Studio или Command-line Tools (Platform-Tools) и задайте ANDROID_HOME." >&2
  exit 1
}

ADB="$(find_adb)"

# Серийники устройств с нужным статусом (device, unauthorized, offline).
serials_with_state() { "$ADB" devices | awk -v s="$1" 'NR > 1 && $2 == s { print $1 }'; }

prop() { "$ADB" -s "$1" shell getprop "$2" | tr -d '\r'; }

describe() {
  echo "  $1: $(prop "$1" ro.product.manufacturer) $(prop "$1" ro.product.model), Android $(prop "$1" ro.build.version.release) (API $(prop "$1" ro.build.version.sdk))"
}

# IP телефона в Wi-Fi-сети.
wifi_ip() {
  "$ADB" -s "$1" shell ip -f inet addr show wlan0 2>/dev/null | grep -o 'inet [0-9.]*' | awk '{ print $2 }' | head -n 1
}

ARG="${1:-}"

if [[ "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(:[0-9]+)?$ ]]; then
  TARGET="$ARG"
  [[ "$TARGET" == *:* ]] || TARGET="$TARGET:$WIFI_PORT"
  "$ADB" connect "$TARGET"
  ARG=""
fi

"$ADB" start-server >/dev/null 2>&1
echo "adb: $("$ADB" version | head -n 1)"

UNAUTHORIZED="$(serials_with_state unauthorized)"
if [ -n "$UNAUTHORIZED" ]; then
  echo "Телефон найден, но отладка не подтверждена: $UNAUTHORIZED" >&2
  echo "Разблокируйте экран и нажмите «Разрешить» в окне «Разрешить отладку по USB?»." >&2
  exit 1
fi

OFFLINE="$(serials_with_state offline)"
if [ -n "$OFFLINE" ]; then
  echo "Устройство в статусе offline: $OFFLINE. Переподключите кабель; если не помогает — adb kill-server." >&2
  exit 1
fi

READY=()
while IFS= read -r line; do [ -n "$line" ] && READY+=("$line"); done < <(serials_with_state device)
if [ "${#READY[@]}" -eq 0 ]; then
  echo "Телефон не найден. Проверьте: кабель с передачей данных, «Отладка по USB» в «Параметрах разработчика», режим USB — «Передача файлов»." >&2
  exit 1
fi

echo "Подключено устройств: ${#READY[@]}"
for serial in "${READY[@]}"; do describe "$serial"; done

# Для остальных команд выбираем первое USB-устройство, а при его отсутствии — первое.
SERIAL="${READY[0]}"
for s in "${READY[@]}"; do
  if [[ "$s" != *:* ]]; then SERIAL="$s"; break; fi
done

if [ "$ARG" = "--wifi" ]; then
  IP="$(wifi_ip "$SERIAL")"
  if [ -z "$IP" ]; then
    echo "У телефона нет адреса в Wi-Fi: включите Wi-Fi в той же сети, что и компьютер." >&2
    exit 1
  fi
  "$ADB" -s "$SERIAL" tcpip "$WIFI_PORT" >/dev/null
  sleep 2
  "$ADB" connect "$IP:$WIFI_PORT"
  echo "Отладка по Wi-Fi: $IP:$WIFI_PORT. Кабель можно отключить; вернуться к USB — переподключить кабель."
  SERIAL="$IP:$WIFI_PORT"
fi

# Телефон ходит к Metro на компьютере через localhost.
"$ADB" -s "$SERIAL" reverse "tcp:$METRO_PORT" "tcp:$METRO_PORT" >/dev/null
echo "Проброс порта: телефон tcp:$METRO_PORT → компьютер tcp:$METRO_PORT"
echo "Готово: $SERIAL. Дальше: npm start (JS) или npx expo run:android (нативная сборка)."
