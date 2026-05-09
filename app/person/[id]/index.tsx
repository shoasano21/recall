import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import Markdown from 'react-native-markdown-display';
import { usePersonStore } from '../../../src/store/personStore';
import { useLogStore } from '../../../src/store/logStore';
import LogCard from '../../../src/components/LogCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = usePersonStore((s) => s.persons.find((p) => p.id === id));
  const allLogs = useLogStore((s) => s.logs);
  const logs = useMemo(
    () =>
      allLogs
        .filter((l) => l.personId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allLogs, id]
  );
  const router = useRouter();

  if (!person) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>人物が見つかりません</Text>
      </View>
    );
  }

  const metaParts = [person.organization, person.relationship].filter(Boolean);
  const hasDetails = person.hobby || person.hometown || person.highSchool || person.note;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/person/${id}/edit`)}
              style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="pencil-outline" size={24} color={Colors.accent} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── プロフィールセクション ── */}
        <View style={styles.profileSection}>
          {person.photoUri ? (
            <Image source={{ uri: person.photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{person.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.name}>{person.name}</Text>
          {metaParts.length > 0 && (
            <Text style={styles.meta}>{metaParts.join('  ·  ')}</Text>
          )}
          {person.tags.length > 0 && (
            <View style={styles.tagRow}>
              {person.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── 詳細メモセクション ── */}
        {hasDetails && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>詳細情報</Text>

              {/* 趣味・出身地・出身高校カード */}
              {(person.hobby || person.hometown || person.highSchool) && (
                <View style={styles.detailCard}>
                  {person.hobby && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>趣味・特技</Text>
                      <Text style={styles.detailValue}>{person.hobby}</Text>
                    </View>
                  )}
                  {person.hobby && person.hometown && (
                    <View style={styles.detailDivider} />
                  )}
                  {person.hometown && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>出身地</Text>
                      <Text style={styles.detailValue}>{person.hometown}</Text>
                    </View>
                  )}
                  {(person.hobby || person.hometown) && person.highSchool && (
                    <View style={styles.detailDivider} />
                  )}
                  {person.highSchool && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>出身高校</Text>
                      <Text style={styles.detailValue}>{person.highSchool}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* メモ（Markdown） */}
              {person.note && (
                <View style={styles.noteCard}>
                  <Text style={styles.detailLabel}>メモ</Text>
                  <Markdown style={markdownStyles}>{person.note}</Markdown>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── 会話ログセクション ── */}
        <View style={styles.sectionDivider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>会話ログ</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogs}>まだ会話の記録がありません</Text>
          ) : (
            logs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onPress={() => router.push(`/person/${id}/log/${log.id}`)}
              />
            ))
          )}
        </View>

        {/* FAB 分の余白 */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── フローティング追加ボタン ── */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push(`/person/${id}/log/new`)}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const markdownStyles = {
  body: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  heading1: { fontSize: FontSize.xl, fontWeight: '700' as const, marginVertical: 6 },
  heading2: { fontSize: FontSize.lg, fontWeight: '600' as const, marginVertical: 4 },
  heading3: { fontSize: FontSize.md, fontWeight: '600' as const, marginVertical: 4 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  code_inline: {
    backgroundColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: FontSize.sm,
  },
  fence: {
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  hr: { backgroundColor: Colors.border, height: 1, marginVertical: Spacing.sm },
  strong: { fontWeight: '700' as const },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // ── プロフィール ──
  profileSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
  },
  initialsCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: '600',
    color: Colors.white,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tagChip: {
    backgroundColor: Colors.tagBackground,
    borderRadius: BorderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagChipText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },

  // ── セクション共通 ──
  sectionDivider: {
    height: 8,
    backgroundColor: Colors.background,
  },
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },

  // ── 詳細メモ ──
  detailCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  detailRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 72,
    flexShrink: 0,
    paddingTop: 2,
  },
  detailValue: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  noteCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },

  // ── 会話ログ ──
  emptyLogs: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
