import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGarden } from '../context/GardenContext';
import { mapWeatherCodeToIcon } from '../services/weatherService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { HeaderBar } from '../components/HeaderBar';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { useTheme } from '../context/ThemeContext';

const styles = appStyles;

function formatHourLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric' });
}
function formatDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function WeatherScreen() {
  const { weather, isWeatherLoading, weatherError, refreshWeather, location, temperatureUnit, setTemperatureUnit } = useGarden();
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);

  // Frost alert threshold: trigger when forecast low is under 36°F (or ~2.2°C)
  const frostThreshold = temperatureUnit === 'F' ? 36 : 2.2;
  const frostRisk = React.useMemo(() => {
    if (!weather || !Array.isArray(weather.daily)) return { hasRisk: false as const, firstRiskDate: null as string | null, min: null as number | null };
    const risky = weather.daily.find(d => typeof d.minF === 'number' && d.minF < frostThreshold);
    return {
      hasRisk: Boolean(risky),
      firstRiskDate: risky?.date ?? null,
      min: risky?.minF ?? null,
    };
  }, [weather, frostThreshold]);

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
  <HeaderBar homeOnly />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Frost risk banner */}
        {frostRisk.hasRisk && frostRisk.firstRiskDate && typeof frostRisk.min === 'number' && (
          <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="snowflake-alert" size={20} color={palette.text} style={{ marginRight: 8 }} />
              <Text style={{ color: palette.text, fontWeight: '600' }}>Frost risk</Text>
            </View>
            <Text style={{ color: palette.text, marginTop: 4 }}>
              Forecast low of {Math.round(frostRisk.min)}°{temperatureUnit} on {new Date(frostRisk.firstRiskDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}.
            </Text>
            <Text style={{ color: palette.textMuted, marginTop: 4, fontSize: 12 }}>
              Alerts trigger for temperatures under 36°F.
            </Text>
          </View>
        )}
        <View style={[t.rowBetween, { alignItems: 'center' }]}>
          <Text style={t.h2}>Weather</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', backgroundColor: palette.surfaceMuted, borderRadius: 999, overflow: 'hidden', marginRight: 8 }}>
              {(['F','C'] as const).map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setTemperatureUnit(u)}
                  disabled={temperatureUnit === u}
                  style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: temperatureUnit === u ? palette.border : 'transparent' }}
                >
                  <Text style={{ fontWeight: '700', color: palette.text }}>{u}°</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              disabled={isWeatherLoading}
              onPress={() => refreshWeather(true)}
              style={[t.btn, t.btnPrimary, isWeatherLoading && { opacity: 0.6 }]}
            >
              <Text style={[t.btnText, t.btnTextPrimary]}>{isWeatherLoading ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {location && (
          <Text style={{ marginTop: 4, color: palette.text }}>
            {location.locationName} ({location.zip})
          </Text>
        )}

        {weatherError && (
          <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, padding: 12, borderRadius: 10, marginTop: 12 }}>
            <Text style={{ color: palette.text }}>{weatherError}</Text>
          </View>
        )}

        <View style={[t.card, { marginTop: 16 }]}>
          <Text style={t.h3}>Current</Text>
          <AnimatedCurrent weather={weather} />
          <Text style={{ color: palette.textMuted, marginTop: 4, fontSize: 12 }}>
            {weather?.conditionText ? weather.conditionText + ' · ' : ''}Updated {weather ? new Date(weather.fetchedAt).toLocaleTimeString() : '—'}
          </Text>
        </View>

        {weather && weather.hourly.length > 0 && (
          <View style={[t.card, { marginTop: 16 }]}>
            <Text style={t.h3}>Next 24 Hours</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {weather.hourly.map(pt => (
                <View key={pt.time} style={{ width: 64, alignItems: 'center', marginRight: 8 }}>
                  <Text style={{ fontSize: 12, color: palette.textMuted }}>{formatHourLabel(pt.time)}</Text>
                  <MaterialCommunityIcons
                    name={mapWeatherCodeToIcon(pt.code) as any}
                    size={26}
                    color={palette.text}
                    style={{ marginVertical: 2 }}
                  />
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>{Math.round(pt.tempF)}°{temperatureUnit}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {weather && weather.daily.length > 0 && (
          <View style={[t.card, { marginTop: 16 }]}>
            <Text style={t.h3}>7 Day Forecast</Text>
            {weather.daily.map(d => {
              const isFrostRisk = typeof d.minF === 'number' && d.minF < frostThreshold;
              return (
              <View key={d.date} style={[t.rowBetween, { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: palette.border }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name={mapWeatherCodeToIcon(d.code) as any}
                    size={26}
                    color={palette.text}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: '600' }}>{formatDayLabel(d.date)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isFrostRisk && (
                    <MaterialCommunityIcons name="snowflake" size={16} color={palette.text} style={{ marginRight: 6 }} />
                  )}
                  <Text style={{ fontSize: 14, color: isFrostRisk ? palette.text : palette.text }}>
                    {Math.round(d.minF)}°{temperatureUnit} / <Text style={{ fontWeight: '600' }}>{Math.round(d.maxF)}°{temperatureUnit}</Text>
                  </Text>
                </View>
              </View>
            );})}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const AnimatedCurrent: React.FC<{ weather: any }> = ({ weather }) => {
  const { temperatureUnit } = useGarden();
  const temp = weather ? Math.round(weather.currentTempF) : '—';
  const code = weather ? weather.currentCode : -1;
  const key = temp + ':' + code;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);
  React.useEffect(() => {
    opacity.value = 0;
    translateY.value = 6;
    opacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) });
  }, [key, opacity, translateY]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  const { palette } = useTheme();
  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }, style]}>
      <Text style={{ fontSize: 52, fontWeight: '600', color: palette.text }}>{temp}°{temperatureUnit}</Text>
      {weather && (
        <MaterialCommunityIcons
          name={mapWeatherCodeToIcon(code) as any}
          size={46}
          color={palette.text}
          style={{ marginLeft: 8 }}
        />
      )}
    </Animated.View>
  );
};
