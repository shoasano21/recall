export type Person = {
  id: string;
  name: string;
  organization?: string;
  relationship?: string;
  photoUri?: string;
  hobby?: string;
  hometown?: string;
  note?: string;
  tags: string[];
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
