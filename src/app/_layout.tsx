import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export default function RootLayout() {
    const fetchInitialData = useTaskStore(state => state.fetchInitialData);

    useEffect(() => {
        fetchInitialData();
    }, []);

    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaProvider>
    );
}
