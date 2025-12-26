import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTaskStore } from '../store/useTaskStore';
import * as Haptics from 'expo-haptics';

export const resetApp = async () => {
    // 1. Clear Zustand Store state (in memory)
    useTaskStore.setState({
        tasks: [],
        rewards: [],
        currentSprint: null,
        score: 0,
    });

    // 2. Clear Persistence (Disk)
    await AsyncStorage.clear();

    // 3. Feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    console.log('--- APP RESET COMPLETE ---');
};
