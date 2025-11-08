/**
 * Email Verification Screen
 * Allows users to enter the OTP token from their email
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function VerifyEmailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { verifyOtp } = useAuth();

    const email = params.email as string;
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!token.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        try {
            setLoading(true);
            await verifyOtp(email, token.trim());
            Alert.alert('Success', 'Email verified successfully!');
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        Alert.alert('Info', 'Please check your email for the verification code');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                    We sent a verification code to{'\n'}
                    <Text style={styles.email}>{email}</Text>
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput
                        style={styles.input}
                        value={token}
                        onChangeText={setToken}
                        placeholder="Enter 6-digit code"
                        keyboardType="number-pad"
                        maxLength={6}
                        autoCapitalize="none"
                        autoFocus
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify Email</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                    <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>← Back to Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
    },
    email: {
        fontWeight: '600',
        color: '#000',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 8,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        padding: 12,
        alignItems: 'center',
    },
    resendText: {
        color: '#007AFF',
        fontSize: 14,
    },
    backButton: {
        padding: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    backText: {
        color: '#666',
        fontSize: 14,
    },
});
