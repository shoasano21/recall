import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFY_HOUR_KEY = 'recall_notify_hour';
export const DEFAULT_NOTIFY_HOUR = 21;
export const NOTIFY_HOUR_OPTIONS = [20, 21, 22] as const;

// ─── 通知時刻の保存・取得 ─────────────────────────────────────────────────
export async function getNotifyHour(): Promise<number> {
  const raw = await AsyncStorage.getItem(NOTIFY_HOUR_KEY);
  return raw ? parseInt(raw, 10) : DEFAULT_NOTIFY_HOUR;
}

export async function setNotifyHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(NOTIFY_HOUR_KEY, String(hour));
}

// ─── 権限リクエスト ───────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// ─── 前日の指定時刻を計算 ────────────────────────────────────────────────
function getPrevDayTrigger(dateStr: string, hour: number): Date | null {
  // dateStr は YYYY-MM-DD または ISO datetime
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  // 前日
  const trigger = new Date(target);
  trigger.setDate(trigger.getDate() - 1);
  trigger.setHours(hour, 0, 0, 0);
  // 過去なら null
  if (trigger.getTime() <= Date.now()) return null;
  return trigger;
}

// ─── 人物の次に会う日通知 ────────────────────────────────────────────────
export async function scheduleNextMeetingNotification(
  personId: string,
  personName: string,
  dateStr: string
): Promise<string | null> {
  const hour = await getNotifyHour();
  const triggerDate = getPrevDayTrigger(dateStr, hour);
  if (!triggerDate) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '明日の予定',
      body: `明日、${personName}さんと会います。プロフィールを確認しましょう 👀`,
      data: { screen: 'person', personId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return id;
}

// ─── 予定通知 ────────────────────────────────────────────────────────────
export async function scheduleAppointmentNotification(
  scheduleId: string,
  personName: string,
  dateStr: string
): Promise<string | null> {
  const hour = await getNotifyHour();
  const triggerDate = getPrevDayTrigger(dateStr, hour);
  if (!triggerDate) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '明日の予定',
      body: `明日、${personName}さんと会う予定があります 📅`,
      data: { screen: 'schedule', scheduleId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return id;
}

// ─── 通知キャンセル ───────────────────────────────────────────────────────
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
