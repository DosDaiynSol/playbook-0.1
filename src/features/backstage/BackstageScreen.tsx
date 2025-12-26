import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/useTaskStore';
import { CompactTaskItem } from '../../components/features/tasks/CompactTaskItem';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const BackstageScreen = () => {
    const { tasks, rewards, currentSprint, toggleTaskStatus, rerollTask } = useTaskStore();
    const [viewMode, setViewMode] = useState<'tasks' | 'rewards'>('tasks');

    // Filter pending tasks that are NOT in the active sprint (true backlog)
    const pendingTasks = tasks.filter(t => {
        const isPending = t.status === 'pending';
        const notInSprint = !currentSprint || !currentSprint.taskIds.includes(t.id);
        return isPending && notInSprint;
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Inventory</Text>
                <Text style={styles.subtitle}>Your task and reward backlog</Text>
            </View>

            <View style={styles.segmentContainer}>
                <TouchableOpacity
                    onPress={() => setViewMode('tasks')}
                    style={[styles.segment, viewMode === 'tasks' && styles.activeSegment]}
                >
                    <Text style={[styles.segmentText, viewMode === 'tasks' && styles.activeSegmentText]}>
                        Tasks
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setViewMode('rewards')}
                    style={[styles.segment, viewMode === 'rewards' && styles.activeSegment]}
                >
                    <Text style={[styles.segmentText, viewMode === 'rewards' && styles.activeSegmentText]}>
                        Rewards
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {viewMode === 'tasks' ? (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Backlog</Text>
                            <Text style={styles.sectionCount}>{pendingTasks.length} tasks</Text>
                        </View>
                        {pendingTasks.length === 0 ? (
                            <Animated.View entering={FadeInDown} style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>📦</Text>
                                <Text style={styles.emptyText}>No tasks in backlog</Text>
                                <Text style={styles.emptySubtext}>
                                    Tasks not in active sprint will appear here
                                </Text>
                            </Animated.View>
                        ) : (
                            pendingTasks.map((task, index) => (
                                <Animated.View key={task.id} entering={FadeInDown.delay(index * 50)}>
                                    <CompactTaskItem
                                        task={task}
                                        onToggle={toggleTaskStatus}
                                        onRegenerate={rerollTask}
                                    />
                                </Animated.View>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Rewards Vault</Text>
                            <Text style={styles.sectionCount}>{rewards.length} rewards</Text>
                        </View>
                        {rewards.length === 0 ? (
                            <Animated.View entering={FadeInDown} style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🎁</Text>
                                <Text style={styles.emptyText}>No rewards yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Create rewards to motivate your progress
                                </Text>
                            </Animated.View>
                        ) : (
                            rewards.map((reward, index) => (
                                <Animated.View
                                    key={reward.id}
                                    entering={FadeInDown.delay(index * 50)}
                                    style={styles.rewardCard}
                                >
                                    <View style={styles.rewardContent}>
                                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                                        <View style={styles.rewardMeta}>
                                            <View style={[styles.tierBadge, getTierStyle(reward.tier)]}>
                                                <Text style={styles.tierText}>{reward.tier}</Text>
                                            </View>
                                            <Text style={styles.rewardCost}>{reward.cost} ⚡</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const getTierStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
        case 'premium':
            return { backgroundColor: '#FFD700' };
        case 'standard':
            return { backgroundColor: '#2196F3' };
        default:
            return { backgroundColor: '#9E9E9E' };
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#757575',
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    activeSegment: {
        backgroundColor: '#2196F3',
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
    },
    activeSegmentText: {
        color: '#FFFFFF',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212121',
    },
    sectionCount: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    rewardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rewardContent: {
        gap: 8,
    },
    rewardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
    },
    rewardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tierBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tierText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    rewardCost: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
    },
});
