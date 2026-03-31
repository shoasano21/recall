import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { PRESET_TAGS } from '../constants/tags';

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[]; // 後方互換のために残す（未使用）
};

export default function TagInput({ value, onChange }: Props) {
  const [input, setInput] = useState('');

  const togglePreset = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const addCustom = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
  };

  const removeCustom = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  // 固定タグ以外の選択済みタグ（カスタム）
  const customTags = value.filter((t) => !PRESET_TAGS.includes(t));

  return (
    <View style={styles.container}>
      {/* 固定タグチップ一覧 */}
      <View style={styles.presetGrid}>
        {PRESET_TAGS.map((tag) => {
          const selected = value.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => togglePreset(tag)}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipSelected : styles.chipUnselected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 自由入力欄 */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addCustom}
          placeholder="カスタムタグを追加..."
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        {input.trim().length > 0 && (
          <Pressable
            onPress={addCustom}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.addButtonText}>追加</Text>
          </Pressable>
        )}
      </View>

      {/* 追加済みカスタムタグ */}
      {customTags.length > 0 && (
        <View style={styles.customRow}>
          {customTags.map((tag) => (
            <View key={tag} style={styles.customChip}>
              <Text style={styles.customChipText}>{tag}</Text>
              <Pressable onPress={() => removeCustom(tag)} hitSlop={4}>
                <Ionicons name="close" size={13} color={Colors.accent} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipUnselected: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: Colors.white,
  },
  chipTextUnselected: {
    color: Colors.textSecondary,
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
  customRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tagBackground,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  customChipText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
});
