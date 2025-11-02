import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mapWeatherCodeToIcon } from '../services/weatherService';
import { DrawerActions, NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGarden } from '../context/GardenContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, Easing } from 'react-native-reanimated';

type HeaderBarProps = {
  showBack?: boolean;
  onMenuPress?: () => void;
  showHome?: boolean;
  homeOnly?: boolean;
};

const DEFAULT_ZONE = '6b';

export const HeaderBar: React.FC<HeaderBarProps> = ({ showBack = false, onMenuPress, showHome = false, homeOnly = false }) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const { location, weather, isWeatherLoading, temperatureUnit } = useGarden();
  const { palette } = useTheme();
  const { user } = useAuth();

  const zoneLabel = location?.hardinessZone ?? DEFAULT_ZONE;
  const locationLabel = location?.locationName?.length
    ? location.locationName
    : 'Default schedule';
  const suffix = temperatureUnit === 'C' ? 'C' : 'F';
  const currentTemp = weather && Number.isFinite(weather.currentTempF)
    ? `${Math.round(weather.currentTempF)}°${suffix}`
    : (isWeatherLoading ? '…' : '—');
  const smallCondition = weather?.conditionText ? weather.conditionText : '';
  const weatherIconName = weather ? mapWeatherCodeToIcon(weather.currentCode) : 'thermometer';
  const animKey = weatherIconName + currentTemp + smallCondition;
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  React.useEffect(() => {
    opacity.value = 0;
    scale.value = 0.9;
    opacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [animKey, opacity, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  const handlePress = React.useCallback(() => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    if (showBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation, onMenuPress, showBack]);

  const goHome = React.useCallback(() => {
    try {
      // Navigate to the Home tab within the Tabs drawer item
      (navigation as any).navigate('Tabs', { screen: 'Home' });
    } catch {
      // Fallback: try direct navigation if available
      (navigation as any).navigate('Home');
    }
  }, [navigation]);

  return (
    <View style={{ backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.border, paddingTop: Math.max(insets.top, 12) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
          {homeOnly ? (
            <TouchableOpacity
              onPress={goHome}
              accessibilityRole="button"
              accessibilityLabel="Go home"
              style={{ padding: 8, borderRadius: 999, backgroundColor: palette.surfaceMuted }}
            >
              <MaterialCommunityIcons name="home" size={20} color={palette.primary} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handlePress}
                accessibilityRole="button"
                accessibilityLabel={showBack ? 'Go back' : 'Open menu'}
                style={{ padding: 8, borderRadius: 999, backgroundColor: palette.surfaceMuted }}
              >
                <MaterialCommunityIcons
                  name={showBack ? 'arrow-left' : 'menu'}
                  size={22}
                  color={palette.primary}
                />
              </TouchableOpacity>

              {showHome && (
                <TouchableOpacity
                  onPress={goHome}
                  accessibilityRole="button"
                  accessibilityLabel="Go home"
                  style={{ padding: 8, borderRadius: 999, backgroundColor: palette.surfaceMuted, marginLeft: 8 }}
                >
                  <MaterialCommunityIcons name="home" size={20} color={palette.primary} />
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: palette.primary, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{locationLabel}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 12 }} numberOfLines={1}>Zone {zoneLabel}</Text>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: 'flex-end', minWidth: 96 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open weather forecast"
            onPress={() => navigation.navigate('Weather' as never)}
            style={{ alignItems: 'flex-end' }}
          >
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>{smallCondition || 'Current'}</Text>
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
              <Text style={{ color: palette.text, fontWeight: '700', fontSize: 18, marginRight: 4 }}>{currentTemp}</Text>
              {weather && (
                <MaterialCommunityIcons name={weatherIconName as any} size={20} color={palette.text} />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Avatar - Navigate to Profile */}
        {user && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile' as never)}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={{ marginLeft: 12 }}
          >
            <Avatar 
              photoURL={user.photoURL} 
              displayName={user.displayName} 
              email={user.email}
              size={36}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default HeaderBar;
