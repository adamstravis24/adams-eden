import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';

const styles = appStyles;

export default function ShopScreen() {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, paddingTop: 24 }}>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={t.h2}>Shop</Text>
          <Text style={[t.p, { textAlign: 'center' }]}>Garden supplies coming soon.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
