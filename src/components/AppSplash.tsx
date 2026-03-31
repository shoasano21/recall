import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSize, Spacing } from '../constants/theme';

type Props = {
  onFinish: () => void;
};

export default function AppSplash({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // フェードイン → 1.5秒待機 → フェードアウト
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1400),
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
      <View style={styles.content}>
        <Text style={styles.title}>Recall</Text>
        <Text style={styles.tagline}>大切な人のことを、もっと覚えていよう</Text>
      </View>
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
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
});
