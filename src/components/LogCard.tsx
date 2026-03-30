import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationLog } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

type Props = {
  log: ConversationLog;
  onPress: () => void;
};

function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr);
  const currentYear = new Date().getFullYear();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (date.getFullYear() === currentYear) {
    return `${month}月${day}日（${weekday}）`;
  }
  return `${date.getFullYear()}年${month}月${day}日（${weekday}）`;
}

export default function LogCard({ log, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* ヘッダー行：日時 + オンライン/オフラインバッジ */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatLogDate(log.date)}</Text>
        <View style={[styles.badge, log.isOnline ? styles.badgeOnline : styles.badgeOffline]}>
          <Ionicons
            name={log.isOnline ? 'videocam-outline' : 'location-outline'}
            size={11}
            color={log.isOnline ? Colors.accent : Colors.textSecondary}
          />
          <Text style={[styles.badgeText, log.isOnline ? styles.badgeTextOnline : styles.badgeTextOffline]}>
            {log.isOnline ? 'オンライン' : 'オフライン'}
          </Text>
        </View>
      </View>

      {/* 場所（オフラインかつ場所あり） */}
      {!log.isOnline && log.location && (
        <Text style={styles.location}>{log.location}</Text>
      )}

      {/* 会話内容 */}
      <Text style={styles.content}>{log.content}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeOnline: {
    backgroundColor: '#EEF3FF',
  },
  badgeOffline: {
    backgroundColor: Colors.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeTextOnline: {
    color: Colors.accent,
  },
  badgeTextOffline: {
    color: Colors.textSecondary,
  },
  location: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  content: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
});
