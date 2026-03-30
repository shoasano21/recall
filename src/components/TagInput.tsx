import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[]; // 既存タグ全件（フィルタリングは内部で行う）
};

export default function TagInput({ value, onChange, suggestions }: Props) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const addFromSuggestion = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
  };

  // まだ追加していない候補。入力中なら前方一致でフィルタ
  const visibleSuggestions = useMemo(() => {
    const available = suggestions.filter((s) => !value.includes(s));
    if (!input.trim()) return available;
    return available.filter((s) => s.includes(input.trim()));
  }, [suggestions, value, input]);

  return (
    <View style={styles.container}>
      {/* 追加済みタグ */}
      {value.length > 0 && (
        <View style={styles.chipRow}>
          {value.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
              <Pressable onPress={() => removeTag(tag)} hitSlop={4}>
                <Ionicons name="close" size={13} color={Colors.accent} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* 入力行 */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTag}
          placeholder="タグを入力..."
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        {input.trim().length > 0 && (
          <Pressable
            onPress={addTag}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.addButtonText}>追加</Text>
          </Pressable>
        )}
      </View>

      {/* サジェスト */}
      {visibleSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestions}
          keyboardShouldPersistTaps="handled"
        >
          {visibleSuggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => addFromSuggestion(s)}
              style={({ pressed }) => [styles.suggestionChip, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="add" size={12} color={Colors.textSecondary} />
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tagBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  addButtonText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '600',
  },
  suggestions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: 2,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
