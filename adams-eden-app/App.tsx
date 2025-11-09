import 'react-native-reanimated';
import React from 'react';
import { View, Image, Text } from 'react-native';
import { DefaultTheme as NavLightTheme, DarkTheme as NavDarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GardenProvider } from './src/context/GardenContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import IdentifyScreen from './src/screens/IdentifyScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import HomeScreen from './src/screens/HomeScreen';
import GardenScreen from './src/screens/GardenScreen';
import ShopScreen from './src/screens/ShopScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import PlantDatabaseScreen from './src/screens/PlantDatabaseScreen';
import JournalScreen from './src/screens/JournalScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from './src/components/ErrorBoundary';
import { firebaseInitError, firebaseInitialized } from './src/services/firebase';
import ReactNative, { useEffect } from 'react';
import { initializeNotifications } from './src/services/notifications';
import { registerWeatherBackgroundTask } from './src/services/notifications';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

type TabName = 'identify' | 'calendar' | 'home' | 'garden' | 'shop';

const ACTIVE_COLOR = '#16a34a';
const INACTIVE_COLOR = '#6b7280';
const TAB_BORDER_COLOR = '#e5e7eb';

const TabBarBackdrop: React.FC<{ bottomInset: number }> = ({ bottomInset }) => {
  const { palette } = useTheme();
  const haloWidth = 86;
  const haloRadius = haloWidth / 2;
  return (
    <View style={{ flex: 1, backgroundColor: palette.surface, paddingBottom: bottomInset }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: palette.border,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          alignSelf: 'center',
          width: haloWidth,
          height: 4,
          backgroundColor: palette.surface,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: -haloRadius - 2,
          width: haloWidth,
          height: haloRadius,
          borderTopLeftRadius: haloRadius,
          borderTopRightRadius: haloRadius,
          borderColor: palette.border,
          borderWidth: 1,
          borderBottomWidth: 0,
          backgroundColor: palette.surface,
        }}
      />
    </View>
  );
};

function renderTabIcon(routeName: TabName, focused: boolean, color: string, theme: 'light' | 'dark') {
  if (routeName === 'home') {
    return (
      <Image
        source={require('./assets/logo.jpg')}
        style={{ width: 96, height: 96, borderRadius: 48, opacity: focused ? 1 : 0.95, marginTop: -40 }}
        resizeMode="cover"
      />
    );
  }

  const size = focused ? 26 : 22;

  switch (routeName) {
    case 'identify':
      return <MaterialCommunityIcons name="camera" size={size} color={color} />;
    case 'calendar':
      return <MaterialCommunityIcons name="calendar" size={size} color={color} />;
    case 'garden':
      return <MaterialCommunityIcons name="flower" size={size} color={color} />;
    case 'shop':
      return <Entypo name="home" size={size} color={color} />;
    default:
      return null;
  }
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 14);
  const { theme, palette } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          height: 90 + bottomInset,
          paddingTop: 28,
          paddingBottom: bottomInset,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarItemStyle: route.name === 'Home' ? {
          marginTop: 0,
        } : undefined,
        tabBarBackground: () => <TabBarBackdrop bottomInset={bottomInset} />,
        tabBarIcon: ({ focused, color }) =>
          renderTabIcon(route.name.toLowerCase() as TabName, focused, color, theme),
      })}
    >
      <Tab.Screen name="Identify" component={IdentifyScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Garden" component={GardenScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
    </Tab.Navigator>
  );
}

function ThemedNavigation() {
  const { theme, palette } = useTheme();
  const { user, loading } = useAuth();
  
  const navTheme = theme === 'dark'
    ? {
        ...NavDarkTheme,
        colors: {
          ...NavDarkTheme.colors,
          background: palette.background,
          card: palette.surface,
          text: palette.text,
          border: palette.border,
          primary: palette.primary,
        },
      }
    : {
        ...NavLightTheme,
        colors: {
          ...NavLightTheme.colors,
          background: palette.background,
          card: palette.surface,
          text: palette.text,
          border: palette.border,
          primary: palette.primary,
        },
      };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <MaterialCommunityIcons name="leaf" size={64} color="#16a34a" />
        <Text style={{ marginTop: 16, fontSize: 18, color: palette.text }}>Loading...</Text>
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Drawer.Navigator
          screenOptions={{
            headerShown: false,
            drawerType: 'front',
            drawerStyle: { backgroundColor: palette.surface, width: 280 },
            drawerActiveTintColor: ACTIVE_COLOR,
            drawerInactiveTintColor: palette.text,
            drawerLabelStyle: { fontSize: 16, fontWeight: '600' },
          }}
        >
          <Drawer.Screen
            name="Tabs"
            component={MainTabs}
            options={{
              drawerLabel: () => null,
              title: 'Adams Eden',
              drawerItemStyle: { display: 'none' },
            }}
          />
          <Drawer.Screen
            name="Weather"
            component={WeatherScreen}
            options={{
              title: 'Weather',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="weather-partly-cloudy" color={color} size={size} />
              ),
            }}
          />
          <Drawer.Screen
            name="PlantDatabase"
            component={PlantDatabaseScreen}
            options={{
              title: 'Plant Database',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="sprout" color={color} size={size} />
              ),
            }}
          />
          <Drawer.Screen
            name="Journal"
            component={JournalScreen}
            options={{
              title: 'Journal',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="notebook" color={color} size={size} />
              ),
            }}
          />
          <Drawer.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account" color={color} size={size} />
              ),
            }}
          />
          <Drawer.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="cog" color={color} size={size} />
              ),
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        await initializeNotifications();
        await registerWeatherBackgroundTask();
      } catch {}
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <GardenProvider>
              <ErrorBoundary>
                {firebaseInitError ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={72} color="#dc2626" />
                    <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>App configuration error</Text>
                    <Text style={{ marginTop: 12, fontSize: 14, textAlign: 'center', opacity: 0.8 }}>
                      Firebase failed to initialize. Please update the app once a fix is deployed.
                    </Text>
                    <Text style={{ marginTop: 12, fontSize: 12, textAlign: 'center', opacity: 0.6 }}>
                      {String(firebaseInitError)}
                    </Text>
                  </View>
                ) : (
                  <ThemedNavigation />
                )}
              </ErrorBoundary>
            </GardenProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
