import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Task } from '../../../types';
import * as Haptics from 'expo-haptics';

interface CompactTaskItemProps {
    task: Task;
    onToggle: (taskId: string) => void;
    onRegenerate?: (taskId: string) => void;
    isActive?: boolean;
    showTime?: string;
}

export const CompactTaskItem: React.FC<CompactTaskItemProps> = ({
    task,
    onToggle,
    onRegenerate,
    isActive = false,
    showTime,
}) => {
    const isCompleted = task.status === 'completed';

    const getComplexityColor = (complexity: number) => {
        if (complexity === 1) return '#4CAF50'; // Green
        if (complexity === 2) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(task.id);
    };

    const handleRegen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRegenerate?.(task.id);
    };

    return (
        <Animated.View entering={FadeInRight.springify()} style={styles.container}>
            {/* Left: Regen Button */}
            {onRegenerate && !isCompleted && (
                <TouchableOpacity
                    style={styles.regenButton}
                    onPress={handleRegen}
                    activeOpacity={0.7}
                >
                    <Text style={styles.regenIcon}>↻</Text>
                </TouchableOpacity>
            )}

            {/* Center: Content */}
            <View style={styles.content}>
                <Text
                    style={[
                        styles.title,
                        isCompleted && styles.titleCompleted,
                        isActive && styles.titleActive,
                    ]}
                    numberOfLines={2}
                >
                    {task.title}
                </Text>

                {/* Tags Row */}
                <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{task.contextTag}</Text>
                    </View>
                    {showTime && (
                        <View style={[styles.tag, styles.tagTime]}>
                            <Text style={styles.tagText}>{showTime}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Right: Complexity & Checkbox */}
            <View style={styles.rightActions}>
                {/* Complexity Dot */}
                <View
                    style={[
                        styles.complexityDot,
                        { backgroundColor: getComplexityColor(task.complexity) },
                    ]}
                />

                {/* Checkbox */}
                <TouchableOpacity
                    style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                    onPress={handleToggle}
                    activeOpacity={0.7}
                >
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 68,
    },
    regenButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    regenIcon: {
        fontSize: 18,
        color: '#757575',
    },
    content: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 6,
        lineHeight: 20,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: '#9E9E9E',
    },
    titleActive: {
        color: '#2196F3',
        fontWeight: '700',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    tag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tagTime: {
        backgroundColor: '#E3F2FD',
    },
    tagText: {
        fontSize: 11,
        color: '#616161',
        fontWeight: '500',
    },
    rightActions: {
        alignItems: 'center',
        gap: 8,
    },
    complexityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxCompleted: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
