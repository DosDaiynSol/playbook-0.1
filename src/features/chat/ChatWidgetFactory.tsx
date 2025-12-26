import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActionLog } from '../../types';
// We'll assume a basic TaskWidget is needed here or we define it inline for now
// to keep it self-contained as requested.

interface ChatWidgetFactoryProps {
    item: ActionLog;
}

import { InteractiveTaskCard } from '../../components/features/chat/InteractiveTaskCard';

// Removed inline TaskWidget

const RewardUnlockCard = ({ rewardId }: { rewardId?: string }) => {
    // Placeholder for Reward Widget
    return (
        <View style={{ padding: 10, backgroundColor: '#FFF7E6', borderRadius: 8 }}>
            <Text style={{ color: '#B8860B' }}>Reward Unlocked! ID: {rewardId}</Text>
        </View>
    );
};

export const ChatWidgetFactory: React.FC<ChatWidgetFactoryProps> = ({ item }) => {
    switch (item.type) {
        case 'TASK_CREATED':
            // Render interactive card
            return (
                <View style={[styles.bubbleContainer, styles.botAlign]}>
                    <Text style={styles.metaText}>{item.content}</Text>
                    {item.metadata?.taskId && (
                        <InteractiveTaskCard taskId={item.metadata.taskId} />
                    )}
                </View>
            );

        case 'TASK_COMPLETED':
            // Completed tasks can also show the card, maybe in read-only mode?
            // For now, same card works.
            return (
                <View style={[styles.bubbleContainer, styles.botAlign]}>
                    <Text style={styles.metaText}>{item.content}</Text>
                    {item.metadata?.taskId && (
                        <InteractiveTaskCard taskId={item.metadata.taskId} />
                    )}
                </View>
            );

        case 'REWARD_EARNED':
            return (
                <View style={[styles.bubbleContainer, styles.botAlign]}>
                    <Text style={styles.metaText}>{item.content}</Text>
                    <RewardUnlockCard rewardId={item.metadata?.rewardId} />
                </View>
            );


        case 'USER_NOTE':
            return (
                <View style={[styles.bubbleContainer, styles.userAlign]}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userText}>{item.content}</Text>
                    </View>
                </View>
            );

        case 'SYSTEM_MESSAGE':
            return (
                <View style={styles.systemMessage}>
                    <Text style={styles.systemText}>{item.content.toUpperCase()}</Text>
                </View>
            );

        default:
            // Fallback for generic messages
            return (
                <View style={[styles.bubbleContainer, styles.botAlign]}>
                    <View style={styles.botBubble}>
                        <Text style={styles.botText}>{item.content}</Text>
                    </View>
                </View>
            );
    }
};

const styles = StyleSheet.create({
    bubbleContainer: {
        marginVertical: 6,
        paddingHorizontal: 16,
        width: '100%',
    },
    userAlign: {
        alignItems: 'flex-end',
    },
    botAlign: {
        alignItems: 'flex-start',
    },
    userBubble: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 16,
        borderBottomRightRadius: 2,
        maxWidth: '80%',
    },
    userText: {
        color: '#FFF',
        fontSize: 16,
    },
    botBubble: {
        backgroundColor: '#E5E5EA',
        padding: 12,
        borderRadius: 16,
        borderBottomLeftRadius: 2,
        maxWidth: '80%',
    },
    botText: {
        color: '#000',
        fontSize: 16,
    },
    systemMessage: {
        alignItems: 'center',
        marginVertical: 12,
    },
    systemText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
    },
    // Widget Styles
    taskWidget: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        width: 240,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    iconPlaceholder: {
        width: 16,
        height: 16,
        backgroundColor: '#34C759',
        borderRadius: 4,
        marginRight: 8,
    },
    taskTitle: {
        fontWeight: '600',
        color: '#1C1C1E',
    },
    taskSub: {
        fontSize: 12,
        color: '#8E8E93',
    },
    metaText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    rewardBubble: {
        backgroundColor: '#FFD70020', // Light gold
        borderColor: '#FFD700',
        borderWidth: 1,
        padding: 12,
        borderRadius: 12,
    },
    rewardText: {
        color: '#B8860B', // Dark goldenrod
        fontWeight: 'bold',
    }
});
