export type Person = {
  id: string;
  name: string;
  organization?: string;
  relationship?: string;
  photoUri?: string;
  hobby?: string;
  hometown?: string;
  highSchool?: string;
  note?: string;
  tags: string[];
  nextMeetingDate?: string; // ISO date string (YYYY-MM-DD)
  nextMeetingNotificationId?: string; // expo-notifications identifier
  createdAt: string;
  updatedAt: string;
};

export type ConversationLog = {
  id: string;
  personId: string;
  date: string;
  isOnline: boolean;
  location?: string;
  content: string;
  createdAt: string;
};

export type Schedule = {
  id: string;
  personId: string;
  date: string; // ISO datetime string
  note?: string;
  notificationId?: string; // expo-notifications identifier
  source?: 'nextMeeting'; // 'nextMeeting' = 「次に会う日」から自動生成された予定
  createdAt: string;
};
