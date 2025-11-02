import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
  SafeAreaView as RN_SafeAreaView,
} from 'react-native';


import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { appStyles, windowMetrics } from './src/styles/appStyles';

type Plant = {
  id: number;
  name: string;
  category: string;
  image: string; // emoji or URI
  startSeedIndoor: string;
  startSeedOutdoor: string;
  transplantOutdoor: string;
  harvestDate: string;
  indoorOutdoor: string;
  daysToHarvest: number;
  transplantDay: number;
};

type Garden = {
  id: number;
  name: string;
  bedType: string;
  rows: number;
  cols: number;
  grid: (Plant | null)[][];
};

type TrackedPlant = Plant & {
  id: number; // unique tracking id
  seedPlantedDate: string;
  daysGrown: number;
};

const WINDOW = windowMetrics ?? Dimensions.get('window');

const plantDatabase: Plant[] = [
  { id: 1, name: 'Tomato', category: 'vegetables', image: '🍅', startSeedIndoor: 'Mar 15', startSeedOutdoor: 'N/A', transplantOutdoor: 'May 15', harvestDate: 'Jul 24', indoorOutdoor: 'Start Indoor', daysToHarvest: 75, transplantDay: 42 },
  { id: 2, name: 'Lettuce', category: 'vegetables', image: '🥬', startSeedIndoor: 'Mar 1', startSeedOutdoor: 'Apr 1', transplantOutdoor: 'Apr 15', harvestDate: 'May 30', indoorOutdoor: 'Indoor or Outdoor', daysToHarvest: 45, transplantDay: 30 },
  { id: 3, name: 'Carrots', category: 'vegetables', image: '🥕', startSeedIndoor: 'N/A', startSeedOutdoor: 'Apr 10', transplantOutdoor: 'Direct seed', harvestDate: 'Jun 14', indoorOutdoor: 'Outdoor Only', daysToHarvest: 65, transplantDay: 0 },
  { id: 4, name: 'Peppers', category: 'vegetables', image: '🌶️', startSeedIndoor: 'Mar 1', startSeedOutdoor: 'N/A', transplantOutdoor: 'May 25', harvestDate: 'Aug 8', indoorOutdoor: 'Start Indoor', daysToHarvest: 75, transplantDay: 56 },
  { id: 5, name: 'Basil', category: 'herbs', image: '🌿', startSeedIndoor: 'Mar 20', startSeedOutdoor: 'May 15', transplantOutdoor: 'May 20', harvestDate: 'Jul 4', indoorOutdoor: 'Indoor or Outdoor', daysToHarvest: 45, transplantDay: 30 },
  { id: 6, name: 'Cilantro', category: 'herbs', image: '🌿', startSeedIndoor: 'Mar 10', startSeedOutdoor: 'Apr 10', transplantOutdoor: 'Apr 25', harvestDate: 'Jun 19', indoorOutdoor: 'Indoor or Outdoor', daysToHarvest: 55, transplantDay: 35 },
  { id: 7, name: 'Marigold', category: 'flowers', image: '🌼', startSeedIndoor: 'Apr 1', startSeedOutdoor: 'May 10', transplantOutdoor: 'May 15', harvestDate: 'Jul 2', indoorOutdoor: 'Indoor or Outdoor', daysToHarvest: 48, transplantDay: 30 },
  { id: 8, name: 'Sunflower', category: 'flowers', image: '🌻', startSeedIndoor: 'N/A', startSeedOutdoor: 'May 1', transplantOutdoor: 'Direct seed', harvestDate: 'Jul 25', indoorOutdoor: 'Outdoor Only', daysToHarvest: 85, transplantDay: 0 }
];

type Props = { initialTab?: 'identify' | 'calendar' | 'garden' | 'shop' | 'home' };

function AppInner({ initialTab }: Props) {
  const [activeTab, setActiveTab] = useState((initialTab || 'home') as 'identify' | 'calendar' | 'garden' | 'shop' | 'home');
  const [gardenSubTab, setGardenSubTab] = useState('tracker' as 'tracker' | 'planner');
  const [selectedZone] = useState('6b');
  const [gardens, setGardens] = useState([] as Garden[]);
  const [showNewGardenModal, setShowNewGardenModal] = useState(false);
  const [selectedGarden, setSelectedGarden] = useState(null as Garden | null);
  const [showPlantSelectorModal, setShowPlantSelectorModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null as { row: number; col: number } | null);
  const [addedPlants, setAddedPlants] = useState([] as Plant[]);
  const [trackedPlants, setTrackedPlants] = useState([] as TrackedPlant[]);
  const [showPlantTrackerModal, setShowPlantTrackerModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [plantSelectorMode, setPlantSelectorMode] = useState<'garden' | 'calendar'>('garden');
  const [newName, setNewName] = useState('');
  const [newBedType, setNewBedType] = useState('Raised Bed');
  const [newRows, setNewRows] = useState('4');
  const [newCols, setNewCols] = useState('4');

  const auth = useAuth();

  // When a user is present (either after login or restored), make Home the landing tab.
  React.useEffect(() => {
    if (auth && auth.user) {
      setActiveTab('home');
    }
  }, [auth?.user]);

  // animation for tab transitions: fade + slight lift
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // restart animation when activeTab changes
    contentOpacity.setValue(0);
    contentTranslate.setValue(8);
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(contentTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [activeTab]);

  // Log auth state for debugging
  useEffect(() => {
    console.log('[App] auth state', { loading: auth?.loading, user: auth?.user });
    console.log('[App] activeTab', activeTab);
  }, [auth?.loading, auth?.user, activeTab]);

  // Wait while auth is loading. After loading, if there's no user show fullscreen login.
  if (!auth) return null;
  if (auth.loading) {
    return (
      <RN_SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ marginTop: 12, color: '#6b7280' }}>Checking credentials...</Text>
      </RN_SafeAreaView>
    );
  }
  if (!auth.user) {
    return (
      <RN_SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoginScreen onClose={() => { /* login will update auth and re-render */ }} />
      </RN_SafeAreaView>
    );
  }

  const handleCreateGarden = () => {
    const rows = Math.max(1, Math.min(20, parseInt(newRows) || 4));
    const cols = Math.max(1, Math.min(20, parseInt(newCols) || 4));
    const gardenData: Garden = {
      id: Date.now(),
      name: newName || `Garden ${gardens.length + 1}`,
      bedType: newBedType,
      rows,
      cols,
      grid: Array(rows).fill(null).map(() => Array(cols).fill(null))
    };
    setGardens(prev => [...prev, gardenData]);
    setSelectedGarden(gardenData);
    setShowNewGardenModal(false);
    setNewName(''); setNewRows('4'); setNewCols('4');
  };

  const handlePlacePlant = (plant: Plant) => {
    if (!selectedCell || !selectedGarden) return;
    const updated = gardens.map(g => {
      if (g.id === selectedGarden.id) {
        const newGrid = g.grid.map(r => [...r]);
        newGrid[selectedCell.row][selectedCell.col] = plant;
        return { ...g, grid: newGrid };
      }
      return g;
    });
    setGardens(updated);
    setSelectedGarden(updated.find(g => g.id === selectedGarden.id) || null);
    if (!addedPlants.find(p => p.id === plant.id)) setAddedPlants(prev => [...prev, { ...plant }]);
    setShowPlantSelectorModal(false);
    setSelectedCell(null);
  };

  const handleRemovePlant = (row: number, col: number) => {
    if (!selectedGarden) return;
    Alert.alert('Remove Plant', 'Remove plant from this cell?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const updated = gardens.map(g => {
          if (g.id === selectedGarden.id) {
            const newGrid = g.grid.map(r => [...r]);
            newGrid[row][col] = null;
            return { ...g, grid: newGrid };
          }
          return g;
        });
        setGardens(updated);
        setSelectedGarden(updated.find(g => g.id === selectedGarden.id) || null);
      }}
    ]);
  };

  const handleAddPlant = (plant: Plant) => {
    setAddedPlants(prev => {
      if (prev.some(p => p.id === plant.id)) return prev;
      return [...prev, { ...plant }];
    });
    setShowPlantSelectorModal(false);
  };

  const handleRemoveCalendarPlant = (plantId: number) => {
    setAddedPlants(prev => prev.filter(p => p.id !== plantId));
  };

  const handleStartTracking = (plant: Plant) => {
    const newTracked: TrackedPlant = {
      ...plant,
      id: Date.now(),
      seedPlantedDate: new Date().toISOString(),
      daysGrown: 0
    };
    setTrackedPlants(prev => [...prev, newTracked]);
    setShowPlantTrackerModal(false);
  };

  const handleRemoveTrackedPlant = (trackedId: number) => {
    setTrackedPlants(prev => prev.filter(p => p.id !== trackedId));
  };

  const calculateProgress = (plant: TrackedPlant) => {
    const seedDate = new Date(plant.seedPlantedDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - seedDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      daysPassed,
      percentComplete: Math.min((daysPassed / plant.daysToHarvest) * 100, 100),
      transplantReached: daysPassed >= plant.transplantDay,
      harvestReady: daysPassed >= plant.daysToHarvest
    };
  };

  const renderGardenGrid = (garden: Garden) => {
    const cellSize = 72;
    const width = garden.cols * (cellSize + 8);
    return (
      <View style={[styles.gridContainer, { width }]}>
        {garden.grid.map((row, rowIdx) => (
          <View key={`r-${rowIdx}`} style={styles.gridRow}>
            {row.map((cell, colIdx) => (
              <TouchableOpacity
                key={`${rowIdx}-${colIdx}`}
                style={[styles.cell, cell ? styles.cellFilled : styles.cellEmpty]}
                onPress={() => {
                  if (cell) {
                    Alert.alert('Remove', `Remove ${cell.name}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => handleRemovePlant(rowIdx, colIdx) }
                    ]);
                  } else {
                    setPlantSelectorMode('garden');
                    setSelectedCell({ row: rowIdx, col: colIdx });
                    setShowPlantSelectorModal(true);
                  }
                }}
              >
                {cell ? (
                  <View style={styles.cellContent}>
                    <TouchableOpacity
                      style={styles.cellRemove}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${cell.name} from garden cell`}
                      onPress={() => handleRemovePlant(rowIdx, colIdx)}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#b91c1c" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 28 }}>{cell.image}</Text>
                    <Text style={styles.cellLabel}>{cell.name}</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Entypo name="plus" size={28} color="#6b7280" />
                    <Text style={styles.cellAdd}>Add</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <View style={{ width: 120, height: 120, borderRadius: 999, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="leaf" size={48} color="#fff" />
            </View>
            <Text style={[styles.h2, { marginTop: 12 }]}>Welcome to Adams Eden</Text>
            <Text style={[styles.p, { textAlign: 'center', marginTop: 8 }]}>Your garden companion — plan, plant, and track with ease.</Text>
          </View>
        </ScrollView>
      );
    }
    if (activeTab === 'identify') {
      return (
        <View style={styles.centeredColumn}>
          <MaterialCommunityIcons name="camera" size={64} color="#16a34a" />
          <Text style={styles.h2}>Plant Identification</Text>
          <Text style={styles.p}>Take a photo to identify any plant instantly</Text>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => Alert.alert('Camera', 'Open camera (not implemented)')}>
            <Text style={[styles.btnText, styles.btnTextPrimary]}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'calendar') {
      if (!auth?.user) {
        return (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={styles.h2}>Protected</Text>
            <Text style={styles.p}>Please sign in to view your calendar.</Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]} onPress={() => setShowLoginModal(true)}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <ScrollView>
          <View style={styles.rowBetween}>
            <Text style={styles.h2}>Garden Calendar</Text>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                setPlantSelectorMode('calendar');
                setSelectedCell(null);
                setShowPlantSelectorModal(true);
              }}
            >
              <Entypo name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {addedPlants.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.h3}>My Planting Schedule</Text>
              {addedPlants.map((plant) => (
                <View key={plant.id} style={styles.scheduleItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 28 }}>{plant.image}</Text>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.h4}>{plant.name}</Text>
                      <Text style={styles.small}>{plant.indoorOutdoor}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${plant.name} from schedule`}
                    onPress={() => handleRemoveCalendarPlant(plant.id)}
                    style={styles.iconButtonDanger}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#b91c1c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.card, { backgroundColor: '#059669' }]}> 
            <Text style={[styles.h3, { color: '#fff' }]}>Zone {selectedZone}</Text>
            <Text style={{ color: '#e6ffee' }}>Your personalized planting calendar</Text>
          </View>
        </ScrollView>
      );
    }

    // Garden tab
    if (activeTab === 'garden') {
      if (!auth?.user) {
        return (
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={styles.h2}>Protected</Text>
            <Text style={styles.p}>Please sign in to view your garden.</Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]} onPress={() => setShowLoginModal(true)}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <ScrollView>
          <View style={styles.rowBetween}>
            <Text style={styles.h2}>My Garden</Text>
          </View>

          <View style={styles.subTabRow}>
            <TouchableOpacity onPress={() => setGardenSubTab('tracker')} style={[styles.subTabButton, gardenSubTab === 'tracker' && styles.subTabActive]}>
              <Text style={gardenSubTab === 'tracker' ? styles.subTabTextActive : styles.subTabText}>Tracker</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGardenSubTab('planner')} style={[styles.subTabButton, gardenSubTab === 'planner' && styles.subTabActive]}>
              <Text style={gardenSubTab === 'planner' ? styles.subTabTextActive : styles.subTabText}>Garden Planner</Text>
            </TouchableOpacity>
          </View>

          {gardenSubTab === 'tracker' ? (
            <View>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { alignSelf: 'flex-end' }]} onPress={() => setShowPlantTrackerModal(true)}>
                <Text style={[styles.btnText, styles.btnTextPrimary]}>Track Plant</Text>
              </TouchableOpacity>

              {trackedPlants.length === 0 ? (
                <View style={[styles.centeredCard]}>
                  <MaterialCommunityIcons name="leaf" size={64} color="#16a34a" />
                  <Text style={styles.h3}>Start Tracking Your Plants</Text>
                  <Text style={styles.p}>Monitor growth from seed to harvest</Text>
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setShowPlantTrackerModal(true)}>
                    <Text style={[styles.btnText, styles.btnTextPrimary]}>Track Your First Plant</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                trackedPlants.map(tp => {
                  const progress = calculateProgress(tp);
                  return (
                    <View key={tp.id} style={styles.card}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 36 }}>{tp.image}</Text>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.h3}>{tp.name}</Text>
                          <Text style={styles.small}>Day {progress.daysPassed} of {tp.daysToHarvest}</Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: progress.harvestReady ? '#16a34a' : '#9ca3af' }}>{Math.round(progress.percentComplete)}%</Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Stop tracking ${tp.name}`}
                          onPress={() => handleRemoveTrackedPlant(tp.id)}
                          style={[styles.iconButtonDanger, { marginLeft: 8 }]}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#b91c1c" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ height: 10, backgroundColor: '#e5e7eb', borderRadius: 999, marginTop: 12, overflow: 'hidden' }}>
                        <View style={{ width: `${progress.percentComplete}%`, height: '100%', backgroundColor: '#34d399' }} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { alignSelf: 'flex-end' }]} onPress={() => setShowNewGardenModal(true)}>
                <Text style={[styles.btnText, styles.btnTextPrimary]}>New Garden</Text>
              </TouchableOpacity>

              {gardens.length === 0 ? (
                <View style={[styles.centeredCard]}>
                  <MaterialCommunityIcons name="leaf" size={64} color="#16a34a" />
                  <Text style={styles.h3}>Start Your Garden Journey</Text>
                  <Text style={styles.p}>Create your first garden to start planning</Text>
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setShowNewGardenModal(true)}>
                    <Text style={[styles.btnText, styles.btnTextPrimary]}>Create Your First Garden</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                    {gardens.map(g => (
                      <TouchableOpacity key={g.id} style={[styles.gardenBtn, selectedGarden && selectedGarden.id === g.id ? styles.gardenBtnActive : styles.gardenBtnInactive]} onPress={() => setSelectedGarden(g)}>
                        <Text style={selectedGarden && selectedGarden.id === g.id ? styles.gardenBtnTextActive : styles.gardenBtnTextInactive}>{g.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {selectedGarden && (
                    <View style={[styles.card, { backgroundColor: '#fffbe6' }]}> 
                      <Text style={styles.h3}>{selectedGarden.name}</Text>
                      <View style={{ flexDirection: 'row', marginVertical: 8 }}>
                        <View style={[styles.tag, { marginRight: 8 }]}><Text style={styles.small}>{selectedGarden.bedType}</Text></View>
                        <View style={styles.tag}><Text style={styles.small}>{selectedGarden.rows}x{selectedGarden.cols} Grid</Text></View>
                      </View>

                      <ScrollView horizontal style={{ marginTop: 8 }}>
                        {renderGardenGrid(selectedGarden)}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      );
    }

    return (
      <View style={styles.centeredColumn}><Text style={styles.h2}>Shop coming soon!</Text></View>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <RN_SafeAreaView style={[styles.container, { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(12, insets.bottom) }]}> 
      <View style={styles.header}>
        <View>
          <Text style={styles.smallMuted}>Zone {selectedZone}</Text>
          <Text style={styles.smallMuted}>Branson, MO</Text>
        </View>

        <Text style={styles.title}>Adams Eden</Text>

        <View style={{ alignItems: 'flex-end' }}>
          {auth?.user ? (
            <TouchableOpacity onPress={() => auth.logout()} style={{ padding: 6 }}>
              <Text style={[styles.smallMuted, { color: '#16a34a' }]}>Sign out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowLoginModal(true)} style={{ padding: 6 }}>
              <Text style={styles.smallMuted}>Sign in</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.smallMuted}>72°F</Text>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }]}>
        {renderContent()}
      </Animated.View>

      {/* Plant tracker modal */}
      <Modal visible={showPlantTrackerModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.h2}>Choose Plant to Track</Text>
            <FlatList
              data={plantDatabase}
              keyExtractor={(i) => String(i.id)}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.plantCard} onPress={() => handleStartTracking(item)}>
                  <Text style={{ fontSize: 36 }}>{item.image}</Text>
                  <Text style={styles.h4}>{item.name}</Text>
                  <Text style={styles.small}>{item.daysToHarvest} days</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowPlantTrackerModal(false)} style={[styles.btn, { marginTop: 12 }]}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New garden modal */}
      <Modal visible={showNewGardenModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.h2}>Create New Garden</Text>
            <TextInput placeholder="Garden name" value={newName} onChangeText={setNewName} style={styles.input} />
            <TextInput placeholder="Bed type" value={newBedType} onChangeText={setNewBedType} style={styles.input} />
            <View style={{ flexDirection: 'row' }}>
              <TextInput placeholder="Rows" value={newRows} onChangeText={setNewRows} keyboardType="number-pad" style={[styles.input, { flex: 1, marginRight: 8 }]} />
              <TextInput placeholder="Cols" value={newCols} onChangeText={setNewCols} keyboardType="number-pad" style={[styles.input, { flex: 1 }]} />
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => setShowNewGardenModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1, marginLeft: 8 }]} onPress={handleCreateGarden}>
                <Text style={[styles.btnText, styles.btnTextPrimary]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Plant selector modal (for placing into grid) */}
      <Modal visible={showPlantSelectorModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={styles.h2}>Choose Plant</Text>
            <FlatList
              data={plantDatabase}
              keyExtractor={(i) => String(i.id)}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.plantCardSmall}
                  onPress={() => {
                    if (plantSelectorMode === 'calendar') {
                      handleAddPlant(item);
                    } else {
                      handlePlacePlant(item);
                    }
                  }}
                >
                  <Text style={{ fontSize: 36 }}>{item.image}</Text>
                  <Text style={styles.h4}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowPlantSelectorModal(false)} style={[styles.btn, { marginTop: 12 }]}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Login modal */}
      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <LoginScreen onClose={() => setShowLoginModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Floating bottom tab bar */}
      <View style={[styles.floatingTabWrap, { bottom: Math.max(12, insets.bottom + 8) }]}> 
        <View style={styles.floatingTabBar}>
          <TouchableOpacity style={styles.tabBtnFloating} onPress={() => setActiveTab('identify')}>
            <MaterialCommunityIcons name="camera" size={20} color={activeTab === 'identify' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtnFloating} onPress={() => { if (!auth?.user) setShowLoginModal(true); else setActiveTab('calendar'); }}>
            <MaterialCommunityIcons name="calendar" size={20} color={activeTab === 'calendar' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabCenterFloating} onPress={() => setActiveTab('home')}>
            <View style={styles.tabCenterInner}><MaterialCommunityIcons name="leaf" size={22} color="#fff" /></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtnFloating} onPress={() => { if (!auth?.user) setShowLoginModal(true); else setActiveTab('garden'); }}>
            <MaterialCommunityIcons name="flower" size={20} color={activeTab === 'garden' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtnFloating} onPress={() => setActiveTab('shop')}>
            <Entypo name="home" size={20} color={activeTab === 'shop' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </View>
    </RN_SafeAreaView>
  );
}

export default function AdamsEdenAppNative(props: Props) {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppInner {...props} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = appStyles;
