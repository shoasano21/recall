import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ConversationLog } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

type FormData = Omit<ConversationLog, 'id' | 'personId' | 'createdAt'>;

type Props = {
  mode: 'new' | 'edit';
  initialValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function formatDisplayDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${y}年${m}月${d}日（${weekdays[date.getDay()]}）`;
}

export default function LogForm({ mode, initialValues = {}, onSubmit, onDelete }: Props) {
  const [date, setDate] = useState(
    initialValues.date ? new Date(initialValues.date) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);
  const [isOnline, setIsOnline] = useState(initialValues.isOnline ?? false);
  const [location, setLocation] = useState(initialValues.location ?? '');
  const [content, setContent] = useState(initialValues.content ?? '');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [contentError, setContentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selected) setDate(selected);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setContentError('内容を入力してください');
      return;
    }
    setContentError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        date: date.toISOString(),
        isOnline,
        location: isOnline ? undefined : location.trim() || undefined,
        content: content.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'この会話ログを削除しますか？',
      '削除すると元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete?.();
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── 日時 ── */}
        <Text style={styles.sectionTitle}>日時</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>会話した日</Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => [styles.androidDateButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.androidDateText}>{formatDisplayDate(date)}</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
            </Pressable>
          </View>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}
        </View>

        {/* ── 場所 ── */}
        <Text style={styles.sectionTitle}>場所</Text>
        <View style={styles.card}>
          {/* オンライン / オフライン トグル */}
          <View style={styles.fieldRow}>
            <Text style={styles.label}>形式</Text>
            <View style={styles.toggleGroup}>
              <Pressable
                style={[styles.toggleBtn, !isOnline && styles.toggleBtnActive]}
                onPress={() => setIsOnline(false)}
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={!isOnline ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.toggleText, !isOnline && styles.toggleTextActive]}>
                  オフライン
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, isOnline && styles.toggleBtnActive]}
                onPress={() => setIsOnline(true)}
              >
                <Ionicons
                  name="videocam-outline"
                  size={14}
                  color={isOnline ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.toggleText, isOnline && styles.toggleTextActive]}>
                  オンライン
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 場所テキスト（オフライン時のみ） */}
          {!isOnline && (
            <>
              <View style={styles.divider} />
              <View style={styles.fieldRow}>
                <Text style={styles.label}>場所</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'location' && styles.inputFocused,
                  ]}
                  value={location}
                  onChangeText={setLocation}
                  onFocus={() => setFocusedField('location')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="例：東京オフィス、〇〇カフェ"
                  placeholderTextColor={Colors.textSecondary}
                  returnKeyType="next"
                  autoCorrect={false}
                />
              </View>
            </>
          )}
        </View>

        {/* ── 会話内容 ── */}
        <Text style={styles.sectionTitle}>会話内容</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>
              内容<Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.contentInput,
                focusedField === 'content' && styles.inputFocused,
              ]}
              value={content}
              onChangeText={(v) => {
                setContent(v);
                if (v.trim()) setContentError('');
              }}
              onFocus={() => setFocusedField('content')}
              onBlur={() => setFocusedField(null)}
              placeholder="話した内容を記録しておきましょう..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
            {contentError ? <Text style={styles.errorText}>{contentError}</Text> : null}
          </View>
        </View>
      </ScrollView>

      {/* ── フッター（固定） ── */}
      <View style={styles.footer}>
        {/* 保存ボタン */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            isSubmitting && styles.buttonDisabled,
            pressed && !isSubmitting && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={isSubmitting || isDeleting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {mode === 'new' ? '追加する' : '保存する'}
            </Text>
          )}
        </Pressable>

        {/* 削除ボタン（編集時のみ） */}
        {mode === 'edit' && onDelete && (
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              isDeleting && styles.buttonDisabled,
              pressed && !isDeleting && styles.deleteButtonPressed,
            ]}
            onPress={handleDelete}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={Colors.danger} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={styles.deleteButtonText}>この会話ログを削除</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // セクション
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
    marginLeft: Spacing.md,
  },
  fieldRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.sm + 2,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  required: {
    color: Colors.accent,
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  inputFocused: {
    borderBottomColor: Colors.accent,
  },
  contentInput: {
    minHeight: 140,
    paddingTop: Spacing.xs,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
  },

  // 日付ピッカー
  androidDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  androidDateText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: '500',
  },

  // オンライン/オフライン トグル
  toggleGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  toggleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.white,
  },

  // フッター
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  deleteButtonPressed: {
    backgroundColor: '#FFF0F0',
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
