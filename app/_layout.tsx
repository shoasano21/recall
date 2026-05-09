import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Raleway_700Bold } from '@expo-google-fonts/raleway';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { usePersonStore } from '../src/store/personStore';
import { useLogStore } from '../src/store/logStore';
import { useScheduleStore } from '../src/store/scheduleStore';
import { Colors } from '../src/constants/theme';
import AppSplash from '../src/components/AppSplash';
import { requestNotificationPermission } from '../src/utils/notifications';

// 通知ハンドラー設定（フォアグラウンド中も通知を表示）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Expo のネイティブスプラッシュをフォントロード完了まで維持
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({ Raleway_700Bold, CormorantGaramond_600SemiBold });

  // hideAsync は AppSplash の onReady（useLayoutEffect）で呼ぶため、ここでは不要

  useEffect(() => {
    (async () => {
      await Promise.all([
        usePersonStore.getState().load(),
        useLogStore.getState().load(),
        useScheduleStore.getState().load(),
      ]);
      await Promise.all([
        usePersonStore.getState().seedIfEmpty(),
        useLogStore.getState().seedIfEmpty(),
      ]);
      // 通知権限をリクエスト
      await requestNotificationPermission();
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#5B8CFF' }}>
      {fontsLoaded && (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.white },
            headerTintColor: Colors.textPrimary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerTitle: '' }} />
          <Stack.Screen name="person/new" options={{ title: '人物を追加', presentation: 'modal' }} />
          <Stack.Screen name="person/[id]/index" options={{ title: '詳細' }} />
          <Stack.Screen name="person/[id]/edit" options={{ title: '編集', presentation: 'modal' }} />
          <Stack.Screen name="person/[id]/log/new" options={{ title: '会話を追加', presentation: 'modal' }} />
          <Stack.Screen name="person/[id]/log/[logId]" options={{ title: '会話を編集', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: '設定' }} />
          <Stack.Screen name="schedule" options={{ title: 'カレンダー' }} />
          <Stack.Screen name="schedule/new" options={{ title: '予定を追加', presentation: 'modal' }} />
          <Stack.Screen name="schedule/[id]/index" options={{ title: '予定の詳細' }} />
          <Stack.Screen name="schedule/[id]/edit" options={{ title: '予定を編集', presentation: 'modal' }} />
        </Stack>
      )}
      {fontsLoaded && showSplash && (
        <AppSplash onFinish={() => setShowSplash(false)} />
      )}
    </View>
  );
}
