import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  isBiometricSupported,
  isBiometricEnrolled,
  authenticateWithBiometrics,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getStoredCredentials,
  getBiometricTypes,
} from '../services/biometricAuth';
import * as WebBrowser from 'expo-web-browser';
import * as GoogleAuth from 'expo-auth-session/providers/google';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Complete the auth session when the app is opened via redirect
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onClose }: { onClose?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [enableBiometricAuth, setEnableBiometricAuth] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Configure Google ID token auth request
  const [request, response, promptAsync] = GoogleAuth.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Handle Google auth response -> Firebase sign-in
  useEffect(() => {
    (async () => {
      if (response?.type === 'success') {
        try {
          setGoogleLoading(true);
          const idToken = (response.params as any)?.id_token;
          if (!idToken) {
            setError('Google sign-in failed to return an ID token.');
            return;
          }
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          onClose && onClose();
        } catch (e: any) {
          console.error('Google sign-in error:', e?.message || e);
          setError('Google authentication failed. Please try again.');
        } finally {
          setGoogleLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const checkBiometricAvailability = async () => {
    const supported = await isBiometricSupported();
    const enrolled = await isBiometricEnrolled();
    const enabled = await isBiometricEnabled();
    
    if (supported && enrolled) {
      setBiometricAvailable(true);
      const types = await getBiometricTypes();
      setBiometricType(types[0] || 'Biometric');
      
      // If biometric is enabled, try to auto-authenticate
      if (enabled) {
        const credentials = await getStoredCredentials();
        if (credentials) {
          setEmail(credentials.email);
          // Show biometric prompt immediately
          handleBiometricLogin();
        }
      }
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const authenticated = await authenticateWithBiometrics();
      if (authenticated) {
        const credentials = await getStoredCredentials();
        if (credentials) {
          // Actually log in with stored credentials
          await login(credentials.email, credentials.password);
          onClose && onClose();
        } else {
          setError('No stored credentials found. Please sign in manually.');
        }
      } else {
        setError('Biometric authentication failed');
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('Stored credentials are invalid. Please sign in again.');
        await disableBiometric();
      } else {
        setError('Biometric authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    // Validate credentials
    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      if (isSignUp) {
        await signup(trimmedEmail, trimmedPassword);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await login(trimmedEmail, trimmedPassword);
        
        // If user enabled biometric auth, save credentials securely
        if (enableBiometricAuth && biometricAvailable) {
          await enableBiometric(trimmedEmail, trimmedPassword);
          Alert.alert('Biometric Enabled', `${biometricType} authentication has been enabled for future sign-ins.`);
        }
      }
      onClose && onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    }
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.jpg')} 
              style={{ width: 80, height: 80, borderRadius: 10 }} 
              resizeMode="contain" 
            />
            <Text style={styles.title}>Adam's Eden</Text>
            <Text style={styles.subtitle}>Garden Management App</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            
            <TextInput 
              placeholder="Email" 
              value={email} 
              onChangeText={setEmail} 
              style={styles.input} 
              keyboardType="email-address" 
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              placeholderTextColor="#9CA3AF"
            />
            
            <TextInput 
              placeholder="Password" 
              value={password} 
              onChangeText={setPassword} 
              style={styles.input}
              secureTextEntry 
              autoCapitalize="none"
              editable={!loading}
              placeholderTextColor="#9CA3AF"
            />
            
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}
            
            {/* Biometric Toggle */}
            {biometricAvailable && !isSignUp && (
              <TouchableOpacity 
                style={styles.biometricToggle}
                onPress={() => setEnableBiometricAuth(!enableBiometricAuth)}
                disabled={loading}
              >
                <MaterialCommunityIcons 
                  name={enableBiometricAuth ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={24} 
                  color="#16a34a" 
                />
                <Text style={styles.biometricText}>
                  Enable {biometricType} sign in
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Biometric Sign In Button */}
            {biometricAvailable && !isSignUp && (
              <TouchableOpacity 
                style={[styles.biometricBtn, loading && styles.btnDisabled]} 
                onPress={handleBiometricLogin} 
                disabled={loading}
              >
                <MaterialCommunityIcons name="fingerprint" size={24} color="#fff" />
                <Text style={styles.btnText}>
                  Sign in with {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {/* Google Sign In Button */}
            {!isSignUp && (
              <TouchableOpacity
                style={[styles.googleBtn, (googleLoading || loading) && styles.btnDisabled]}
                onPress={() => {
                  setError('');
                  promptAsync({ useProxy: true, showInRecents: true });
                }}
                disabled={googleLoading || loading || !request}
              >
                <MaterialCommunityIcons name="google" size={24} color="#fff" />
                <Text style={styles.btnText}>
                  {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.btn, loading && styles.btnDisabled]} 
              onPress={handleAuth} 
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchBtn} 
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.switchLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  biometricToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 8,
  },
  biometricText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#374151',
  },
  biometricBtn: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btn: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  googleBtn: {
    backgroundColor: '#ea4335',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#ea4335',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  switchBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchLink: {
    color: '#16a34a',
    fontWeight: '600',
  },
});
