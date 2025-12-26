import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    const initialize = useTaskStore(state => state.initialize);

    useEffect(() => {
        // Initialize auth listener and fetch data
        initialize();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
