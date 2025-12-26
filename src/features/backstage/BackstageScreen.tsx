import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/useTaskStore';

export const BackstageScreen = () => {
    const { tasks, rewards, addTask, deleteTask, addReward, currentSprint } = useTaskStore();
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
                <Text style={styles.title}>BACKSTAGE</Text>
            </View>

            <View style={styles.segmentContainer}>
                <Text onPress={() => setViewMode('tasks')} style={[styles.segment, viewMode === 'tasks' && styles.activeSegment]}>TASKS</Text>
                <Text onPress={() => setViewMode('rewards')} style={[styles.segment, viewMode === 'rewards' && styles.activeSegment]}>REWARDS</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {viewMode === 'tasks' ? (
                    <>
                        <Text style={styles.sectionTitle}>BACKLOG PENDING ({pendingTasks.length})</Text>
                        {pendingTasks.map(task => (
                            <View key={task.id} style={styles.card}>
                                <Text style={styles.cardTitle}>{task.title}</Text>
                                <Text style={styles.cardSub}>{task.contextTag} • Complexity: {task.complexity}</Text>
                            </View>
                        ))}
                    </>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>REWARDS VAULT</Text>
                        {rewards.map(reward => (
                            <View key={reward.id} style={styles.card}>
                                <Text style={styles.cardTitle}>{reward.title}</Text>
                                <Text style={styles.cardSub}>{reward.tier} • Cost: {reward.cost}</Text>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#F0F0F0' },
    title: { fontSize: 16, fontWeight: '700', letterSpacing: 2 },
    segmentContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
    segment: { padding: 10, marginHorizontal: 10, color: '#999', fontWeight: '600' },
    activeSegment: { color: '#000', borderBottomWidth: 2, borderColor: '#000' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 12, color: '#999', marginBottom: 10, letterSpacing: 1 },
    card: { padding: 16, backgroundColor: '#FAFAFA', marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
    cardTitle: { fontSize: 16, fontWeight: '500' },
    cardSub: { fontSize: 12, color: '#666', marginTop: 4 }
});
