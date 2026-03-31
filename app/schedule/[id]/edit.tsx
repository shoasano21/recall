import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { usePersonStore } from '../../../src/store/personStore';
import { useScheduleStore } from '../../../src/store/scheduleStore';
import {
  cancelNotification,
  scheduleAppointmentNotification,
} from '../../../src/utils/notifications';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';

export default function EditScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const schedule = useScheduleStore((s) => s.schedules.find((sc) => sc.id === id));
  const persons = usePersonStore((s) => s.persons);
  const sortedPersons = useMemo(
    () => [...persons].sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [persons]
  );

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    schedule?.personId ?? null
  );
  const [date, setDate] = useState<Date>(
    schedule ? new Date(schedule.date) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); return d; })()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState(schedule?.note ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [personError, setPersonError] = useState('');

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  if (!schedule) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ title: '予定を編集' }} />
        <Text style={styles.notFoundText}>予定が見つかりません</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!selectedPersonId) {
      setPersonError('相手を選択してください');
      return;
    }
    setPersonError('');
    setIsSubmitting(true);
    try {
      // 古い通知をキャンセル
      if (schedule.notificationId) {
        await cancelNotification(schedule.notificationId);
      }
      // 新しい通知をスケジュール
      const nid = await scheduleAppointmentNotification(
        schedule.id,
        selectedPerson!.name,
        date.toISOString()
      );
      await useScheduleStore.getState().update(schedule.id, {
        personId: selectedPersonId,
        date: date.toISOString(),
        note: note.trim() || undefined,
        notificationId: nid ?? undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? '予定の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'この予定を削除しますか？',
      `${selectedPerson?.name ?? ''}との予定を削除します。この操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              if (schedule.notificationId) {
                await cancelNotification(schedule.notificationId);
              }
              await useScheduleStore.getState().remove(schedule.id);
              router.back();
            } catch (e: any) {
              Alert.alert('エラー', e?.message ?? '削除に失敗しました');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (d: Date) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
  };

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <Stack.Screen options={{ title: '予定を編集' }} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 日時 */}
        <Text style={styles.sectionTitle}>日時</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>日付</Text>
            <Pressable style={styles.valueRow} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.valueText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) {
                    const next = new Date(date);
                    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    setDate(next);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.label}>時刻</Text>
            <Pressable style={styles.valueRow} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.valueText}>{formatTime(date)}</Text>
              <Ionicons name="time-outline" size={18} color={Colors.accent} />
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (d) {
                    const next = new Date(date);
                    next.setHours(d.getHours(), d.getMinutes(), 0, 0);
                    setDate(next);
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* 相手 */}
        <Text style={styles.sectionTitle}>相手</Text>
        <View style={styles.card}>
          {personError ? <Text style={styles.errorText}>{personError}</Text> : null}
          {sortedPersons.map((person, idx) => (
            <View key={person.id}>
              {idx > 0 && <View style={styles.divider} />}
              <Pressable
                style={({ pressed }) => [styles.personRow, pressed && styles.personRowPressed]}
                onPress={() => { setSelectedPersonId(person.id); setPersonError(''); }}
              >
                <View style={[styles.radio, selectedPersonId === person.id && styles.radioSelected]}>
                  {selectedPersonId === person.id && <View style={styles.radioDot} />}
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  {person.organization ? (
                    <Text style={styles.personMeta}>{person.organization}</Text>
                  ) : null}
                </View>
              </Pressable>
            </View>
          ))}
        </View>

        {/* メモ */}
        <Text style={styles.sectionTitle}>メモ（任意）</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="自由にメモを書いてください..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* 削除ボタン */}
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
          onPress={handleDelete}
          disabled={isDeleting || isSubmitting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>この予定を削除</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            isSubmitting && styles.buttonDisabled,
            pressed && !isSubmitting && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={isSubmitting || isDeleting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>保存する</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  fieldRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  valueText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  personRowPressed: {
    backgroundColor: Colors.background,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
  personName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  personMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  noteInput: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 80,
    paddingVertical: Spacing.xs,
    textAlignVertical: 'top',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: FontSize.md,
    color: Colors.danger,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: { opacity: 0.85 },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: { opacity: 0.5 },
});
