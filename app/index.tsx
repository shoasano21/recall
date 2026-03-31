import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { Calendar, DateData } from 'react-native-calendars';
import { usePersonStore } from '../src/store/personStore';
import { useLogStore } from '../src/store/logStore';
import { useScheduleStore } from '../src/store/scheduleStore';
import { cancelNotification } from '../src/utils/notifications';
import PersonCard from '../src/components/PersonCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/constants/theme';

type Tab = 'persons' | 'schedule';

const TODAY = new Date().toISOString().slice(0, 10);

function toDateKey(isoStr: string) { return isoStr.slice(0, 10); }
function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function formatDateLabel(key: string) {
  const d = new Date(key + 'T00:00:00');
  const w = ['日','月','火','水','木','金','土'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${w}）`;
}

const TAB_BAR_HEIGHT = 64;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useFonts({ Raleway_700Bold });

  const [activeTab, setActiveTab] = useState<Tab>('persons');

  // ── 人物タブ ───────────────────────────────────────────────
  const persons = usePersonStore((s) => s.persons);
  const isLoaded = usePersonStore((s) => s.isLoaded);
  const logs = useLogStore((s) => s.logs);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const lastMetMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const log of logs) {
      if (!map[log.personId] || log.date > map[log.personId]) {
        map[log.personId] = log.date;
      }
    }
    return map;
  }, [logs]);

  const allTags = useMemo(() => {
    const countMap: Record<string, number> = {};
    persons.forEach((p) => p.tags.forEach((t) => {
      countMap[t] = (countMap[t] ?? 0) + 1;
    }));
    return Object.keys(countMap).sort((a, b) => {
      const diff = countMap[b] - countMap[a];
      return diff !== 0 ? diff : a.localeCompare(b, 'ja');
    });
  }, [persons]);

  const filtered = useMemo(() => {
    let result = persons;
    if (selectedTag) result = result.filter((p) => p.tags.includes(selectedTag));
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.organization?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [persons, query, selectedTag]);

  // ── 予定タブ ───────────────────────────────────────────────
  const schedules = useScheduleStore((s) => s.schedules);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);

  const personMap = useMemo(() => {
    const m: Record<string, string> = {};
    persons.forEach((p) => { m[p.id] = p.name; });
    return m;
  }, [persons]);

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    schedules.forEach((s) => {
      const key = toDateKey(s.date);
      marks[key] = { marked: true, dotColor: Colors.accent, ...(marks[key] ?? {}) };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: Colors.accent,
      dotColor: Colors.white,
    };
    return marks;
  }, [schedules, selectedDate]);

  const daySchedules = useMemo(() =>
    schedules
      .filter((s) => toDateKey(s.date) === selectedDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [schedules, selectedDate]
  );

  // ── FAB ───────────────────────────────────────────────────
  const handleFab = () => {
    if (activeTab === 'persons') {
      router.push('/person/new');
    } else {
      router.push({ pathname: '/schedule/new', params: { date: selectedDate } });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => <Text style={styles.headerTitle}>Recall</Text>,
          headerStyle: { backgroundColor: Colors.white, height: 76 } as any,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="settings-outline" size={28} color={Colors.textSecondary} />
            </Pressable>
          ),
        }}
      />

      {/* ── コンテンツ ── */}
      {activeTab === 'persons' ? (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="名前・所属で検索"
              placeholderTextColor={Colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {allTags.length > 0 && (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              directionalLockEnabled={true}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              style={{ flexGrow: 0, height: 52, marginBottom: Spacing.xs }}
              contentContainerStyle={{
                paddingHorizontal: Spacing.md,
                paddingVertical: 4,
                gap: Spacing.sm,
                alignItems: 'center',
              }}
            >
              <Pressable
                style={[styles.filterChip, !selectedTag && styles.filterChipSelected]}
                onPress={() => setSelectedTag(null)}
              >
                <Text style={[styles.filterChipText, !selectedTag && styles.filterChipTextSelected]}>
                  すべて
                </Text>
              </Pressable>
              {allTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.filterChip, selectedTag === tag && styles.filterChipSelected]}
                  onPress={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
                >
                  <Text style={[styles.filterChipText, selectedTag === tag && styles.filterChipTextSelected]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {isLoaded && persons.length === 0 ? (
            <EmptyState onAdd={() => router.push('/person/new')} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PersonCard
                  person={item}
                  lastMetDate={lastMetMap[item.id]}
                  onPress={() => router.push(`/person/${item.id}`)}
                />
              )}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: Spacing.md,
                paddingTop: Spacing.sm,
                paddingBottom: 180,
              }}
              ListEmptyComponent={
                <Text style={styles.noResults}>
                  {selectedTag
                    ? `「${selectedTag}」タグの人物が見つかりません`
                    : `「${query}」に一致する人物が見つかりません`}
                </Text>
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}
        </>
      ) : (
        <>
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

          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{formatDateLabel(selectedDate)}</Text>
          </View>

          <FlatList
            data={daySchedules}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.scheduleEmpty}>
                <Text style={styles.noResults}>この日の予定はありません</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.scheduleCard, pressed && { opacity: 0.75 }]}
                onPress={() => router.push(`/schedule/${item.id}`)}
                onLongPress={() => {
                  Alert.alert(
                    'この予定を削除しますか？',
                    `${personMap[item.personId] ?? ''}との予定を削除します。`,
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      {
                        text: '削除する',
                        style: 'destructive',
                        onPress: async () => {
                          if (item.notificationId) {
                            await cancelNotification(item.notificationId);
                          }
                          await useScheduleStore.getState().remove(item.id);
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleTime}>{formatTime(item.date)}</Text>
                </View>
                <View style={styles.scheduleBody}>
                  <Text style={styles.schedulePersonName}>{personMap[item.personId] ?? '不明'}</Text>
                  {item.note ? (
                    <Text style={styles.scheduleNote} numberOfLines={2}>{item.note}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.border} />
              </Pressable>
            )}
          />
        </>
      )}

      {/* ── FAB（タブバーの上）── */}
      <Pressable
        onPress={handleFab}
        style={({ pressed }) => [
          styles.fab,
          { bottom: TAB_BAR_HEIGHT + insets.bottom + Spacing.md, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="add" size={36} color={Colors.white} />
      </Pressable>

      {/* ── タブバー（一番下）── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }]}>
        <Pressable
          style={[styles.tabItem, activeTab === 'persons' && styles.tabItemActive]}
          onPress={() => setActiveTab('persons')}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === 'persons' ? Colors.white : Colors.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'persons' && styles.tabLabelActive]}>
            人物
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'schedule' && styles.tabItemActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === 'schedule' ? Colors.white : Colors.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>
            予定
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👤</Text>
      <Text style={styles.emptyTitle}>まだ誰も登録されていません</Text>
      <Text style={styles.emptySubtitle}>出会った人を記録しておきましょう</Text>
      <Pressable
        style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={18} color={Colors.white} />
        <Text style={styles.emptyButtonText}>人物を追加</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── ヘッダー
  headerTitle: {
    fontFamily: 'Raleway_700Bold',
    fontSize: 38,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  headerButton: {
    paddingHorizontal: Spacing.sm + 2,
    paddingTop: 2,
    paddingBottom: Spacing.sm + 2,
  },

  // ── 検索
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md + 4,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },

  // ── タグフィルター
  tagFilterRow: {
    height: 52,
    marginBottom: Spacing.xs,
  },
  tagFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    height: 52,
  },
  filterChip: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.tagBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: Colors.accent,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: Colors.white,
  },

  // ── リスト共通
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 180,
  },
  noResults: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xl,
  },

  // ── カレンダー
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dayHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  scheduleEmpty: {
    paddingVertical: Spacing.lg,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleLeft: {
    width: 44,
    alignItems: 'center',
  },
  scheduleTime: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  scheduleBody: {
    flex: 1,
    gap: 3,
  },
  schedulePersonName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scheduleNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // ── タブバー
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tabItemActive: {
    backgroundColor: Colors.accent,
  },
  tabLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.white,
  },

  // ── FAB
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

  // ── Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  emptyButtonPressed: { opacity: 0.8 },
  emptyButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
