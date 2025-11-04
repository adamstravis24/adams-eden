import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HeaderBar } from '../../components/HeaderBar';
import { appStyles, makeThemedStyles } from '../../styles/appStyles';
import { useTheme } from '../../context/ThemeContext';

const styles = appStyles;

export default function TermsOfServiceScreen() {
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
          <Text style={[t.h2, { marginBottom: 8 }]}>Adams Eden Terms of Service</Text>
          <Text style={[t.small, { marginBottom: 16 }]}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          <Text style={[t.p, { marginBottom: 16 }]}>
            These Terms of Service govern your use of the Adams Eden mobile application. By using our app, you agree to these terms.
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>App Usage</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Use the app for personal gardening and plant care purposes{'\n'}
            • Respect intellectual property rights{'\n'}
            • Do not attempt to reverse engineer or modify the app{'\n'}
            • Report bugs and provide feedback to help us improve
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>User Accounts</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • You are responsible for maintaining account security{'\n'}
            • Provide accurate information when creating your account{'\n'}
            • Notify us immediately of any unauthorized access{'\n'}
            • We reserve the right to suspend accounts for violations
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Content & Data</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Plant information is for reference only{'\n'}
            • Gardening advice is general and not a substitute for professional consultation{'\n'}
            • Your garden data is stored securely but we recommend regular backups{'\n'}
            • We may update plant database information without notice
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Notifications & Permissions</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Watering reminders help you care for your plants{'\n'}
            • Weather alerts are for informational purposes{'\n'}
            • You can disable notifications in your device settings{'\n'}
            • Location permission is used for weather and climate data
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Disclaimers</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            • Plant care results may vary based on many factors{'\n'}
            • Weather data is provided by third parties{'\n'}
            • We are not responsible for gardening outcomes{'\n'}
            • App availability and features may change
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>App Store Terms</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            Your use of the Adams Eden app is also subject to the terms of service of your app store (Apple App Store or Google Play Store). Please review those terms as well.
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 16 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Contact Information</Text>
          <Text style={[t.p, { marginBottom: 8 }]}>
            Questions about these terms?
          </Text>
          <Text style={[t.p, { marginBottom: 4 }]}>
            📧 Email: legal@adamseden.com
          </Text>
          <Text style={[t.p, { marginBottom: 4 }]}>
            📍 Address: Adams Eden Garden Center & Nursery
          </Text>
          <Text style={[t.p]}>
            📞 Phone: (555) 123-GROW
          </Text>
        </View>

        <View style={[t.card, { padding: 20, marginBottom: 32 }]}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Updates to Terms</Text>
          <Text style={[t.p, { marginBottom: 12 }]}>
            We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
          </Text>
          <Text style={[t.small, { textAlign: 'center', marginTop: 16 }]}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}