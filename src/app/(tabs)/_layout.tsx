import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E5E5EA',
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Focus',
                    tabBarLabel: 'Sprint',
                    // Icon would go here
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Assistant',
                    tabBarLabel: 'Link',
                }}
            />
            <Tabs.Screen
                name="backstage"
                options={{
                    title: 'Inventory',
                    tabBarLabel: 'Backstage',
                }}
            />
            <Tabs.Screen
                name="velocity"
                options={{
                    title: 'Stats',
                    tabBarLabel: 'Velocity',
                }}
            />
        </Tabs>
    );
}
