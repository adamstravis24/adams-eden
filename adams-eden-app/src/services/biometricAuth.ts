import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const SECURE_EMAIL_KEY = 'secure_email';
const SECURE_PASSWORD_KEY = 'secure_password';

export interface StoredCredentials {
  email: string;
  password: string;
}

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  return compatible;
}

/**
 * Check if biometric authentication is enrolled (fingerprint/face registered)
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get the available biometric types
 */
export async function getBiometricTypes(): Promise<string[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const typeNames: string[] = [];
  
  types.forEach(type => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        typeNames.push('Fingerprint');
        break;
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        typeNames.push('Face ID');
        break;
      case LocalAuthentication.AuthenticationType.IRIS:
        typeNames.push('Iris');
        break;
    }
  });
  
  return typeNames;
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to Adam\'s Eden',
      fallbackLabel: 'Use password instead',
      cancelLabel: 'Cancel',
    });
    
    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}

/**
 * Check if biometric auth is enabled for this user
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric status:', error);
    return false;
  }
}

/**
 * Enable biometric authentication
 */
export async function enableBiometric(email: string, password: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    await SecureStore.setItemAsync(SECURE_EMAIL_KEY, email);
    await SecureStore.setItemAsync(SECURE_PASSWORD_KEY, password);
  } catch (error) {
    console.error('Error enabling biometric:', error);
    throw error;
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometric(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(SECURE_EMAIL_KEY);
    await SecureStore.deleteItemAsync(SECURE_PASSWORD_KEY);
  } catch (error) {
    console.error('Error disabling biometric:', error);
    throw error;
  }
}

/**
 * Get stored credentials (email and password)
 */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
  try {
    const email = await SecureStore.getItemAsync(SECURE_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(SECURE_PASSWORD_KEY);
    
    if (email && password) {
      return { email, password };
    }
    return null;
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return null;
  }
}
