import { useEffect, useLayoutEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { FontSize, Spacing } from '../constants/theme';

type Props = {
  onFinish: () => void;
};

export default function AppSplash({ onFinish }: Props) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // 描画完了を確実に待ってからネイティブスプラッシュを隠す
  // useLayoutEffect → 2回の requestAnimationFrame でレイアウト→ペイント後に hideAsync
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
    });
  }, []);

  useEffect(() => {
    Animated.sequence([
      // ネイティブスプラッシュと同じ #5B8CFF からグラデーションへ滑らかに変化
      Animated.timing(gradientOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // タイトルとセパレーターをふわっと表示
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dividerScale, {
          toValue: 1,
          duration: 800,
          delay: 300,
          useNativeDriver: true,
        }),
      ]),
      // タグラインを少し遅れて表示
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // ホールド
      Animated.delay(2200),
      // 全体フェードアウト
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
      pointerEvents="none"
    >
      {/* ネイティブスプラッシュと同じ単色 — 切替時の色差を消す */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#5B8CFF' }]} />
      {/* グラデーションをフェードイン */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity }]}>
        <LinearGradient
          colors={['#8FB4FF', '#5B8CFF', '#4877E6']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>Recall</Text>
        <Animated.View style={[styles.divider, { transform: [{ scaleX: dividerScale }] }]} />
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          大切な人のことを、もっと覚えていよう
        </Animated.Text>
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
  },
  title: {
    fontSize: 76,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  divider: {
    width: 56,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
    fontWeight: '300',
  },
});
