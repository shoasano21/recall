import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useScheduleStore } from '../../../src/store/scheduleStore';
import { usePersonStore } from '../../../src/store/personStore';
import { cancelNotification } from '../../../src/utils/notifications';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';

function formatDateTime(isoStr: string): { date: string; time: string } {
  const d = new Date(isoStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const date = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isDeleting, setIsDeleting] = useState(false);

  const schedule = useScheduleStore((s) => s.schedules.find((sc) => sc.id === id));
  const persons = usePersonStore((s) => s.persons);

  const person = useMemo(
    () => persons.find((p) => p.id === schedule?.personId),
    [persons, schedule]
  );

  if (!schedule) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ title: '予定の詳細' }} />
        <Text style={styles.notFoundText}>予定が見つかりません</Text>
      </View>
    );
  }

  const { date, time } = formatDateTime(schedule.date);

  const handleDelete = () => {
    Alert.alert(
      'この予定を削除しますか？',
      `${person?.name ?? ''}との予定を削除します。この操作は元に戻せません。`,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '予定の詳細' }} />

      {/* 日時 */}
      <Text style={styles.sectionTitle}>日時</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
          </View>
          <Text style={styles.rowValue}>{date}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="time-outline" size={20} color={Colors.accent} />
          </View>
          <Text style={styles.rowValue}>{time}</Text>
        </View>
      </View>

      {/* 相手 */}
      <Text style={styles.sectionTitle}>相手</Text>
      <View style={styles.card}>
        {person ? (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/person/${person.id}`)}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="person-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.rowValue}>{person.name}</Text>
              {person.organization ? (
                <Text style={styles.rowSub}>{person.organization}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          </Pressable>
        ) : (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="person-outline" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.rowValue}>不明</Text>
          </View>
        )}
      </View>

      {/* メモ */}
      {schedule.note ? (
        <>
          <Text style={styles.sectionTitle}>メモ</Text>
          <View style={styles.card}>
            <View style={styles.noteRow}>
              <Text style={styles.noteText}>{schedule.note}</Text>
            </View>
          </View>
        </>
      ) : null}

      {/* 通知 */}
      <Text style={styles.sectionTitle}>通知</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons
              name={schedule.notificationId ? 'notifications-outline' : 'notifications-off-outline'}
              size={20}
              color={schedule.notificationId ? Colors.accent : Colors.textSecondary}
            />
          </View>
          <Text style={[styles.rowValue, !schedule.notificationId && styles.rowValueMuted]}>
            {schedule.notificationId ? '前日に通知が設定されています' : '通知なし'}
          </Text>
        </View>
      </View>

      {/* 編集ボタン */}
      <Pressable
        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
        onPress={() => router.push(`/schedule/${schedule.id}/edit`)}
        disabled={isDeleting}
      >
        <Ionicons name="pencil-outline" size={18} color={Colors.accent} />
        <Text style={styles.editButtonText}>この予定を編集</Text>
      </Pressable>

      {/* 削除ボタン */}
      <Pressable
        style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        onPress={handleDelete}
        disabled={isDeleting}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
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
    marginLeft: Spacing.md + 20 + Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowPressed: {
    backgroundColor: Colors.background,
  },
  rowIcon: {
    width: 20,
    alignItems: 'center',
  },
  rowValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowValueMuted: {
    color: Colors.textSecondary,
  },
  rowSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  personInfo: {
    flex: 1,
  },
  noteRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  noteText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.white,
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  editButtonText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: '600',
  },
});
