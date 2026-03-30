import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLogStore } from '../../../../src/store/logStore';
import LogForm from '../../../../src/components/LogForm';
import { Colors, FontSize } from '../../../../src/constants/theme';

export default function EditLogScreen() {
  const { logId } = useLocalSearchParams<{ id: string; logId: string }>();
  const log = useLogStore((s) => s.logs.find((l) => l.id === logId));
  const router = useRouter();

  if (!log) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>ログが見つかりません</Text>
      </View>
    );
  }

  return (
    <LogForm
      mode="edit"
      initialValues={log}
      onSubmit={async (data) => {
        await useLogStore.getState().update(logId, data);
        router.back();
      }}
      onDelete={async () => {
        await useLogStore.getState().remove(logId);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
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
});
