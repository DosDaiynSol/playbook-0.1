import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, Reward } from '../../types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const FocusScreen = () => {
    const { tasks, currentSprint, rewards, toggleTaskStatus, rerollTask } = useTaskStore();

    // Get sprint tasks
    const sprintTasks = useMemo(() => {
        if (!currentSprint) return [];
        return currentSprint.taskIds
            .map(id => tasks.find(t => t.id === id))
            .filter((t): t is Task => t !== undefined);
    }, [currentSprint, tasks]);

    // Get reward for sprint
    const sprintReward = useMemo(() => {
        if (!currentSprint?.rewardId) return null;
        return rewards.find(r => r.id === currentSprint.rewardId) || null;
    }, [currentSprint, rewards]);

    // Build timeline: groups of 3 tasks + 1 reward
    const timeline = useMemo(() => {
        const items: Array<{ type: 'task' | 'reward'; data: Task | Reward; groupIndex: number }> = [];

        sprintTasks.forEach((task, index) => {
            const groupIndex = Math.floor(index / 3);
            items.push({ type: 'task', data: task, groupIndex });

            // After every 3 tasks, add reward
            if ((index + 1) % 3 === 0 && sprintReward) {
                items.push({ type: 'reward', data: sprintReward, groupIndex });
            }
        });

        return items;
    }, [sprintTasks, sprintReward]);

    // Check if current group is completed
    const isGroupCompleted = (groupIndex: number) => {
        const groupTasks = sprintTasks.slice(groupIndex * 3, (groupIndex + 1) * 3);
        return groupTasks.every(t => t.status === 'completed');
    };

    if (!currentSprint) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>No Active Sprint</Text>
                    <Text style={styles.emptyText}>
                        Deploy a sprint from the Assistant tab
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Today's Focus</Text>
                <Text style={styles.headerSubtitle}>{sprintTasks.length} tasks in timeline</Text>
            </View>

            {/* Timeline */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.timeline}
                showsVerticalScrollIndicator={false}
            >
                {timeline.map((item, index) => {
                    if (item.type === 'task') {
                        return (
                            <TimelineTask
                                key={`task-${(item.data as Task).id}`}
                                task={item.data as Task}
                                index={index}
                                onToggle={toggleTaskStatus}
                                onRegenerate={rerollTask}
                            />
                        );
                    } else {
                        const canClaim = isGroupCompleted(item.groupIndex);
                        return (
                            <TimelineReward
                                key={`reward-${item.groupIndex}`}
                                reward={item.data as Reward}
                                canClaim={canClaim}
                                index={index}
                            />
                        );
                    }
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

// ==================== TIMELINE TASK COMPONENT ====================

interface TimelineTaskProps {
    task: Task;
    index: number;
    onToggle: (id: string) => void;
    onRegenerate: (id: string) => void;
}

const TimelineTask: React.FC<TimelineTaskProps> = ({ task, index, onToggle, onRegenerate }) => {
    const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
    const isCompleted = task.status === 'completed';

    const handleWeightPress = (weight: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedWeight(weight === selectedWeight ? null : weight);
    };

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle(task.id);
    };

    const handleRegen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRegenerate(task.id);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50)}
            style={styles.timelineItem}
        >
            {/* Timeline Connector */}
            <View style={styles.connectorContainer}>
                <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
                <TouchableOpacity
                    style={[styles.dot, isCompleted && styles.dotCompleted]}
                    onPress={handleToggle}
                    activeOpacity={0.7}
                >
                    {isCompleted && <Text style={styles.dotCheck}>✓</Text>}
                </TouchableOpacity>
            </View>

            {/* Task Card */}
            <View style={[styles.card, isCompleted && styles.cardCompleted]}>
                {/* Regen Button */}
                {!isCompleted && (
                    <TouchableOpacity
                        style={styles.regenBtn}
                        onPress={handleRegen}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.regenIcon}>↻</Text>
                    </TouchableOpacity>
                )}

                {/* Task Content */}
                <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                        {task.title}
                    </Text>

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{task.contextTag}</Text>
                        </View>
                    </View>
                </View>

                {/* Weight Pills */}
                <View style={styles.weightContainer}>
                    {[1, 2, 3].map(weight => (
                        <TouchableOpacity
                            key={weight}
                            style={[
                                styles.weightPill,
                                weight <= task.complexity && styles.weightPillActive,
                                weight === selectedWeight && styles.weightPillSelected,
                            ]}
                            onPress={() => handleWeightPress(weight)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.weightText,
                                weight <= task.complexity && styles.weightTextActive,
                                weight === selectedWeight && styles.weightTextSelected,
                            ]}>
                                {weight}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Animated.View>
    );
};

// ==================== TIMELINE REWARD COMPONENT ====================

interface TimelineRewardProps {
    reward: Reward;
    canClaim: boolean;
    index: number;
}

const TimelineReward: React.FC<TimelineRewardProps> = ({ reward, canClaim, index }) => {
    const handleClaim = () => {
        if (!canClaim) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // TODO: Implement claim logic
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50)}
            style={styles.timelineItem}
        >
            {/* Timeline Connector */}
            <View style={styles.connectorContainer}>
                <View style={[styles.connector, styles.connectorReward]} />
                <View style={[styles.dot, styles.dotReward]}>
                    <Text style={styles.dotRewardIcon}>🎁</Text>
                </View>
            </View>

            {/* Reward Card */}
            <TouchableOpacity
                style={[
                    styles.card,
                    styles.rewardCard,
                    canClaim && styles.rewardCardUnlocked,
                ]}
                onPress={handleClaim}
                activeOpacity={canClaim ? 0.7 : 1}
                disabled={!canClaim}
            >
                <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <View style={styles.rewardMeta}>
                        <View style={[styles.tierBadge, styles[`tier${reward.tier.charAt(0).toUpperCase() + reward.tier.slice(1)}`]]}>
                            <Text style={styles.tierText}>
                                {reward.tier.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.rewardCost}>⚡ {reward.cost}</Text>
                    </View>
                </View>

                {canClaim && (
                    <View style={styles.claimButton}>
                        <Text style={styles.claimButtonText}>CLAIM</Text>
                    </View>
                )}

                {!canClaim && (
                    <View style={styles.lockedBadge}>
                        <Text style={styles.lockedText}>🔒 Complete 3 tasks</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        padding: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#757575',
    },
    scrollView: {
        flex: 1,
    },
    timeline: {
        padding: 20,
        paddingTop: 0,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    connectorContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    connector: {
        position: 'absolute',
        top: 24,
        bottom: -16,
        width: 2,
        backgroundColor: '#E0E0E0',
    },
    connectorCompleted: {
        backgroundColor: '#4CAF50',
    },
    connectorReward: {
        backgroundColor: '#FFB300',
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginTop: 12,
    },
    dotCompleted: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    dotCheck: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    dotReward: {
        borderColor: '#FFB300',
        backgroundColor: '#FFFFFF',
    },
    dotRewardIcon: {
        fontSize: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardCompleted: {
        opacity: 0.6,
    },
    regenBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    regenIcon: {
        fontSize: 16,
        color: '#757575',
    },
    taskContent: {
        marginBottom: 12,
        paddingRight: 40, // Space for regen button
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
        lineHeight: 22,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#9E9E9E',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    tag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#616161',
        fontWeight: '500',
    },
    weightContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    weightPill: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    weightPillActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    weightPillSelected: {
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
    },
    weightText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9E9E9E',
    },
    weightTextActive: {
        color: '#2196F3',
    },
    weightTextSelected: {
        color: '#FFFFFF',
    },
    rewardCard: {
        backgroundColor: '#FFF3E0',
        borderWidth: 2,
        borderColor: '#FFE0B2',
    },
    rewardCardUnlocked: {
        backgroundColor: '#E8F5E9',
        borderColor: '#A5D6A7',
    },
    rewardContent: {
        marginBottom: 12,
    },
    rewardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 8,
    },
    rewardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tierBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tierBronze: {
        backgroundColor: '#D7CCC8',
    },
    tierSilver: {
        backgroundColor: '#CFD8DC',
    },
    tierGold: {
        backgroundColor: '#FFE082',
    },
    tierText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#212121',
    },
    rewardCost: {
        fontSize: 14,
        fontWeight: '600',
        color: '#616161',
    },
    claimButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    claimButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    lockedBadge: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    lockedText: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
    },
});
