import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HeaderBar } from '../../components/HeaderBar';
import { appStyles, makeThemedStyles } from '../../styles/appStyles';
import { useTheme } from '../../context/ThemeContext';

const styles = appStyles;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h2, { marginBottom: 8 }]}>Adams Eden Privacy Policy</Text>
          <Text style={[t.small, { marginBottom: 16 }]}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          <Text style={[t.p, { marginBottom: 16 }]}>
            Adams Eden is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Information We Collect</Text>

          <Text style={[t.h4, { marginBottom: 8, marginTop: 12 }]}>Personal Information</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Email address and account credentials{'\n'}
            • Profile information and preferences{'\n'}
            • Location data (ZIP code for climate features){'\n'}
            • Plant tracking and gardening data
          </Text>

          <Text style={[t.h4, { marginBottom: 8, marginTop: 12 }]}>Device Information</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Device type and operating system{'\n'}
            • Unique device identifiers{'\n'}
            • App usage statistics{'\n'}
            • GPS location (when permitted)
          </Text>

          <Text style={[t.h4, { marginBottom: 8, marginTop: 12 }]}>Weather Data</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Location-based weather information{'\n'}
            • Climate normals for gardening recommendations{'\n'}
            • Frost date calculations
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>How We Use Your Information</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Provide personalized gardening recommendations{'\n'}
            • Send watering reminders and weather alerts{'\n'}
            • Track plant growth and garden progress{'\n'}
            • Improve app functionality and user experience{'\n'}
            • Ensure account security and prevent fraud{'\n'}
            • Comply with legal obligations
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Data Storage & Security</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            Your data is stored securely using industry-standard encryption. We use Firebase for authentication and data storage, and AsyncStorage for local device storage. Your personal information is never sold to third parties.
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>App Permissions</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            The app may request the following permissions:
          </Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • <Text style={{ fontWeight: 'bold' }}>Location:</Text> For weather data and climate-adjusted recommendations{'\n'}
            • <Text style={{ fontWeight: 'bold' }}>Notifications:</Text> For watering reminders and alerts{'\n'}
            • <Text style={{ fontWeight: 'bold' }}>Camera:</Text> For plant identification features{'\n'}
            • <Text style={{ fontWeight: 'bold' }}>Storage:</Text> For offline data caching
          </Text>
          <Text style={[t.p, { fontSize: 14, color: palette.textMuted }]}>
            You can manage these permissions in your device settings at any time.
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Third-Party Services</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            We integrate with the following third-party services:
          </Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            onPress={() => openLink('https://firebase.google.com/support/privacy')}
          >
            <MaterialCommunityIcons name="link" size={16} color={palette.primary} style={{ marginRight: 8 }} />
            <Text style={[t.p, { color: palette.primary, textDecorationLine: 'underline' }]}>
              Firebase Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            onPress={() => openLink('https://open-meteo.com/en/terms')}
          >
            <MaterialCommunityIcons name="link" size={16} color={palette.primary} style={{ marginRight: 8 }} />
            <Text style={[t.p, { color: palette.primary, textDecorationLine: 'underline' }]}>
              Open-Meteo Terms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            onPress={() => openLink('https://www.noaa.gov/privacypolicy')}
          >
            <MaterialCommunityIcons name="link" size={16} color={palette.primary} style={{ marginRight: 8 }} />
            <Text style={[t.p, { color: palette.primary, textDecorationLine: 'underline' }]}>
              NOAA Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Your Rights</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            You have the right to:
          </Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Access and update your personal information{'\n'}
            • Delete your account and associated data{'\n'}
            • Opt out of notifications and marketing{'\n'}
            • Disable location and camera permissions{'\n'}
            • Request data portability
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Children's Privacy</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will promptly delete it.
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Contact Us</Text>
          <Text style={[t.p, { marginBottom: 8 }]}>
            If you have questions about this Privacy Policy or our data practices:
          </Text>
          <Text style={[t.p, { marginBottom: 4 }]}>
            📧 Email: privacy@adamseden.com
          </Text>
          <Text style={[t.p, { marginBottom: 4 }]}>
            📍 Address: Adams Eden Garden Center & Nursery
          </Text>
          <Text style={[t.p]}>
            📞 Phone: (555) 123-GROW
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 32 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Changes to This Policy</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes through the app or via email. Your continued use of the app after changes constitutes acceptance of the updated policy.
          </Text>
          <Text style={[t.small, { textAlign: 'center', marginTop: 16 }]}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}