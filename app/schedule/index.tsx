import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { Calendar, DateData } from 'react-native-calendars';
import { useScheduleStore } from '../../src/store/scheduleStore';
import { usePersonStore } from '../../src/store/personStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

const TODAY = new Date().toISOString().slice(0, 10);

function toDateKey(isoStr: string): string {
  return isoStr.slice(0, 10);
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const schedules = useScheduleStore((s) => s.schedules);
  const persons = usePersonStore((s) => s.persons);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);

  const personMap = useMemo(() => {
    const m: Record<string, string> = {};
    persons.forEach((p) => { m[p.id] = p.name; });
    return m;
  }, [persons]);

  // 予定があるすべての日付 → カレンダーの dots マーキング
  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};

    schedules.forEach((s) => {
      const key = toDateKey(s.date);
      marks[key] = {
        marked: true,
        dotColor: Colors.accent,
        ...(marks[key] ?? {}),
      };
    });

    // 選択日のハイライト
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: Colors.accent,
      dotColor: Colors.white,
    };

    return marks;
  }, [schedules, selectedDate]);

  // 選択日の予定（時刻順）
  const daySchedules = useMemo(() => {
    return schedules
      .filter((s) => toDateKey(s.date) === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [schedules, selectedDate]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'カレンダー' }} />

      <Calendar
        current={TODAY}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: Colors.white,
          calendarBackground: Colors.white,
          todayTextColor: Colors.accent,
          selectedDayBackgroundColor: Colors.accent,
          selectedDayTextColor: Colors.white,
          arrowColor: Colors.accent,
          monthTextColor: Colors.textPrimary,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.border,
          dotColor: Colors.accent,
          textDayFontSize: FontSize.sm,
          textMonthFontSize: FontSize.md,
          textDayHeaderFontSize: FontSize.xs,
          textMonthFontWeight: '700',
        }}
        style={styles.calendar}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>{formatDateLabel(selectedDate)}</Text>
      </View>

      <FlatList
        data={daySchedules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>この日の予定はありません</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/schedule/new`)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.timeText}>{formatTime(item.date)}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.personName}>
                {personMap[item.personId] ?? '不明'}
              </Text>
              {item.note ? (
                <Text style={styles.noteText} numberOfLines={2}>{item.note}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          </Pressable>
        )}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push({ pathname: '/schedule/new', params: { date: selectedDate } })}
      >
        <Ionicons name="add" size={36} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  listHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardLeft: {
    width: 44,
    alignItems: 'center',
  },
  timeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  personName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  noteText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 32,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
