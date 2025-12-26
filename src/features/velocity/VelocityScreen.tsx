import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/useTaskStore';

export const VelocityScreen = () => {
    const { score } = useTaskStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>VELOCITY</Text>
            </View>

            <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>CURRENT ENERGY</Text>
                <Text style={styles.scoreValue}>{score}</Text>
            </View>

            <View style={styles.chartPlaceholder}>
                <Text style={styles.placeholderText}>[Productivity Graph Placeholder]</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { padding: 20, alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700', letterSpacing: 2 },
    scoreContainer: { alignItems: 'center', marginTop: 40 },
    scoreLabel: { fontSize: 12, color: '#999', letterSpacing: 1 },
    scoreValue: { fontSize: 64, fontWeight: '800', marginVertical: 10 },
    chartPlaceholder: { flex: 1, margin: 20, backgroundColor: '#FAFAFA', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    placeholderText: { color: '#CCC' }
});
