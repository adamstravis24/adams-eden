import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';
import { getWateringStatus } from '../services/wateringService';
import { useNavigation } from '@react-navigation/native';

const styles = appStyles;

export default function HomeScreen() {
  const { plantDatabase, trackedPlants, gardens, weather, calculateProgress } = useGarden();
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const navigation = useNavigation<any>();

  // Calculate stats
  const stats = useMemo(() => {
    const currentTemp = weather?.currentTempF;
    
    // Count plants needing water
    const needsWater = trackedPlants.filter(plant => {
      const status = getWateringStatus(plant, currentTemp);
      return status.urgency === 'overdue' || status.urgency === 'urgent' || status.urgency === 'due-soon';
    }).length;

    // Count plants ready to harvest
    const readyToHarvest = trackedPlants.filter(plant => {
      const progress = calculateProgress(plant);
      return progress.harvestReady;
    }).length;

    return {
      totalTracked: trackedPlants.length,
      needsWater,
      readyToHarvest,
      activeGardens: gardens.length,
    };
  }, [trackedPlants, gardens, weather, calculateProgress]);

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, paddingTop: 24 }}>
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={{ width: 100, height: 100, borderRadius: 20 }}
            resizeMode="contain"
          />
          <Text style={[t.h2, { marginTop: 12 }]}>Welcome to Adams Eden</Text>
          <Text style={[t.p, { textAlign: 'center', color: palette.textMuted }]}>
            Your garden companion — plan, plant, and track with ease.
          </Text>
        </View>

        {/* Quick Stats Cards */}
        <View style={{ marginTop: 12 }}>
          <Text style={[t.h3, { marginBottom: 12 }]}>Quick Stats</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {/* Tracked Plants Card */}
            <TouchableOpacity 
              style={[t.card, { flex: 1, minWidth: '45%', alignItems: 'center', padding: 20 }]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Garden' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="sprout" size={36} color={palette.primary} />
              <Text style={[t.h2, { marginTop: 8, fontSize: 32, color: palette.primary }]}>{stats.totalTracked}</Text>
              <Text style={[t.small, { color: palette.textMuted, textAlign: 'center' }]}>
                Tracked Plants
              </Text>
            </TouchableOpacity>

            {/* Needs Water Card */}
            <TouchableOpacity 
              style={[
                t.card, 
                { 
                  flex: 1, 
                  minWidth: '45%', 
                  alignItems: 'center', 
                  padding: 20,
                  borderColor: stats.needsWater > 0 ? '#3b82f6' : palette.border,
                  borderWidth: stats.needsWater > 0 ? 2 : 1,
                }
              ]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Garden' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="water" 
                size={36} 
                color={stats.needsWater > 0 ? '#3b82f6' : palette.textMuted} 
              />
              <Text style={[
                t.h2, 
                { 
                  marginTop: 8,
                  fontSize: 32, 
                  color: stats.needsWater > 0 ? '#3b82f6' : palette.textMuted 
                }
              ]}>
                {stats.needsWater}
              </Text>
              <Text style={[t.small, { color: palette.textMuted, textAlign: 'center' }]}>
                Need Water
              </Text>
            </TouchableOpacity>

            {/* Ready to Harvest Card */}
            <TouchableOpacity 
              style={[
                t.card, 
                { 
                  flex: 1, 
                  minWidth: '45%', 
                  alignItems: 'center', 
                  padding: 20,
                  borderColor: stats.readyToHarvest > 0 ? palette.primary : palette.border,
                  borderWidth: stats.readyToHarvest > 0 ? 2 : 1,
                }
              ]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Garden' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="basket" 
                size={36} 
                color={stats.readyToHarvest > 0 ? palette.primary : palette.textMuted} 
              />
              <Text style={[
                t.h2, 
                { 
                  marginTop: 8,
                  fontSize: 32, 
                  color: stats.readyToHarvest > 0 ? palette.primary : palette.textMuted 
                }
              ]}>
                {stats.readyToHarvest}
              </Text>
              <Text style={[t.small, { color: palette.textMuted, textAlign: 'center' }]}>
                Ready to Harvest
              </Text>
            </TouchableOpacity>

            {/* Active Gardens Card */}
            <TouchableOpacity 
              style={[t.card, { flex: 1, minWidth: '45%', alignItems: 'center', padding: 20 }]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Garden' })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="flower" size={36} color="#10b981" />
              <Text style={[t.h2, { marginTop: 8, fontSize: 32, color: '#10b981' }]}>{stats.activeGardens}</Text>
              <Text style={[t.small, { color: palette.textMuted, textAlign: 'center' }]}>
                Active Gardens
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Forecast */}
        {weather && (
          <View style={{ marginTop: 20 }}>
            <Text style={[t.h3, { marginBottom: 12 }]}>Today's Forecast</Text>
            
            <View style={[t.card, { padding: 20 }]}>
              {/* Frost Warning */}
              {weather.daily && (() => {
                const frostDays = weather.daily.filter(day => day.minF < 42);
                if (frostDays.length > 0) {
                  const firstFrostDay = frostDays[0];
                  const dayDate = new Date(firstFrostDay.date);
                  const today = new Date();
                  const isToday = dayDate.toDateString() === today.toDateString();
                  const isTomorrow = dayDate.toDateString() === new Date(today.getTime() + 86400000).toDateString();
                  
                  return (
                    <View style={{ 
                      marginBottom: 16, 
                      padding: 12, 
                      backgroundColor: '#3b82f6', 
                      borderRadius: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: '#1e40af'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="snowflake-alert" size={24} color="#ffffff" />
                        <Text style={[t.h4, { marginLeft: 8, color: '#ffffff', flex: 1 }]}>
                          ❄️ Frost Warning
                        </Text>
                      </View>
                      <Text style={[t.p, { marginTop: 8, color: '#ffffff' }]}>
                        {isToday 
                          ? `Temperatures will drop to ${Math.round(firstFrostDay.minF)}°F tonight. Protect sensitive plants!`
                          : isTomorrow
                          ? `Frost expected tomorrow night (low: ${Math.round(firstFrostDay.minF)}°F). Prepare to cover plants.`
                          : `Frost expected ${dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (low: ${Math.round(firstFrostDay.minF)}°F).`
                        }
                      </Text>
                      <Text style={[t.small, { marginTop: 8, color: '#dbeafe', fontWeight: '600' }]}>
                        💡 Cover tender plants or bring them indoors
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}

              {/* Current Temperature */}
              <View style={{ alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: palette.border }}>
                <MaterialCommunityIcons 
                  name={
                    weather.conditionText?.toLowerCase().includes('rain') ? 'weather-rainy' :
                    weather.conditionText?.toLowerCase().includes('cloud') ? 'weather-cloudy' :
                    weather.conditionText?.toLowerCase().includes('sun') || weather.conditionText?.toLowerCase().includes('clear') ? 'weather-sunny' :
                    'weather-partly-cloudy'
                  } 
                  size={64} 
                  color={palette.primary} 
                />
                <Text style={[t.h2, { fontSize: 48, marginTop: 8 }]}>
                  {Math.round(weather.currentTempF)}°F
                </Text>
                <Text style={[t.p, { color: palette.textMuted }]}>
                  {weather.conditionText || 'Current conditions'}
                </Text>
              </View>

              {/* Today's High/Low */}
              {weather.daily && weather.daily[0] && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.border }}>
                  <View style={{ alignItems: 'center' }}>
                    <MaterialCommunityIcons name="arrow-up" size={24} color="#f97316" />
                    <Text style={[t.h3, { color: '#f97316' }]}>
                      {Math.round(weather.daily[0].maxF)}°F
                    </Text>
                    <Text style={[t.small, { color: palette.textMuted }]}>High</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <MaterialCommunityIcons name="arrow-down" size={24} color="#3b82f6" />
                    <Text style={[t.h3, { color: '#3b82f6' }]}>
                      {Math.round(weather.daily[0].minF)}°F
                    </Text>
                    <Text style={[t.small, { color: palette.textMuted }]}>Low</Text>
                  </View>
                </View>
              )}

              {/* Watering Recommendation */}
              <View style={{ marginTop: 16, padding: 12, backgroundColor: palette.background, borderRadius: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name="water" 
                    size={24} 
                    color={weather.currentTempF >= 85 ? '#f97316' : '#3b82f6'} 
                  />
                  <Text style={[t.h4, { marginLeft: 8, flex: 1 }]}>
                    Garden Watering Advice
                  </Text>
                </View>
                <Text style={[t.p, { marginTop: 8, color: palette.text }]}>
                  {weather.currentTempF >= 95
                    ? '🔥 Very hot today! Check your plants frequently and water as needed.'
                    : weather.currentTempF >= 85
                    ? '☀️ Hot day ahead. Your plants may need extra water.'
                    : weather.currentTempF >= 75
                    ? '🌤️ Pleasant conditions. Water according to your normal schedule.'
                    : weather.currentTempF >= 65
                    ? '⛅ Mild weather. Plants need less water today.'
                    : '❄️ Cool day. Reduce watering frequency.'}
                </Text>
                {stats.needsWater > 0 && (
                  <Text style={[t.small, { marginTop: 8, color: '#3b82f6', fontWeight: '600' }]}>
                    💧 {stats.needsWater} plant{stats.needsWater === 1 ? '' : 's'} need{stats.needsWater === 1 ? 's' : ''} attention
                  </Text>
                )}
              </View>

              {/* Hourly Preview (next 6 hours) */}
              {weather.hourly && weather.hourly.length > 0 && (() => {
                const now = new Date();
                const futureHours = weather.hourly.filter(hour => new Date(hour.time) > now).slice(0, 6);
                return futureHours.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[t.h4, { marginBottom: 12 }]}>Next 6 Hours</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {futureHours.map((hour, idx) => (
                        <View 
                          key={idx} 
                          style={{ 
                            alignItems: 'center', 
                            marginRight: 16, 
                            padding: 12, 
                            backgroundColor: palette.background, 
                            borderRadius: 8,
                            minWidth: 70,
                          }}
                        >
                          <Text style={[t.small, { color: palette.textMuted }]}>
                            {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric' })}
                          </Text>
                          <MaterialCommunityIcons 
                            name={
                              hour.code >= 80 ? 'weather-rainy' :
                              hour.code >= 60 ? 'weather-pouring' :
                              hour.code >= 50 ? 'weather-rainy' :
                              hour.code >= 20 ? 'weather-cloudy' :
                              'weather-sunny'
                            } 
                            size={28} 
                            color={palette.primary} 
                            style={{ marginVertical: 8 }}
                          />
                          <Text style={[t.h4, { color: palette.text }]}>
                            {Math.round(hour.tempF)}°
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : null;
              })()}
            </View>
          </View>
        )}

        {/* Available Plants Info */}
        <View style={[t.card, { marginTop: 20, padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="database" size={24} color={palette.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={t.h4}>Plant Database</Text>
              <Text style={[t.small, { color: palette.textMuted }]}>
                {plantDatabase.length} plants available for tracking
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
