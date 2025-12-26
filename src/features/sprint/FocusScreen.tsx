import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuth } from '../../contexts/AuthContext';
import { CompactTaskItem } from '../../components/features/tasks/CompactTaskItem';
import { Task } from '../../types';
import * as Haptics from 'expo-haptics';

export const FocusScreen = () => {
    const router = useRouter();
    const { signOut } = useAuth();
    const { currentSprint, tasks, rewards, score, toggleTaskStatus, rerollTask } = useTaskStore();

    const today = new Date();
    const monthName = today.toLocaleString('en-US', { month: 'long' });
    const dayNum = today.getDate();
    const year = today.getFullYear();

    const weekDays = useMemo(() => {
        const days = [];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push({
                day: date.toLocaleString('en-US', { weekday: 'short' }),
                date: date.getDate(),
                isToday: date.toDateString() === today.toDateString()
            });
        }
        return days;
    }, []);

    const sprintTasks = useMemo(() => {
        if (!currentSprint) return [];
        return currentSprint.taskIds
            .map(id => tasks.find(t => t.id === id))
            .filter((t): t is Task => t !== undefined);
    }, [currentSprint, tasks]);

    const timelineTasks = useMemo(() => {
        return sprintTasks.map((task, index) => ({
            ...task,
            time: `${9 + index * 2}:00 ${9 + index * 2 < 12 ? 'AM' : 'PM'}`,
            isActive: index === sprintTasks.findIndex(t => t.status === 'pending')
        }));
    }, [sprintTasks]);

    const activeReward = useMemo(() => {
        if (!currentSprint?.rewardId) return null;
        return rewards.find((r) => r.id === currentSprint.rewardId);
    }, [currentSprint, rewards]);

    const handleCheckTask = async (taskId: string) => {
        await toggleTaskStatus(taskId);
    };

    const handleRegenTask = async (taskId: string) => {
        await rerollTask(taskId);
    };

    const handleSignOut = async () => {
        await signOut();
    };

    // Empty State
    if (!currentSprint || currentSprint.state === 'completed') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyStateContainer}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>📖</Text>
                    </Animated.View>
                    <Animated.Text entering={FadeIn.delay(200)} style={styles.emptyTitle}>
                        No Active Sprint
                    </Animated.Text>
                    <Animated.Text entering={FadeIn.delay(300)} style={styles.emptySubtitle}>
                        Start a conversation with the AI to create your daily timeline
                    </Animated.Text>
                    <Animated.View entering={FadeInUp.delay(400).springify()}>
                        <TouchableOpacity
                            style={styles.initButton}
                            onPress={() => router.push('/chat')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.initButtonText}>Open Assistant</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={true}>
                <Animated.View entering={FadeIn} style={styles.mainCard}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.dateText}>{monthName} {dayNum}, {year}</Text>
                            <Text style={styles.todayText}>Playbook</Text>
                        </View>
                        <TouchableOpacity onPress={handleSignOut} style={styles.signOutIconButton}>
                            <Text style={styles.signOutIconText}>⎋</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Week Calendar Strip */}
                    <View style={styles.weekStrip}>
                        {weekDays.map((day, index) => (
                            <View key={index} style={styles.dayItem}>
                                <Text style={[styles.dayName, day.isToday && styles.dayNameActive]}>
                                    {day.day}
                                </Text>
                                <View style={[styles.dayNumber, day.isToday && styles.dayNumberActive]}>
                                    <Text style={[styles.dayNumberText, day.isToday && styles.dayNumberTextActive]}>
                                        {day.date}
                                    </Text>
                                </View>
                                {day.isToday && <View style={styles.todayDot} />}
                            </View>
                        ))}
                    </View>

                    {/* Tasks List */}
                    <View style={styles.tasksList}>
                        <Text style={styles.tasksHeader}>Today's Focus</Text>
                        {timelineTasks.map((task) => (
                            <CompactTaskItem
                                key={task.id}
                                task={task}
                                onToggle={handleCheckTask}
                                onRegenerate={handleRegenTask}
                                isActive={task.isActive}
                                showTime={task.time}
                            />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                        <Text style={styles.addButtonText}>+ Add Task</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Reward Card */}
                {activeReward && (
                    <Animated.View entering={FadeInUp.delay(400)} style={styles.rewardCard}>
                        <View style={styles.rewardHeader}>
                            <Text style={styles.rewardLabel}>🎯 Sprint Goal</Text>
                            <Text style={styles.rewardTitle}>{activeReward.title}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[styles.progressFill, { width: `${Math.min((score / activeReward.cost) * 100, 100)}%` }]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {score} / {activeReward.cost} energy earned
                        </Text>
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    mainCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    dateText: { fontSize: 14, color: '#9E9E9E', marginBottom: 4 },
    todayText: { fontSize: 28, fontWeight: '700', color: '#212121' },
    signOutIconButton: { padding: 8 },
    signOutIconText: { fontSize: 24, color: '#757575' },
    weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    dayItem: { alignItems: 'center' },
    dayName: { fontSize: 12, color: '#9E9E9E', marginBottom: 8, fontWeight: '500' },
    dayNameActive: { color: '#2196F3', fontWeight: '600' },
    dayNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    dayNumberActive: { backgroundColor: '#E3F2FD' },
    dayNumberText: { fontSize: 14, color: '#424242', fontWeight: '600' },
    dayNumberTextActive: { color: '#2196F3', fontWeight: '700' },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2196F3', marginTop: 4 },
    tasksList: { marginBottom: 20 },
    tasksHeader: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 16 },
    addButton: { backgroundColor: '#2196F3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    addButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
    rewardCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    rewardHeader: { marginBottom: 16 },
    rewardLabel: { fontSize: 12, color: '#9E9E9E', marginBottom: 4, fontWeight: '600' },
    rewardTitle: { fontSize: 18, fontWeight: '700', color: '#212121' },
    progressBar: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
    progressText: { fontSize: 13, color: '#757575', textAlign: 'right' },
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    emptyIcon: { fontSize: 40 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: '#212121', marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 15, color: '#757575', marginBottom: 32, textAlign: 'center', lineHeight: 22 },
    initButton: { backgroundColor: '#2196F3', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28, shadowColor: '#2196F3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    initButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    signOutButton: { marginTop: 16, padding: 16 },
    signOutText: { color: '#757575', fontSize: 14, fontWeight: '500' },
});
