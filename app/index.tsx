import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { usePersonStore } from '../src/store/personStore';
import { useLogStore } from '../src/store/logStore';
import PersonCard from '../src/components/PersonCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const persons = usePersonStore((s) => s.persons);
  const isLoaded = usePersonStore((s) => s.isLoaded);
  const logs = useLogStore((s) => s.logs);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // personId → 最新の会話日時のマップ
  const lastMetMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const log of logs) {
      if (!map[log.personId] || log.date > map[log.personId]) {
        map[log.personId] = log.date;
      }
    }
    return map;
  }, [logs]);

  // 全タグ一覧（使用人数の多い順、同数は五十音順）
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

  // 検索 + タグの複合フィルタ
  const filtered = useMemo(() => {
    let result = persons;
    if (selectedTag) {
      result = result.filter((p) => p.tags.includes(selectedTag));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.organization?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [persons, query, selectedTag]);

  const toggleTag = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <View style={styles.container}>
      {/* ヘッダーに追加ボタン */}
      <Stack.Screen
        options={{
          title: 'Karte',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => router.push('/settings')}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/person/new')}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Ionicons name="add" size={28} color={Colors.accent} />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
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

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagFilterContent}
          style={styles.tagFilterRow}
          keyboardShouldPersistTaps="handled"
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
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedTag === tag && styles.filterChipTextSelected,
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* リスト */}
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
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          ListEmptyComponent={
            <Text style={styles.noResults}>
              {selectedTag ? `「${selectedTag}」タグの人物が見つかりません` : `「${query}」に一致する人物が見つかりません`}
            </Text>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  // タグフィルター
  tagFilterRow: {
    flexGrow: 0,
    marginBottom: Spacing.xs,
  },
  tagFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.tagBackground,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipSelected: {
    backgroundColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: Colors.white,
  },
  // リスト
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  noResults: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xl,
  },
  // Empty state
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
  emptyButtonPressed: {
    opacity: 0.8,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
