import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePersonStore } from '../../../src/store/personStore';
import { useLogStore } from '../../../src/store/logStore';
import PersonForm from '../../../src/components/PersonForm';
import { Colors, FontSize } from '../../../src/constants/theme';
import {
  scheduleNextMeetingNotification,
  cancelNotification,
} from '../../../src/utils/notifications';

export default function EditPersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = usePersonStore((s) => s.persons.find((p) => p.id === id));
  const router = useRouter();

  if (!person) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>人物が見つかりません</Text>
      </View>
    );
  }

  return (
    <PersonForm
      mode="edit"
      initialValues={person}
      onSubmit={async (data) => {
        // 既存の通知をキャンセル
        if (person.nextMeetingNotificationId) {
          await cancelNotification(person.nextMeetingNotificationId);
        }
        // 新しい次に会う日があれば通知をスケジュール
        let notificationId: string | undefined;
        if (data.nextMeetingDate) {
          const nid = await scheduleNextMeetingNotification(id, data.name, data.nextMeetingDate);
          notificationId = nid ?? undefined;
        }
        await usePersonStore.getState().update(id, {
          ...data,
          nextMeetingNotificationId: notificationId,
        });
        router.back();
      }}
      onDelete={async () => {
        if (person.nextMeetingNotificationId) {
          await cancelNotification(person.nextMeetingNotificationId);
        }
        await usePersonStore.getState().remove(id);
        await useLogStore.getState().removeByPersonId(id);
        router.replace('/');
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
