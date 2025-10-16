import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MessageProvider } from '@/contexts/MessageContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <MessageProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </MessageProvider>
    </AuthProvider>
  );
}
