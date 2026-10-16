import { type ReactNode, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { ReduceMotion, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeAmount, expressionFromKopecks, isRecordable } from '@/shared/lib/amount-input';
import { formatMoney, type Kopecks } from '@/shared/lib/money';
import { fontFamily } from '@/shared/theme/fonts';
import { useTokens } from '@/shared/theme/useTokens';
import { AppIcon } from '@/shared/ui/AppIcon';
import { AppText } from '@/shared/ui/AppText';

import { useEntryStore } from '../model/entryStore';
import { useKeyboardInset } from '../model/useKeyboardInset';
import {
  actionLabel,
  afterLine,
  contextLabel,
  type EntryDraft,
  type EntryInfo,
  type EntrySession,
} from '../model/session';
import { Keypad } from './Keypad';

export interface AmountSheetProps {
  /** Цифры для строки «Останется» (обзор бюджета и балансы счетов со страницы). */
  info: EntryInfo;
  /** Самые частые суммы по категории за 30 дней: чипы быстрого выбора. */
  recent: readonly Kopecks[];
  /** Плитка категории над шторкой («поднята»), по введённой сумме показывает приращение. */
  preview?: (amount: Kopecks | null) => ReactNode;
  /** Нажата кнопка «Записать»: страница пишет операцию в базу. */
  onRecord: (draft: EntryDraft) => void;
}

/**
 * Шторка ввода суммы (C · Быстрый ввод): контекст и день, выражение и крупная сумма, «Останется», недавние суммы,
 * комментарий, своя клавиатура, кнопка «Записать». Открывается и закрывается через useEntryStore.
 */
export function AmountSheet(props: AmountSheetProps) {
  const session = useEntryStore((state) => state.session);
  const close = useEntryStore((state) => state.close);
  // Modal рисуется поверх всего, включая нижнюю навигацию, и сам обрабатывает кнопку «Назад» (onRequestClose)
  return session ? (
    <Modal transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <SheetBody session={session} {...props} />
    </Modal>
  ) : null;
}

function SheetBody({ session, info, recent, preview, onRecord }: AmountSheetProps & { session: EntrySession }) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardInset();
  const expression = useEntryStore((state) => state.expression);
  const dayOffset = useEntryStore((state) => state.dayOffset);
  const note = useEntryStore((state) => state.note);
  const { press, setExpression, setDayOffset, setNote, close } = useEntryStore.getState();
  const [noteOpen, setNoteOpen] = useState(note.length > 0);
  const [noteFocused, setNoteFocused] = useState(false);

  const view = describeAmount(expression);
  const amount = view.value !== null && view.value > 0 ? view.value : null;
  const recordable = isRecordable(view);
  const after = afterLine(session, info, amount);

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Закрыть без записи"
        onPress={close}
        style={styles.scrim}
      />
      {preview && !noteFocused && (
        <View pointerEvents="none" style={styles.preview}>
          {preview(amount)}
        </View>
      )}
      <Animated.View
        entering={SlideInDown.duration(220).reduceMotion(ReduceMotion.System)}
        style={[styles.sheet, { backgroundColor: t.surface, paddingBottom: 16 + Math.max(insets.bottom, keyboard) }]}
      >
        <View style={styles.contextRow}>
          <AppText variant="label" numberOfLines={1} style={styles.context}>
            {contextLabel(session)}
          </AppText>
          <DayChip label="Сегодня" selected={dayOffset === 0} onPress={() => setDayOffset(0)} />
          <DayChip label="Вчера" selected={dayOffset === -1} onPress={() => setDayOffset(-1)} />
        </View>

        <AppText variant="caption" color={t.inkSecondary} numberOfLines={1} style={styles.expression}>
          {view.expression ?? ' '}
        </AppText>
        <AppText
          variant="amountInput"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          accessibilityLabel={`Сумма ${view.display} рублей`}
        >
          {view.display}
          {'\u00A0'}₽
        </AppText>
        <AppText variant="caption" color={t.inkSecondary} style={styles.after}>
          {after ?? ' '}
        </AppText>

        {recent.length > 0 && !noteFocused && (
          <View style={styles.chips}>
            {recent.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`Подставить ${formatMoney(value, { kopecks: 'auto' })}`}
                onPress={() => setExpression(expressionFromKopecks(value))}
                style={[styles.chip, { backgroundColor: t.tonal }]}
              >
                <AppText variant="label" color={t.onTonal}>
                  {formatMoney(value, { kopecks: 'auto' })}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}

        {noteOpen ? (
          <TextInput
            accessibilityLabel="Комментарий"
            placeholder="Комментарий"
            placeholderTextColor={t.inkSecondary}
            value={note}
            onChangeText={setNote}
            onFocus={() => setNoteFocused(true)}
            onBlur={() => setNoteFocused(false)}
            maxLength={200}
            returnKeyType="done"
            style={[styles.noteInput, { backgroundColor: t.key, color: t.ink, fontFamily: fontFamily[400] }]}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Добавить комментарий"
            onPress={() => setNoteOpen(true)}
            style={[styles.noteButton, { backgroundColor: t.key }]}
          >
            <AppIcon name="message-square" size={18} color={t.inkSecondary} />
            <AppText variant="label" color={t.inkSecondary}>
              Комментарий
            </AppText>
          </Pressable>
        )}

        {!noteFocused && <Keypad onPress={press} />}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel(session, amount)}
          accessibilityState={{ disabled: !recordable }}
          disabled={!recordable}
          onPress={() => {
            if (amount !== null) onRecord({ session, amount, dayOffset, note });
          }}
          style={[styles.action, { backgroundColor: recordable ? t.accent : t.divider }]}
        >
          <AppText variant="titleApp" color={recordable ? t.onAccent : t.inkSecondary}>
            {actionLabel(session, amount)}
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function DayChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.dayChip, { backgroundColor: selected ? t.tonal : 'transparent' }]}
    >
      <AppText variant="label" color={selected ? t.onTonal : t.inkSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  preview: { paddingHorizontal: 12, paddingBottom: 8 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48 },
  context: { flex: 1 },
  dayChip: { minHeight: 48, paddingHorizontal: 12, borderRadius: 24, justifyContent: 'center' },
  expression: { minHeight: 16 },
  after: { minHeight: 16 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 48, paddingHorizontal: 16, borderRadius: 24, justifyContent: 'center' },
  noteButton: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteInput: { minHeight: 48, borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
  action: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
