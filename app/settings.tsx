import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { usePersonStore } from '../src/store/personStore';
import { useLogStore } from '../src/store/logStore';
import { exportJson, exportCsv, importJson } from '../src/utils/backup';
import {
  getNotifyHour,
  setNotifyHour,
  NOTIFY_HOUR_OPTIONS,
  getNotificationPermissionStatus,
} from '../src/utils/notifications';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/constants/theme';

type LoadingKey = 'json-export' | 'csv-export' | 'import' | null;

export default function SettingsScreen() {
  const [loading, setLoading] = useState<LoadingKey>(null);
  const [notifyHour, setNotifyHourState] = useState<number>(21);
  const [permissionStatus, setPermissionStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      const [hour, status] = await Promise.all([
        getNotifyHour(),
        getNotificationPermissionStatus(),
      ]);
      setNotifyHourState(hour);
      setPermissionStatus(status);
    })();
  }, []);

  const handleChangeNotifyHour = async (hour: number) => {
    setNotifyHourState(hour);
    await setNotifyHour(hour);
  };

  const handleJsonExport = async () => {
    setLoading('json-export');
    try {
      const persons = usePersonStore.getState().persons;
      const logs = useLogStore.getState().logs;
      await exportJson(persons, logs);
    } catch (e: any) {
      console.error('[settings] json export error:', e);
      Alert.alert('エクスポートに失敗しました', e?.message ?? String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleCsvExport = async () => {
    setLoading('csv-export');
    try {
      const persons = usePersonStore.getState().persons;
      await exportCsv(persons);
    } catch (e: any) {
      console.error('[settings] csv export error:', e);
      Alert.alert('エクスポートに失敗しました', e?.message ?? String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleImport = () => {
    Alert.alert(
      'データをインポート',
      '既存のデータにインポートしたデータを追加します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'インポート',
          onPress: async () => {
            setLoading('import');
            try {
              const persons = usePersonStore.getState().persons;
              const logs = useLogStore.getState().logs;
              const result = await importJson(persons, logs);
              if (!result) return;
              const { newPersons, newLogs } = result;
              if (newPersons.length > 0 || newLogs.length > 0) {
                await usePersonStore.getState().bulkSet([...persons, ...newPersons]);
                await useLogStore.getState().bulkSet([...logs, ...newLogs]);
              }
              Alert.alert(
                'インポート完了',
                newPersons.length > 0
                  ? `${newPersons.length}人のデータを追加しました`
                  : '追加する新しいデータはありませんでした'
              );
            } catch (e: any) {
              Alert.alert('インポートに失敗しました', e?.message ?? '');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '設定' }} />

      {/* 通知設定 */}
      <Text style={styles.sectionTitle}>通知</Text>
      {permissionStatus !== 'granted' && (
        <View style={styles.warningCard}>
          <Ionicons name="notifications-off-outline" size={18} color={Colors.danger} />
          <Text style={styles.warningText}>
            通知が無効です。設定アプリから通知を有効にしてください。
          </Text>
        </View>
      )}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="moon-outline" size={22} color={Colors.accent} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>前日通知の時刻</Text>
            <Text style={styles.rowDescription}>次に会う日・予定の前日に通知を送る時刻</Text>
          </View>
        </View>
        <View style={styles.hourSelector}>
          {NOTIFY_HOUR_OPTIONS.map((h) => (
            <Pressable
              key={h}
              style={[styles.hourChip, notifyHour === h && styles.hourChipSelected]}
              onPress={() => handleChangeNotifyHour(h)}
            >
              <Text style={[styles.hourChipText, notifyHour === h && styles.hourChipTextSelected]}>
                {h}時
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* バックアップ */}
      <Text style={styles.sectionTitle}>バックアップ・復元</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="download-outline"
          label="JSONでエクスポート"
          description="全データをJSONファイルで保存・共有"
          onPress={handleJsonExport}
          loading={loading === 'json-export'}
          disabled={loading !== null}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="document-text-outline"
          label="CSVでエクスポート"
          description="人物データをCSVファイルで保存・共有"
          onPress={handleCsvExport}
          loading={loading === 'csv-export'}
          disabled={loading !== null}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="cloud-upload-outline"
          label="JSONからインポート"
          description="バックアップファイルからデータを復元"
          onPress={handleImport}
          loading={loading === 'import'}
          disabled={loading !== null}
        />
      </View>
    </ScrollView>
  );
}

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
};

function SettingsRow({ icon, label, description, onPress, loading, disabled }: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !disabled && styles.rowPressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.rowIcon}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : (
          <Ionicons name={icon} size={22} color={Colors.accent} />
        )}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, disabled && !loading && styles.rowDisabled]}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.border} />
    </Pressable>
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF0F0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.danger,
    lineHeight: 18,
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
    marginLeft: Spacing.md + 22 + Spacing.md,
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
    width: 22,
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  rowDisabled: {
    color: Colors.textSecondary,
  },
  rowDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  hourSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  hourChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  hourChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.tagBackground,
  },
  hourChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hourChipTextSelected: {
    color: Colors.accent,
  },
});
