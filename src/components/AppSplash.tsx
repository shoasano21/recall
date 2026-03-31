import { useEffect, useLayoutEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSize, Spacing } from '../constants/theme';

type Props = {
  onReady: () => void; // マウント直後にネイティブスプラッシュを隠す
  onFinish: () => void;
};

export default function AppSplash({ onReady, onFinish }: Props) {
  // opacity 1 から開始 — ネイティブスプラッシュ非表示前に確実に見えている状態にする
  const opacity = useRef(new Animated.Value(1)).current;

  // useLayoutEffect はペイント前に同期実行される
  // ここで hideAsync() を呼ぶことでネイティブ→カスタムが途切れなくつながる
  useLayoutEffect(() => {
    onReady();
  }, []);

  useEffect(() => {
    // 1.8秒待機 → フェードアウト
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <LinearGradient
        colors={['#7AA8FF', '#5B8CFF']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={styles.content}>
        <Text style={styles.title}>Recall</Text>
        <Text style={styles.tagline}>大切な人のことを、もっと覚えていよう</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 64,
    fontFamily: 'Raleway_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
});
