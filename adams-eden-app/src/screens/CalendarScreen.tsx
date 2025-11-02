import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { Plant } from '../types/plants';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';

const styles = appStyles;

function formatDayOfYearLabel(day: number | null) {
  if (typeof day !== 'number' || !Number.isFinite(day)) return 'Unknown';

  const targetDay = Math.round(day);
  if (targetDay <= 0) return 'Unknown';

  const referenceYear = new Date().getFullYear();
  const date = new Date(referenceYear, 0, targetDay);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CalendarScreen() {
  const {
    addedPlants,
    plantDatabase,
    location,
    addPlantToList,
    removePlantFromList,
  } = useGarden();
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const [showPlantPicker, setShowPlantPicker] = React.useState(false);
  const [pickerQuery, setPickerQuery] = React.useState('');

  const handlePlantSelect = React.useCallback((plant: Plant) => {
    addPlantToList(plant);
    setShowPlantPicker(false);
    setPickerQuery('');
  }, [addPlantToList]);

  const handleRemoveFromSchedule = React.useCallback((plantId: string) => {
    removePlantFromList(plantId);
  }, [removePlantFromList]);

  const filteredPlants = React.useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return plantDatabase;
    return plantDatabase.filter(plant => (
      plant.name.toLowerCase().includes(query)
      || plant.category.toLowerCase().includes(query)
    ));
  }, [pickerQuery, plantDatabase]);

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
  <HeaderBar />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32, paddingTop: 16 }}>
        <View style={[t.rowBetween, { alignItems: 'center' }]}>
          <Text style={t.h2}>Garden Calendar</Text>
          <TouchableOpacity
            style={[t.btn, t.btnPrimary, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }]}
            onPress={() => setShowPlantPicker(true)}
          >
            <Entypo name="plus" size={16} color="#fff" />
            <Text style={[t.btnText, t.btnTextPrimary, { marginLeft: 4 }]}>Add Plant</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: palette.surface, padding: 16, borderRadius: 12, marginTop: 12, borderColor: palette.border, borderWidth: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: palette.primary }}>Location & Climate</Text>
          <Text style={{ fontSize: 12, color: palette.text, marginTop: 4 }}>
            {location
              ? `Using data from ${location.locationName} (${location.zip}).`
              : 'Set your ZIP code in Settings (open the drawer) to personalize planting dates.'}
          </Text>
          {!location && (
            <Text style={{ fontSize: 11, color: palette.primary, marginTop: 8 }}>
              Go to Settings to configure location & NOAA data.
            </Text>
          )}

          {location && (
            <View style={{ marginTop: 12, backgroundColor: palette.surface, borderRadius: 10, padding: 12, borderColor: palette.border, borderWidth: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: palette.primary }}>
                Spring frost: {formatDayOfYearLabel(location.springFrostDay)} (day {location.springFrostDay})
              </Text>
              {location.winterFrostDay !== null && (
                <Text style={{ fontSize: 13, color: palette.text, marginTop: 4 }}>
                  Fall frost: {formatDayOfYearLabel(location.winterFrostDay)} (day {location.winterFrostDay})
                </Text>
              )}
              {location.avgWinterTempF !== null && (
                <Text style={{ fontSize: 13, color: palette.text, marginTop: 4 }}>
                  Avg winter low: {location.avgWinterTempF.toFixed(1)}°F
                </Text>
              )}
              <Text style={{ fontSize: 12, color: palette.primary, marginTop: 6 }}>
                NOAA station: {location.stationName} ({location.stationId})
              </Text>
            </View>
          )}
        </View>

        {addedPlants.length === 0 ? (
          <View style={[t.card, { alignItems: 'center', marginTop: 16 }]}> 
            <Text style={t.h3}>Build your planting schedule</Text>
            <Text style={[t.p, { textAlign: 'center' }]}>Tap “Add Plant” to include veggies, herbs, and flowers you want to grow.</Text>
          </View>
        ) : (
          <View style={[t.card, { marginTop: 16 }]}> 
            <Text style={t.h3}>My Planting Schedule</Text>
            {addedPlants.map(plant => (
              <View key={plant.id} style={[styles.scheduleItem, { backgroundColor: palette.surface }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 28 }}>{plant.image}</Text>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={t.h4}>{plant.name}</Text>
                    <Text style={t.small}>{plant.indoorOutdoor}</Text>
                    <View style={{ marginTop: 6 }}>
                      {plant.startSeedIndoor !== 'Not applicable' && (
                        <Text style={{ fontSize: 12, color: palette.text }}>Indoor: {plant.startSeedIndoor}</Text>
                      )}
                      {plant.startSeedOutdoor !== 'Not applicable' && (
                        <Text style={{ fontSize: 12, color: palette.text }}>Outdoor: {plant.startSeedOutdoor}</Text>
                      )}
                      {plant.transplantOutdoor !== 'Not applicable' && (
                        <Text style={{ fontSize: 12, color: palette.text }}>Transplant: {plant.transplantOutdoor}</Text>
                      )}
                      <Text style={{ fontSize: 12, color: palette.text, marginTop: 4 }}>Harvest: {plant.harvestDate}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${plant.name} from schedule`}
                  onPress={() => handleRemoveFromSchedule(plant.id)}
                  style={[styles.iconButtonDanger, { marginLeft: 8 }]}
                >
                  <Entypo name="trash" size={18} color="#b91c1c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showPlantPicker} transparent animationType="fade" onRequestClose={() => setShowPlantPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={t.h2}>Add plant to schedule</Text>
            <TextInput
              placeholder="Search plants"
              value={pickerQuery}
              onChangeText={setPickerQuery}
              style={[styles.input, { marginTop: 12 }]}
            />
            <FlatList
              data={filteredPlants}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.plantCardSmall} onPress={() => handlePlantSelect(item)}>
                  <Text style={{ fontSize: 32 }}>{item.image}</Text>
                  <Text style={[t.h4, { marginTop: 6 }]}>{item.name}</Text>
                  <Text style={[t.small, { textTransform: 'capitalize' }]}>{item.category}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowPlantPicker(false)} style={[t.btn, { marginTop: 8 }]}>
              <Text style={t.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
