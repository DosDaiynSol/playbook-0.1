import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

/**
 * Custom storage adapter to persist Supabase sessions.
 * 
 * - Uses `expo-secure-store` on iOS/Android for encryption.
 * - Uses `async-storage` (or localStorage) on Web.
 * - Handles large chunks for SecureStore if needed (though standard tokens fit).
 */
const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            return AsyncStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            return AsyncStorage.setItem(key, value);
        }
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            return AsyncStorage.removeItem(key);
        }
        return SecureStore.deleteItemAsync(key);
    },
};

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// For production, these should come from your .env file
// e.g. process.env.EXPO_PUBLIC_SUPABASE_URL
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://aidexphidrxcsyxazcpb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zMyErUj1L_Wg0s-D6GiLbQ_OWP_tiXF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Optional: Handle App State changes to refresh session if needed
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
