import { useRef } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { Person } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

type Props = {
  person: Person;
  lastMetDate?: string;
  onPress: () => void;
};

function formatLastMet(dateStr?: string): string {
  if (!dateStr) return '記録なし';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}

function getInitials(name: string): string {
  return name.charAt(0);
}

export default function PersonCard({ person, lastMetDate, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 4 }).start();

  const hasLastMet = !!lastMetDate;

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(person.name)}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {person.name}
          </Text>

          <View style={styles.metaRow}>
            {person.organization ? (
              <Text style={styles.meta} numberOfLines={1}>
                {person.organization}
              </Text>
            ) : null}
            {person.organization && person.relationship ? (
              <Text style={styles.dot}>·</Text>
            ) : null}
            {person.relationship ? (
              <Text style={styles.meta} numberOfLines={1}>
                {person.relationship}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.lastMet, hasLastMet && styles.lastMetActive]}>
            {formatLastMet(lastMetDate)}
          </Text>

          {person.tags.length > 0 && (
            <View style={styles.tagRow}>
              {person.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
              {person.tags.length > 3 && (
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>+{person.tags.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: 13,
    color: Colors.border,
  },
  lastMet: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lastMetActive: {
    color: Colors.accent,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  tagChip: {
    backgroundColor: Colors.tagBackground,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagChipText: {
    fontSize: FontSize.xs - 1,
    color: Colors.accent,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    color: Colors.border,
    marginLeft: Spacing.sm,
  },
});
