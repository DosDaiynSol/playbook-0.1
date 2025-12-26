import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, SafeAreaView } from 'react-native';
import { useTaskStore } from '../../../store/useTaskStore';
import { Task, TaskComplexity } from '../../../types';
import * as Haptics from 'expo-haptics';
// import { BlurView } from 'expo-blur'; // Note: might need install, or use View fallback

interface InteractiveTaskCardProps {
    taskId: string;
}

export const InteractiveTaskCard: React.FC<InteractiveTaskCardProps> = ({ taskId }) => {
    // Connect to store to get *live* data
    const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));
    // We need an update action. Let's assume we might need to add one or reuse logic.
    // For now, we will add `updateTask` to the store in the next step or assume it exists. 
    // Wait, the store I wrote earlier didn't have `updateTask`. 
    // I will implement the UI here, and we will patch the store in a moment.

    // Local state for the modal
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editComplexity, setEditComplexity] = useState<TaskComplexity>(1);

    // NOTE: Since I cannot edit the store file in this single turn effectively without context,
    // I will use a placeholder for update. In a real scenario, I'd update the store.
    // For this specific 'Interactive' requirement, let's build the UI interactions 
    // and I'll invoke a `useTaskStore.getState().updateTask(...)` pattern if I can add it, 
    // or just console log for now until the store is patched.
    // Actually, I should probably patch the store first? 
    // The user asked for specific files. I will focus on the UI and use a store hook assuming it will be there.

    // For safety, let's grab the set function directly if we can, or just modify local input 
    // and rely on a "Save" action.

    // ACCESSING INTERNAL STORE ACTIONS (Quick Patch Pattern)
    // In a real app, I'd add `updateTask` to the interface.
    const { tasks } = useTaskStore();

    if (!task) return null;

    const getComplexityColor = (c: number) => {
        if (c === 1) return '#4CD964';
        if (c === 2) return '#FFCC00';
        return '#FF3B30';
    };

    const handlePress = () => {
        setEditTitle(task.title);
        setEditComplexity(task.complexity);
        setIsEditing(true);
        Haptics.selectionAsync();
    };

    const handleSave = () => {
        // Here we would call store.updateTask(taskId, { title: editTitle, complexity: editComplexity })
        // Since the store update isn't requested explicitly but required for this to work, 
        // I will implement a direct mutation via a temporary helper or just mock it visually.

        // HACK: For this step, we will manipulate the store state directly via Zustand's setState logic 
        // if we were outside, but inside a component we need the action.
        // Let's silently patch the store in the same "brain" cycle if possible, 
        // but for now I will just close the modal to demonstrate interaction.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsEditing(false);

        // *Self-Correction*: I will modify the store file in the next tool call to include updateTask 
        // so this works.
        // Correct usage using the store action
        useTaskStore.getState().updateTask(taskId, {
            title: editTitle,
            complexity: editComplexity
        });
    };

    return (
        <>
            <TouchableOpacity
                style={styles.card}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: getComplexityColor(task.complexity) }]} />
                    <View style={styles.content}>
                        <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
                        <Text style={styles.sub}>
                            {task.tags.length > 0 ? task.tags.join(', ') : 'No tags'} • {task.status}
                        </Text>
                    </View>
                    <Text style={styles.editIcon}>✎</Text>
                </View>
            </TouchableOpacity>

            <Modal animationType="slide" transparent={true} visible={isEditing}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>EDIT TASK</Text>

                        <Text style={styles.label}>TITLE</Text>
                        <TextInput
                            style={styles.input}
                            value={editTitle}
                            onChangeText={setEditTitle}
                        />

                        <Text style={styles.label}>COMPLEXITY</Text>
                        <View style={styles.complexityRow}>
                            {[1, 2, 3].map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.cButton,
                                        editComplexity === c && styles.cButtonActive,
                                        { borderColor: getComplexityColor(c) }
                                    ]}
                                    onPress={() => setEditComplexity(c as TaskComplexity)}
                                >
                                    <View style={[
                                        styles.cDot,
                                        { backgroundColor: getComplexityColor(c) }
                                    ]} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveText}>SAVE CHANGES</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                            <Text style={styles.cancelText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    sub: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    editIcon: {
        fontSize: 16,
        color: '#CCC',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
        color: '#CCC',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#888',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F2F2F7',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    complexityRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    cButton: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    cButtonActive: {
        backgroundColor: '#F9F9F9',
        borderWidth: 2,
    },
    cDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    saveButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cancelButton: {
        alignItems: 'center',
        padding: 8,
    },
    cancelText: {
        color: '#999',
        fontWeight: '600',
    }
});
