import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    runOnJS,
    Extrapolation,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../../store/useTaskStore';

interface TaskSliderProps {
    taskId: string;
}

const BUTTON_HEIGHT = 60;
const BUTTON_WIDTH = Dimensions.get('window').width - 40; // 20px padding on each side
const PADDING = 4;
const KNOB_SIZE = BUTTON_HEIGHT - PADDING * 2;
const MAX_SLIDE_OFFSET = BUTTON_WIDTH - KNOB_SIZE - PADDING * 2;

export const TaskSlider: React.FC<TaskSliderProps> = ({ taskId }) => {
    const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
    const offset = useSharedValue(0);
    const [completed, setCompleted] = useState(false);

    // Core Logic: Trigger completion
    const handleComplete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toggleTaskStatus(taskId);
        setCompleted(true);

        // Optional: Reset logic if it's toggle-able back
        // For now, we leave it in "completed" visual state
    };

    const pan = Gesture.Pan()
        .onBegin(() => {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((event) => {
            if (completed) return;
            // Clamp between 0 and MAX_SLIDE_OFFSET
            offset.value = Math.min(Math.max(event.translationX, 0), MAX_SLIDE_OFFSET);
        })
        .onEnd(() => {
            if (completed) return;
            if (offset.value > MAX_SLIDE_OFFSET * 0.8) {
                // Snap to end and complete
                offset.value = withSpring(MAX_SLIDE_OFFSET, { damping: 12, stiffness: 100 });
                runOnJS(handleComplete)();
            } else {
                // Snap back
                offset.value = withSpring(0);
            }
        });

    const animatedKnobStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: offset.value }],
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                offset.value,
                [0, MAX_SLIDE_OFFSET * 0.6],
                [1, 0],
                Extrapolation.CLAMP
            ),
        };
    });

    return (
        <View style={styles.container}>
            <GestureDetector gesture={pan}>
                <View style={styles.track}>
                    <Animated.View style={[styles.textContainer, animatedTextStyle]}>
                        <Text style={styles.text}>SLIDE TO POWER OFF</Text>
                    </Animated.View>
                    <Animated.View style={[styles.knob, animatedKnobStyle]}>
                        {/* Visual cue for the knob (e.g. arrow or icon) */}
                        <View style={styles.knobIndicator} />
                    </Animated.View>
                </View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        alignItems: 'center',
    },
    track: {
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        backgroundColor: '#2A2A2A', // Dark track
        borderRadius: BUTTON_HEIGHT / 2,
        justifyContent: 'center',
        padding: PADDING,
    },
    knob: {
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: KNOB_SIZE / 2,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        left: PADDING,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    knobIndicator: {
        width: 4,
        height: 16,
        borderRadius: 2,
        backgroundColor: '#DDD',
    },
    textContainer: {
        width: '100%',
        alignItems: 'center',
    },
    text: {
        color: '#888',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 1.2,
    },
});
