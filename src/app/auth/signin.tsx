import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signInAnonymously } = useAuth();
    const router = useRouter();

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setIsLoading(true);
        const { error } = await signIn(email, password);
        setIsLoading(false);

        if (error) {
            Alert.alert('Sign In Failed', error.message);
        }
    };

    const handleAnonymousSignIn = async () => {
        setIsLoading(true);
        const { error } = await signInAnonymously();
        setIsLoading(false);

        if (error) {
            Alert.alert('Anonymous Sign In Failed', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Animated.View entering={FadeIn} style={styles.content}>
                    {/* Header */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                        <Text style={styles.logo}>📖</Text>
                        <Text style={styles.title}>Playbook</Text>
                        <Text style={styles.subtitle}>Your personal productivity system</Text>
                    </Animated.View>

                    {/* Form */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.form}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor="#9E9E9E"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#9E9E9E"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSignIn}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push('/auth/signup')}
                        >
                            <Text style={styles.linkText}>
                                Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Quick Access */}
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400)}>
                        <TouchableOpacity
                            style={styles.anonymousButton}
                            onPress={handleAnonymousSignIn}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.anonymousButtonText}>
                                Continue as Guest
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#757575',
    },
    form: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: '#212121',
    },
    button: {
        backgroundColor: '#2196F3',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#BDBDBD',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: {
        fontSize: 14,
        color: '#757575',
    },
    linkTextBold: {
        fontWeight: '600',
        color: '#2196F3',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '600',
    },
    anonymousButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    anonymousButtonText: {
        color: '#424242',
        fontSize: 16,
        fontWeight: '600',
    },
});
