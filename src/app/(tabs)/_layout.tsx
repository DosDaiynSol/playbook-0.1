import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
// @ts-ignore: Standard Expo icon set usually available in runtime
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, SHADOWS } from '../../lib/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: PALETTE.surface,
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 92 : 72,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                    ...SHADOWS.soft, // Clean shadow, handles elevation
                },
                tabBarActiveTintColor: PALETTE.primary,
                tabBarInactiveTintColor: PALETTE.textTertiary,
                tabBarLabelStyle: {
                    fontWeight: '600',
                    fontSize: 10,
                    marginBottom: 4,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Focus',
                    tabBarLabel: 'Focus',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "flash" : "flash-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Assistant',
                    tabBarLabel: 'Assistant',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="backstage"
                options={{
                    title: 'Inventory',
                    tabBarLabel: 'Inventory',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="velocity"
                options={{
                    title: 'Stats',
                    tabBarLabel: 'Velocity',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

