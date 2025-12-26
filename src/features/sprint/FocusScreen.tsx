import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router'; // Assuming we can use this for navigation
import { useTaskStore } from '../../store/useTaskStore';
import { TaskSlider } from '../../components/features/tasks/TaskSlider';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export const FocusScreen = () => {
    const router = useRouter(); // If wrapped in Expo Router context
    const { currentSprint, tasks, rewards, score, rerollTask } = useTaskStore();

    // Derived State
    const sprintTasks = useMemo(() => {
        if (!currentSprint) return [];
        // Sort logic could go here, for now just matching IDs
        return tasks.filter((t) => currentSprint.taskIds.includes(t.id));
    }, [currentSprint, tasks]);

    const activeReward = useMemo(() => {
        if (!currentSprint?.rewardId) return null;
        return rewards.find((r) => r.id === currentSprint.rewardId);
    }, [currentSprint, rewards]);

    const progress = useMemo(() => {
        if (!activeReward || activeReward.cost === 0) return 0;
        return Math.min(score / activeReward.cost, 1);
    }, [score, activeReward]);

    const isRewardUnlocked = progress >= 1;

    const handleInitialize = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to Chat (Tab 2)
        // Assuming typical Expo Router tab structure: /chat or /(tabs)/chat
        // For now we just log, or try to push if router exists.
        try {
            router.push('/chat');
        } catch (e) {
            console.log('Navigation not ready');
        }
    };

    // --- Render Empty State ---
    if (!currentSprint || currentSprint.state === 'completed') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyTitle}>NO SIGNAL</Text>
                    <Text style={styles.emptySubtitle}>System waiting for input.</Text>

                    <TouchableOpacity
                        style={styles.initButton}
                        onPress={handleInitialize}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.initButtonText}>INITIALIZE ASSISTANT</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // --- Render Active Cockpit ---
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.overline}>CURRENT SPRINT</Text>
            </View>

            {/* Task Stack */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {sprintTasks.map((task, index) => (
                    <Animated.View
                        key={task.id}
                        entering={FadeInDown.delay(index * 100).springify()}
                        layout={Layout.springify()}
                        style={styles.taskWrapper}
                    >
                        {/* Task Label above slider */}
                        <View style={styles.taskLabelRow}>
                            <TouchableOpacity onPress={() => rerollTask(task.id)} style={styles.rerollButton} activeOpacity={0.6}>
                                <Text style={styles.rerollIcon}>↺</Text>
                            </TouchableOpacity>
                            <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                            <View style={[
                                styles.complexityDot,
                                { backgroundColor: getComplexityColor(task.complexity) }
                            ]} />
                        </View>

                        <TaskSlider taskId={task.id} />
                    </Animated.View>
                ))}
            </ScrollView>

            {/* Footer: Reward Container */}
            <Animated.View entering={FadeIn.delay(400)} style={styles.footer}>
                <View style={[
                    styles.rewardCard,
                    isRewardUnlocked && styles.rewardCardUnlocked
                ]}>
                    <View style={styles.rewardHeader}>
                        <View style={styles.rewardContent}>
                            <Text style={styles.rewardLabel}>TARGET REWARD</Text>
                            <Text style={styles.rewardTitle}>
                                {isRewardUnlocked
                                    ? (activeReward?.title || 'Unknown Reward')
                                    : `LOCKED ${activeReward?.tier?.toUpperCase() || ''} REWARD`
                                }
                            </Text>
                        </View>
                        {isRewardUnlocked && (
                            <TouchableOpacity style={styles.rerollRewardButton}>
                                <Text style={styles.rerollRewardText}>REROLL</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Energy Meter */}
                    <View style={styles.meterContainer}>
                        <View style={[styles.meterBar, { width: `${progress * 100}%` }, isRewardUnlocked && styles.meterBarFull]} />
                    </View>
                    <Text style={styles.scoreText}>
                        {score} / {activeReward?.cost || '-'} ENERGY
                    </Text>
                </View>
            </Animated.View>

        </SafeAreaView>
    );
};

// Helper for complexity dots
const getComplexityColor = (c: number) => {
    if (c === 1) return '#4CD964'; // Green
    if (c === 2) return '#FFCC00'; // Yellow
    return '#FF3B30'; // Red
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8', // "Airy" light mode
    },
    header: {
        paddingTop: 20,
        paddingBottom: 10,
        alignItems: 'center',
    },
    overline: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#A0A0A0',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
        gap: 32, // Airy spacing
        paddingBottom: 150, // Space for footer
    },
    taskWrapper: {
        marginBottom: 8,
    },
    taskLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    complexityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Footer / Reward
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
    },
    rewardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    rewardCardUnlocked: {
        borderColor: '#FFD700',
        borderWidth: 2,
    },
    rewardContent: {
        marginBottom: 12,
    },
    rewardLabel: {
        fontSize: 10,
        color: '#888',
        fontWeight: '700',
        marginBottom: 4,
    },
    rewardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    meterContainer: {
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    meterBar: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    meterBarFull: {
        backgroundColor: '#FFD700',
    },
    scoreText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        fontVariant: ['tabular-nums'],
    },
    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#E0E0E0',
        letterSpacing: 4,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 32,
    },
    initButton: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
    },
    initButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    // Reroll & Helpers
    rerollButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rerollIcon: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    rerollRewardButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF'
    },
    rerollRewardText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5
    }
});
