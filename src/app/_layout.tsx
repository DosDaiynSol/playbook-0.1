import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Protected routing logic
function RootNavigator() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const initialize = useTaskStore(state => state.initialize);

    useEffect(() => {
        // Initialize task store
        initialize();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!user && !inAuthGroup) {
            // Redirect to sign in if not authenticated
            router.replace('/auth/signin');
        } else if (user && inAuthGroup) {
            // Redirect to app if authenticated
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <StatusBar style="dark" />
                    <RootNavigator />
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
