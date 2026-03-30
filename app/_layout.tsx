import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { usePersonStore } from '../src/store/personStore';
import { useLogStore } from '../src/store/logStore';
import { Colors } from '../src/constants/theme';
import AppSplash from '../src/components/AppSplash';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    (async () => {
      await Promise.all([
        usePersonStore.getState().load(),
        useLogStore.getState().load(),
      ]);
      await Promise.all([
        usePersonStore.getState().seedIfEmpty(),
        useLogStore.getState().seedIfEmpty(),
      ]);
    })();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Karte' }} />
        <Stack.Screen name="person/new" options={{ title: '人物を追加', presentation: 'modal' }} />
        <Stack.Screen name="person/[id]/index" options={{ title: '詳細' }} />
        <Stack.Screen name="person/[id]/edit" options={{ title: '編集', presentation: 'modal' }} />
        <Stack.Screen name="person/[id]/log/new" options={{ title: '会話を追加', presentation: 'modal' }} />
        <Stack.Screen name="person/[id]/log/[logId]" options={{ title: '会話を編集', presentation: 'modal' }} />
      </Stack>
      {showSplash && <AppSplash onFinish={() => setShowSplash(false)} />}
    </>
  );
}
