import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // Add navigation
import { ActionLog } from '../../types';
import { ChatWidgetFactory } from './ChatWidgetFactory';
import { ChatService } from '../../services/api';
import { useTaskStore } from '../../store/useTaskStore';
import * as Haptics from 'expo-haptics';
import { resetApp } from '../../utils/debug'; // Import debug tool

export const ChatScreen = () => {
    const router = useRouter(); // For navigation to Focus Tab
    const [messages, setMessages] = useState<ActionLog[]>([]);
    const [input, setInput] = useState('');
    const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Store Data
    const addTask = useTaskStore(state => state.addTask);
    const addReward = useTaskStore(state => state.addReward);
    const createSprint = useTaskStore(state => state.createSprint);
    const { tasks, currentSprint, rewards } = useTaskStore();

    // --- Computed Logic for "Ready to Deploy" ---
    // Rule: No active sprint + at least 3 pending tasks (that are not already in a completed sprint? 
    // Actually, in this simple model, tasks are just pending/completed. 
    // We grab the top 3 pending ones.)
    const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'pending'), [tasks]);
    const isReadyToDeploy = !currentSprint && pendingTasks.length >= 3;

    // Initial Welcome Message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'init-1',
                    type: 'SYSTEM_MESSAGE',
                    content: 'Neural Link Active. Ready to process sprint parameters.',
                    timestamp: Date.now()
                }
            ]);
        }
    }, []);

    const processActionSideEffects = (actions: ActionLog[]) => {
        actions.forEach(action => {
            if (action.type === 'TASK_CREATED' && action.metadata?.widgetData) {
                const taskData = action.metadata.widgetData;
                if (taskData.title && taskData.complexity) {
                    addTask(taskData.title, taskData.complexity, taskData.tags || []);
                }
            }

            if (action.type === 'REWARD_EARNED' && action.metadata?.widgetData) {
                const rewardData = action.metadata.widgetData;
                if (rewardData.title && rewardData.cost) {
                    addReward({
                        id: Date.now().toString(),
                        title: rewardData.title,
                        cost: rewardData.cost,
                        tier: rewardData.tier || 'bronze',
                        isRedeemed: false,
                        isLocked: true
                    });
                }
            }
        });
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ActionLog = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            type: 'USER_NOTE',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const responseActions = await ChatService.sendMessage(userMsg.content);
            setMessages(prev => [...prev, ...responseActions]);
            processActionSideEffects(responseActions);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error(error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const handleDeploySprint = () => {
        // 1. Logic: Take top 3
        const tasksToDeploy = pendingTasks.slice(0, 3).map(t => t.id);
        // Find a reward? Just grab the first unredeemed one or null
        const reward = rewards.find(r => !r.isRedeemed);

        createSprint(tasksToDeploy, reward ? reward.id : '');

        // 2. Feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // 3. Navigation
        // Assuming file based routing is at / (index)
        router.push('/');

        // Optional: Add a system message locally saying "Sprint Deployed"
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'SYSTEM_MESSAGE',
            content: 'Sprint Initialized. Switching to Cockpit Mode.',
            timestamp: Date.now()
        }]);
    };

    const handleDebugReset = () => {
        resetApp();
        setMessages([
            {
                id: 'reset-msg',
                type: 'SYSTEM_MESSAGE',
                content: 'SYSTEM RESET COMPLETE. MEMORY WIPED.',
                timestamp: Date.now()
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onLongPress={handleDebugReset} delayLongPress={1000}>
                    <Text style={styles.headerTitle}>PLAYBOOK ASSISTANT</Text>
                </TouchableOpacity>
                <View style={styles.onlineIndicator} />
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentContainer}>
                <TouchableOpacity onPress={() => setViewMode('chat')} style={[styles.segment, viewMode === 'chat' && styles.activeSegment]}>
                    <Text style={[styles.segmentText, viewMode === 'chat' && styles.activeSegmentText]}>CHAT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewMode('history')} style={[styles.segment, viewMode === 'history' && styles.activeSegment]}>
                    <Text style={[styles.segmentText, viewMode === 'history' && styles.activeSegmentText]}>HISTORY</Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'chat' ? (
                <>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        renderItem={({ item }) => <ChatWidgetFactory item={item} />}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />

                    {/* Deploy Sprint Floating UI */}
                    {isReadyToDeploy && (
                        <View style={styles.deployContainer}>
                            <TouchableOpacity style={styles.deployButton} onPress={handleDeploySprint}>
                                <Text style={styles.deployText}>DEPLOY SPRINT ({pendingTasks.length})</Text>
                                <Text style={styles.deploySub}>INITIATE COCKPIT SEQUENCE</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    >
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Log task or claim reward..."
                                placeholderTextColor="#999"
                                value={input}
                                onChangeText={setInput}
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !input.trim() && styles.disabledSend]}
                                onPress={handleSend}
                                disabled={loading || !input.trim()}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.sendIcon}>→</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </>
            ) : (
                <View style={{ flex: 1, padding: 20 }}>
                    <Text style={{ color: '#999', fontSize: 12, letterSpacing: 1, marginBottom: 20 }}>AUDIT LOG (Protocol v1.0)</Text>
                    {/* Placeholder for History Log */}
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#333' }}>
                        [22:45] SYSTEM: Sprint initialized{'\n'}
                        [22:42] USER: Logged task "Update UI"{'\n'}
                        [22:40] AGENT: Recognized request{'\n'}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#1C1C1E',
        marginRight: 6,
    },
    onlineIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34C759',
    },
    listContent: {
        paddingVertical: 16,
        paddingBottom: 100, // Extra padding for deploy button
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        marginRight: 8,
        color: '#000',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSend: {
        backgroundColor: '#C7C7CC',
    },
    sendIcon: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 2,
    },
    // Deploy Button
    deployContainer: {
        position: 'absolute',
        bottom: 80, // Above Input
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    deployButton: {
        backgroundColor: '#1C1C1E',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    deployText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    deploySub: {
        color: '#8E8E93',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    // Segment Control
    segmentContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#F2F2F7',
    },
    segment: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginHorizontal: 4,
    },
    activeSegment: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    segmentText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    activeSegmentText: {
        color: '#1C1C1E',
    }
});
