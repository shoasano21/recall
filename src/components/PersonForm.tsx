import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Person } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { usePersonStore } from '../store/personStore';
import TagInput from './TagInput';

type FormData = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

type Props = {
  mode: 'new' | 'edit';
  initialValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function PersonForm({ mode, initialValues = {}, onSubmit, onDelete }: Props) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [organization, setOrganization] = useState(initialValues.organization ?? '');
  const [relationship, setRelationship] = useState(initialValues.relationship ?? '');
  const [hobby, setHobby] = useState(initialValues.hobby ?? '');
  const [hometown, setHometown] = useState(initialValues.hometown ?? '');
  const [note, setNote] = useState(initialValues.note ?? '');
  const [tags, setTags] = useState<string[]>(initialValues.tags ?? []);
  const [photoUri, setPhotoUri] = useState<string | undefined>(initialValues.photoUri);
  const [nextMeetingDate, setNextMeetingDate] = useState<string | undefined>(initialValues.nextMeetingDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const allPersons = usePersonStore((s) => s.persons);
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    allPersons.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allPersons]);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const focus = (field: string) => () => setFocusedField(field);
  const blur = () => setFocusedField(null);
  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', '写真を選択するには、設定からカメラロールへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('名前を入力してください');
      return;
    }
    setNameError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        organization: organization.trim() || undefined,
        relationship: relationship.trim() || undefined,
        hobby: hobby.trim() || undefined,
        hometown: hometown.trim() || undefined,
        note: note.trim() || undefined,
        tags,
        photoUri,
        nextMeetingDate,
      });
    } finally {
      setIsSubmitting(false);
    }
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
        {/* プロフィール写真 */}
        <View style={styles.photoSection}>
          <Pressable onPress={pickImage} style={({ pressed }) => [styles.photoButton, pressed && { opacity: 0.8 }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={28} color={Colors.textSecondary} />
                <Text style={styles.photoHint}>写真を追加</Text>
              </View>
            )}
          </Pressable>
          {photoUri && (
            <Pressable onPress={() => setPhotoUri(undefined)} hitSlop={8}>
              <Text style={styles.removePhotoText}>写真を削除</Text>
            </Pressable>
          )}
        </View>

        {/* 基本情報 */}
        <Text style={styles.sectionTitle}>基本情報</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>
              名前<Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              style={inputStyle('name')}
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (v.trim()) setNameError('');
              }}
              onFocus={focus('name')}
              onBlur={blur}
              placeholder="例：田中 誠"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
              autoCorrect={false}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.label}>所属</Text>
            <TextInput
              style={inputStyle('organization')}
              value={organization}
              onChangeText={setOrganization}
              onFocus={focus('organization')}
              onBlur={blur}
              placeholder="例：株式会社○○、△△大学"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.label}>関係性</Text>
            <TextInput
              style={inputStyle('relationship')}
              value={relationship}
              onChangeText={setRelationship}
              onFocus={focus('relationship')}
              onBlur={blur}
              placeholder="例：同期、上司、取引先"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.label}>タグ</Text>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={existingTags}
            />
          </View>
        </View>

        {/* 次に会う日 */}
        <Text style={styles.sectionTitle}>リマインダー</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>次に会う日</Text>
            <Pressable
              style={styles.dateRow}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={nextMeetingDate ? styles.dateText : styles.datePlaceholder}>
                {nextMeetingDate
                  ? (() => { const d = new Date(nextMeetingDate); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`; })()
                  : '日付を選択'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
            </Pressable>
            {nextMeetingDate && (
              <Pressable onPress={() => setNextMeetingDate(undefined)} hitSlop={8} style={styles.clearDate}>
                <Text style={styles.clearDateText}>クリア</Text>
              </Pressable>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={nextMeetingDate ? new Date(nextMeetingDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setNextMeetingDate(date.toISOString().slice(0, 10));
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* 詳細情報 */}
        <Text style={styles.sectionTitle}>詳細情報</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>趣味・特技</Text>
            <TextInput
              style={inputStyle('hobby')}
              value={hobby}
              onChangeText={setHobby}
              onFocus={focus('hobby')}
              onBlur={blur}
              placeholder="例：ゴルフ、読書"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.label}>出身地</Text>
            <TextInput
              style={inputStyle('hometown')}
              value={hometown}
              onChangeText={setHometown}
              onFocus={focus('hometown')}
              onBlur={blur}
              placeholder="例：東京都、大阪府"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>その他メモ</Text>
              <Text style={styles.hint}>Markdown 対応</Text>
            </View>
            <TextInput
              style={[inputStyle('note'), styles.noteInput]}
              value={note}
              onChangeText={setNote}
              onFocus={focus('note')}
              onBlur={blur}
              placeholder={'自由にメモを書いてください...\n\n**太字** や - リストも使えます'}
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* 保存・削除ボタン（固定） */}
      <View style={styles.footer}>
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

        {mode === 'edit' && onDelete && (
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              isDeleting && styles.buttonDisabled,
              pressed && !isDeleting && styles.deleteButtonPressed,
            ]}
            onPress={() => {
              Alert.alert(
                `${initialValues.name ?? 'この人物'}さんを削除しますか？`,
                '会話ログもすべて削除されます。',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: '削除する',
                    style: 'destructive',
                    onPress: async () => {
                      setIsDeleting(true);
                      try {
                        await onDelete();
                      } finally {
                        setIsDeleting(false);
                      }
                    },
                  },
                ]
              );
            }}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={Colors.danger} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={styles.deleteButtonText}>
                  {initialValues.name ? `${initialValues.name}さんを削除` : 'この人物を削除'}
                </Text>
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

  // 写真
  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  photoButton: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  photo: {
    width: 96,
    height: 96,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  removePhotoText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  datePlaceholder: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  clearDate: {
    marginTop: Spacing.xs,
  },
  clearDateText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  required: {
    color: Colors.accent,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.border,
    fontStyle: 'italic',
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
  noteInput: {
    minHeight: 120,
    paddingTop: Spacing.xs,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
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
    marginTop: Spacing.xs,
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
