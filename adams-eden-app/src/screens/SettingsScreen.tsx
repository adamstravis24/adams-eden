import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBar } from '../components/HeaderBar';
import { useGarden } from '../context/GardenContext';
import { useAuth } from '../context/AuthContext';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { useTheme } from '../context/ThemeContext';
import {
  isBiometricSupported,
  isBiometricEnrolled,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getBiometricTypes,
} from '../services/biometricAuth';

const styles = appStyles;

export default function SettingsScreen() {
  const { theme, setTheme, palette } = useTheme();
  const { user, logout } = useAuth();
  const {
    location,
    lookupLocationByZip,
    isLocationLoading,
    locationError,
  } = useGarden();

  const [zipInput, setZipInput] = React.useState(location?.zip ?? '');
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const [biometricType, setBiometricType] = React.useState('');

  React.useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const supported = await isBiometricSupported();
    const enrolled = await isBiometricEnrolled();
    const enabled = await isBiometricEnabled();
    
    if (supported && enrolled) {
      setBiometricAvailable(true);
      const types = await getBiometricTypes();
      setBiometricType(types[0] || 'Biometric');
      setBiometricEnabled(enabled);
    }
  };

  const toggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        // Need to re-authenticate to store password
        Alert.alert(
          'Enable Biometric',
          'To enable biometric authentication, you need to enter your password once.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => {
                Alert.prompt(
                  'Enter Password',
                  'Please enter your password to enable biometric authentication',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Enable',
                      onPress: async (password?: string) => {
                        if (password && user?.email) {
                          try {
                            await enableBiometric(user.email, password);
                            setBiometricEnabled(true);
                            Alert.alert('Success', `${biometricType} authentication enabled`);
                          } catch (error) {
                            Alert.alert('Error', 'Failed to enable biometric authentication');
                          }
                        }
                      }
                    }
                  ],
                  'secure-text'
                );
              }
            }
          ]
        );
      } else {
        await disableBiometric();
        setBiometricEnabled(false);
        Alert.alert('Success', `${biometricType} authentication disabled`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  React.useEffect(() => {
    if (location?.zip) {
      setZipInput(location.zip);
    }
  }, [location?.zip]);

  React.useEffect(() => {
    if (locationError) {
      setFeedback(locationError);
    }
  }, [locationError]);

  const digitsOnly = React.useMemo(() => zipInput.replace(/[^0-9]/g, ''), [zipInput]);
  const canLookup = digitsOnly.length >= 5 && !isLocationLoading;

  const handleLookup = React.useCallback(async () => {
    if (!canLookup) return;
    const result = await lookupLocationByZip(zipInput);
    if (result) {
      setFeedback(`Location updated to ${result.locationName} (${result.zip}).`);
    }
  }, [canLookup, lookupLocationByZip, zipInput]);

  const t = makeThemedStyles(palette);

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar homeOnly />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={[t.h2, { marginBottom: 12 }]}>Appearance</Text>
        <View style={[t.card, { padding: 16 }]}>
          <View style={[t.rowBetween, { alignItems: 'center' }]}>
            <Text style={t.h3}>Theme</Text>
            <View style={{ flexDirection: 'row', backgroundColor: palette.surfaceMuted, borderRadius: 999, overflow: 'hidden' }}>
              {(['light','dark'] as const).map(mode => (
                <TouchableOpacity key={mode} onPress={() => setTheme(mode)} style={{ paddingVertical: 8, paddingHorizontal: 14, backgroundColor: theme === mode ? palette.border : 'transparent' }}>
                  <Text style={{ color: palette.text, fontWeight: '700', textTransform: 'capitalize' }}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={[t.small, { marginTop: 8 }]}>Choose Light or Dark mode. Your preference is saved on this device.</Text>
        </View>

        <Text style={[t.h2, { marginBottom: 12, marginTop: 16 }]}>Location & Climate</Text>

        <View style={[t.card, { padding: 16 }]}> 
          <Text style={[t.h3, { marginBottom: 6 }]}>Personalize by ZIP code</Text>
          <Text style={[t.small, { marginBottom: 12 }]}>We use NOAA climate normals to fine-tune planting dates for your area.</Text>

          <TextInput
            value={zipInput}
            onChangeText={setZipInput}
            placeholder="ZIP code (e.g. 97201)"
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleLookup}
            style={t.input}
          />

          <TouchableOpacity
            onPress={handleLookup}
            disabled={!canLookup}
            style={[t.btn, t.btnPrimary, { marginTop: 12, opacity: canLookup ? 1 : 0.6 }]}
          >
            <Text style={[t.btnText, t.btnTextPrimary]}>
              {isLocationLoading ? 'Updating…' : 'Update location'}
            </Text>
          </TouchableOpacity>

          {feedback && (
            <Text style={{ marginTop: 12, color: feedback.includes('updated') ? '#047857' : '#fca5a5' }}>{feedback}</Text>
          )}

          {location && (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: palette.background, borderRadius: 10, borderColor: palette.border, borderWidth: 1 }}>
              <Text style={{ color: palette.text, fontWeight: '600' }}>{location.locationName} ({location.zip})</Text>
              <Text style={{ color: palette.text, marginTop: 4 }}>Station: {location.stationName}</Text>
              <Text style={{ color: palette.text, marginTop: 4 }}>Zone {location.hardinessZone ?? '6b'}</Text>
            </View>
          )}
        </View>

        <Text style={[t.h2, { marginBottom: 12, marginTop: 16 }]}>Account</Text>
        <View style={[t.card, { padding: 16 }]}>
          <View style={[t.rowBetween, { marginBottom: 16 }]}>
            <Text style={t.h3}>Signed in as:</Text>
            <Text style={{ color: palette.text, fontSize: 14 }}>{user?.email || 'Guest'}</Text>
          </View>
          
          {/* Biometric Authentication Toggle */}
          {biometricAvailable && (
            <View style={[t.rowBetween, { marginBottom: 16, paddingVertical: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[t.h3, { marginBottom: 4 }]}>{biometricType} Sign In</Text>
                <Text style={{ color: palette.textMuted, fontSize: 13 }}>
                  Use {biometricType.toLowerCase()} to sign in quickly
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: palette.border, true: '#86efac' }}
                thumbColor={biometricEnabled ? '#16a34a' : '#f4f3f4'}
              />
            </View>
          )}
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Sign Out', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await logout();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to sign out. Please try again.');
                      }
                    }
                  }
                ]
              );
            }}
            style={[t.btn, { backgroundColor: '#dc2626', marginTop: 8 }]}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={[t.btnText, { color: '#fff' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
