import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/useTaskStore';
import { Task } from '../../types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export const FocusScreen = () => {
    const router = useRouter();
    const {
        currentSprint,
        tasks,
        rewards,
        score,
        toggleTaskStatus,
        // Debug fields
        isLoading,
        session,
        userId,
        fetchInitialData,
        signInAnonymously,
        error
    } = useTaskStore();

    // Get current date info
    const today = new Date();
    const monthName = today.toLocaleString('en-US', { month: 'long' });
    const dayNum = today.getDate();
    const year = today.getFullYear();

    // Generate week days for the calendar strip
    const weekDays = useMemo(() => {
        const days = [];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

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

    // Derived State: Sprint Tasks
    const sprintTasks = useMemo(() => {
        if (!currentSprint) return [];
        return currentSprint.taskIds
            .map(id => tasks.find(t => t.id === id))
            .filter((t): t is Task => t !== undefined);
    }, [currentSprint, tasks]);

    // Organize tasks with time slots
    const timelineTasks = useMemo(() => {
        return sprintTasks.map((task, index) => ({
            ...task,
            // Generate time slots (9:00 AM, 11:00 AM, 2:00 PM, etc.)
            time: `${9 + index * 2}:00 ${9 + index * 2 < 12 ? 'AM' : 'PM'}`,
            isActive: index === sprintTasks.findIndex(t => t.status === 'pending')
        }));
    }, [sprintTasks]);

    const activeReward = useMemo(() => {
        if (!currentSprint?.rewardId) return null;
        return rewards.find((r) => r.id === currentSprint.rewardId);
    }, [currentSprint, rewards]);

    const handleCheckTask = async (taskId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await toggleTaskStatus(taskId);
    };

    const handleInitialize = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
                    <Animated.View entering={FadeInDown.springify()} style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>📅</Text>
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
                            onPress={handleInitialize}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.initButtonText}>Open Assistant</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    // --- Render Timeline ---
    return (
        <SafeAreaView style={styles.container}>
            {/* 🔧 DEBUG PANEL */}
            <View style={styles.debugPanel}>
                <Text style={styles.debugTitle}>🔍 DEBUG INFO</Text>
                <Text style={styles.debugText}>Status: {isLoading ? '⏳ Loading' : '✓ Idle'}</Text>
                <Text style={styles.debugText}>User ID: {userId || '❌ NO USER'}</Text>
                <Text style={styles.debugText}>Tasks Count: {tasks.length}</Text>
                <Text style={styles.debugText}>Sprint: {currentSprint ? '✓ Active' : '❌ None'}</Text>
                {error && <Text style={styles.debugError}>Error: {error}</Text>}

                <View style={styles.debugButtons}>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => fetchInitialData()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.debugButtonText}>🔄 Force Refresh</Text>
                    </TouchableOpacity>

                    {!userId && (
                        <TouchableOpacity
                            style={[styles.debugButton, styles.debugButtonPrimary]}
                            onPress={() => signInAnonymously()}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.debugButtonText, styles.debugButtonTextPrimary]}>
                                🔐 Sign In Anonymously
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Main Card Container */}
                <Animated.View entering={FadeIn} style={styles.mainCard}>
                    {/* Date Header */}
                    <Text style={styles.dateText}>{monthName} {dayNum}, {year}</Text>
                    <Text style={styles.todayText}>Today</Text>

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

                    {/* Timeline */}
                    <View style={styles.timeline}>
                        {timelineTasks.map((task, index) => (
                            <Animated.View
                                key={task.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                style={styles.timelineItem}
                            >
                                {/* Timeline Line & Indicator */}
                                <View style={styles.timelineLeftColumn}>
                                    {index > 0 && <View style={styles.timelineLine} />}
                                    <TouchableOpacity
                                        onPress={() => handleCheckTask(task.id)}
                                        style={[
                                            styles.timelineIndicator,
                                            task.status === 'completed' && styles.timelineIndicatorCompleted,
                                            task.isActive && styles.timelineIndicatorActive
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        {task.status === 'completed' && (
                                            <Text style={styles.checkMark}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                    {index < timelineTasks.length - 1 && <View style={styles.timelineLine} />}
                                </View>

                                {/* Task Content */}
                                <View style={styles.timelineContent}>
                                    <View style={[
                                        styles.taskItem,
                                        task.isActive && styles.taskItemActive,
                                        task.status === 'completed' && styles.taskItemCompleted
                                    ]}>
                                        <View style={styles.taskHeader}>
                                            <Text style={[
                                                styles.taskTitle,
                                                task.isActive && styles.taskTitleActive,
                                                task.status === 'completed' && styles.taskTitleCompleted
                                            ]}>
                                                {task.title}
                                            </Text>
                                            <Text style={[
                                                styles.taskTime,
                                                task.isActive && styles.taskTimeActive
                                            ]}>
                                                {task.time}
                                            </Text>
                                        </View>

                                        {/* Task Meta */}
                                        <View style={styles.taskMeta}>
                                            <View style={[
                                                styles.complexityBadge,
                                                { backgroundColor: getComplexityColor(task.complexity) }
                                            ]}>
                                                <Text style={styles.complexityText}>
                                                    {task.complexity === 1 ? 'Easy' : task.complexity === 2 ? 'Medium' : 'Hard'}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.contextTag,
                                                task.isActive && styles.contextTagActive
                                            ]}>
                                                {task.contextTag}
                                            </Text>
                                        </View>

                                        {/* Active task extra info */}
                                        {task.isActive && task.status !== 'completed' && (
                                            <View style={styles.activeTaskBadge}>
                                                <Text style={styles.activeTaskText}>← Current Focus</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Add Task Button */}
                    <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                        <Text style={styles.addButtonText}>+</Text>
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
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.min((score / activeReward.cost) * 100, 100)}%` }
                                ]}
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

// Helper for complexity colors
const getComplexityColor = (c: number) => {
    if (c === 1) return '#4CAF50';
    if (c === 2) return '#FF9800';
    return '#F44336';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    // Main Card
    mainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    // Date Header
    dateText: {
        fontSize: 14,
        color: '#9E9E9E',
        marginBottom: 4,
    },
    todayText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 24,
    },

    // Week Strip
    weekStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dayItem: {
        alignItems: 'center',
    },
    dayName: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 8,
        fontWeight: '500',
    },
    dayNameActive: {
        color: '#2196F3',
        fontWeight: '600',
    },
    dayNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayNumberActive: {
        backgroundColor: '#E3F2FD',
    },
    dayNumberText: {
        fontSize: 14,
        color: '#424242',
        fontWeight: '600',
    },
    dayNumberTextActive: {
        color: '#2196F3',
        fontWeight: '700',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#2196F3',
        marginTop: 4,
    },

    // Timeline
    timeline: {
        marginTop: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineLeftColumn: {
        width: 40,
        alignItems: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E0E0E0',
        minHeight: 20,
    },
    timelineIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    timelineIndicatorActive: {
        borderColor: '#2196F3',
        borderWidth: 3,
        backgroundColor: '#2196F3',
    },
    timelineIndicatorCompleted: {
        borderColor: '#4CAF50',
        backgroundColor: '#4CAF50',
    },
    checkMark: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Task Content
    timelineContent: {
        flex: 1,
        marginLeft: 16,
        marginBottom: 16,
    },
    taskItem: {
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    taskItemActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    taskItemCompleted: {
        backgroundColor: '#F5F5F5',
        opacity: 0.7,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        flex: 1,
        marginRight: 12,
    },
    taskTitleActive: {
        color: '#FFFFFF',
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#9E9E9E',
    },
    taskTime: {
        fontSize: 14,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    taskTimeActive: {
        color: '#FFFFFF',
        opacity: 0.9,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    complexityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    complexityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    contextTag: {
        fontSize: 12,
        color: '#757575',
        fontWeight: '500',
    },
    contextTagActive: {
        color: '#FFFFFF',
        opacity: 0.8,
    },
    activeTaskBadge: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    activeTaskText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
        opacity: 0.9,
    },

    // Add Button
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 24,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonText: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: '300',
    },

    // Reward Card
    rewardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    rewardHeader: {
        marginBottom: 16,
    },
    rewardLabel: {
        fontSize: 12,
        color: '#9E9E9E',
        marginBottom: 4,
        fontWeight: '600',
    },
    rewardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212121',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        color: '#757575',
        textAlign: 'right',
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyIcon: {
        fontSize: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#757575',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    initButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 28,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    initButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Debug Panel
    debugPanel: {
        backgroundColor: '#FFF3CD',
        borderBottomWidth: 2,
        borderBottomColor: '#FFE69C',
        padding: 12,
    },
    debugTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#856404',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 11,
        color: '#856404',
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    debugError: {
        fontSize: 11,
        color: '#D32F2F',
        fontFamily: 'monospace',
        marginBottom: 4,
        fontWeight: '600',
    },
    debugButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    debugButton: {
        backgroundColor: '#856404',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        flex: 1,
    },
    debugButtonPrimary: {
        backgroundColor: '#2196F3',
    },
    debugButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    debugButtonTextPrimary: {
        color: '#FFFFFF',
    },
});
