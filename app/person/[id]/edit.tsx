import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePersonStore } from '../../../src/store/personStore';
import { useLogStore } from '../../../src/store/logStore';
import { useScheduleStore } from '../../../src/store/scheduleStore';
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

        // 「次に会う日」をカレンダーに同期
        const autoSchedule = useScheduleStore
          .getState()
          .schedules.find((s) => s.personId === id && s.source === 'nextMeeting');
        if (data.nextMeetingDate) {
          // 日付の12:00（ローカル時刻）をISO文字列に変換
          const dateAt12 = new Date(data.nextMeetingDate + 'T12:00:00').toISOString();
          if (autoSchedule) {
            await useScheduleStore.getState().update(autoSchedule.id, {
              personId: id,
              date: dateAt12,
              note: '次回の予定',
              source: 'nextMeeting',
            });
          } else {
            await useScheduleStore.getState().add({
              personId: id,
              date: dateAt12,
              note: '次回の予定',
              source: 'nextMeeting',
            });
          }
        } else if (autoSchedule) {
          await useScheduleStore.getState().remove(autoSchedule.id);
        }

        router.back();
      }}
      onLogAdd={async (logData) => {
        await useLogStore.getState().add({ ...logData, personId: id });
      }}
      onDelete={async () => {
        if (person.nextMeetingNotificationId) {
          await cancelNotification(person.nextMeetingNotificationId);
        }
        // 自動生成された予定も削除
        const autoSchedule = useScheduleStore
          .getState()
          .schedules.find((s) => s.personId === id && s.source === 'nextMeeting');
        if (autoSchedule) {
          await useScheduleStore.getState().remove(autoSchedule.id);
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
