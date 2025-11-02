import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { useGarden } from '../context/GardenContext';
import { useAuth } from '../context/AuthContext';
import { Plant, TrackedPlant } from '../types/plants';
import { appStyles, makeThemedStyles, windowMetrics } from '../styles/appStyles';
import websitePlantDB from '../../assets/data/plant-database.json';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';
import { getWateringStatus } from '../services/wateringService';
import {
  analyzeGardenGrid,
  checkCompanionCompatibility,
  getCompanionRelationships,
  getPlantRequirements,
  getCompanionSuggestions,
  suggestRotation,
  getPlantFamily,
  SmartGridAlert,
} from '../services/companionPlantingService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const styles = appStyles;

// Garden Templates
type GardenTemplate = {
  name: string;
  description: string;
  icon: string;
  rows: number;
  cols: number;
  layout: string[][]; // Plant names at each position, empty string for empty cell
};

const GARDEN_TEMPLATES: GardenTemplate[] = [
  {
    name: 'Salad Garden',
    description: 'Fresh greens and vegetables for daily salads',
    icon: '🥗',
    rows: 4,
    cols: 4,
    layout: [
      ['Lettuce', 'Lettuce', 'Spinach', 'Spinach'],
      ['Lettuce', 'Lettuce', 'Spinach', 'Spinach'],
      ['Tomatoes', 'Cucumbers', 'Bell Peppers', 'Radish'],
      ['Tomatoes', 'Cucumbers', 'Bell Peppers', 'Radish'],
    ],
  },
  {
    name: 'Pizza Garden',
    description: 'Everything you need for homemade pizza',
    icon: '🍕',
    rows: 4,
    cols: 4,
    layout: [
      ['Tomatoes', 'Tomatoes', 'Basil', 'Basil'],
      ['Tomatoes', 'Tomatoes', 'Basil', 'Basil'],
      ['Bell Peppers', 'Bell Peppers', 'Onions', 'Onions'],
      ['Bell Peppers', 'Bell Peppers', 'Onions', 'Onions'],
    ],
  },
  {
    name: 'Pollinator Garden',
    description: 'Attract bees, butterflies, and beneficial insects',
    icon: '🦋',
    rows: 4,
    cols: 4,
    layout: [
      ['Sunflower', 'Sunflower', 'Lavender', 'Lavender'],
      ['Marigold', 'Marigold', 'Zinnia', 'Zinnia'],
      ['Cosmos', 'Cosmos', 'Black-Eyed Susan', 'Black-Eyed Susan'],
      ['Petunia', 'Petunia', 'Dahlia', 'Dahlia'],
    ],
  },
  {
    name: 'Herb Garden',
    description: 'Fresh herbs for cooking',
    icon: '🌿',
    rows: 3,
    cols: 3,
    layout: [
      ['Basil', 'Basil', 'Parsley'],
      ['Basil', 'Basil', 'Parsley'],
      ['', '', ''],
    ],
  },
  {
    name: 'Starter Garden',
    description: 'Easy-to-grow vegetables for beginners',
    icon: '🌱',
    rows: 4,
    cols: 4,
    layout: [
      ['Tomatoes', 'Tomatoes', 'Lettuce', 'Lettuce'],
      ['Tomatoes', 'Tomatoes', 'Lettuce', 'Lettuce'],
      ['Radish', 'Radish', 'Green Beans', 'Green Beans'],
      ['Radish', 'Radish', 'Green Beans', 'Green Beans'],
    ],
  },
  {
    name: 'Cottage Garden',
    description: 'Colorful mix of flowers and vegetables',
    icon: '🏡',
    rows: 4,
    cols: 4,
    layout: [
      ['Sunflower', 'Tomatoes', 'Rose', 'Lavender'],
      ['Zinnia', 'Basil', 'Marigold', 'Bell Peppers'],
      ['Cosmos', 'Lettuce', 'Petunia', 'Cucumbers'],
      ['Dahlia', 'Parsley', 'Geranium', 'Radish'],
    ],
  },
];

// Draggable Plant Cell Component
type DraggablePlantCellProps = {
  plant: Plant;
  cellSize: number;
  rowIdx: number;
  colIdx: number;
  gardenId: number;
  onDragStart: () => void;
  onDragEnd: (rowIdx: number, colIdx: number, absoluteX: number, absoluteY: number) => void;
  isDragging: boolean;
};

const DraggablePlantCell: React.FC<DraggablePlantCellProps> = ({
  plant,
  cellSize,
  rowIdx,
  colIdx,
  gardenId,
  onDragStart,
  onDragEnd,
  isDragging,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(1.3);
      zIndex.value = 9999;
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      const absoluteX = event.absoluteX;
      const absoluteY = event.absoluteY;
      
      runOnJS(onDragEnd)(rowIdx, colIdx, absoluteX, absoluteY);
      
      // Animate back to original position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
    })
    .minDistance(10); // Require 10px movement to start drag (prevents accidental drags)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      elevation: zIndex.value > 0 ? 9999 : 0,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={{ fontSize: Math.min(cellSize * 0.52, 44) }}>{plant.image}</Text>
          <Text style={{ 
            color: '#fff', 
            fontWeight: '600',
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
            fontSize: Math.min(cellSize * 0.13, 11)
          }}>{plant.name}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// Planner View Component - displays garden beds from Firebase
function PlannerView() {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const { user } = useAuth();
  const { plantDatabase } = useGarden();
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  // Create lookup maps for plant ID to emoji and name
  const { plantLookup, nameLookup } = useMemo(() => {
    const emojiMap = new Map();
    const nameMap = new Map();
    
    // Load from website's plant database (same one used by the website)
    console.log('[Planner] Loading plants from websitePlantDB. Plant count:', websitePlantDB.plants?.length);
    websitePlantDB.plants.forEach((plant: any, index: number) => {
      if (index < 3) {
        console.log('[Planner] Sample plant:', plant.id, plant.commonName, plant.emoji);
      }
      if (plant.emoji) {
        emojiMap.set(plant.id, plant.emoji);
      }
      if (plant.commonName) {
        nameMap.set(plant.id, plant.commonName);
      }
    });
    
    console.log('[Planner] After websitePlantDB:', emojiMap.size, 'plants loaded');
    console.log('[Planner] Sample lookup - plant_0021:', emojiMap.get('plant_0021'), nameMap.get('plant_0021'));
    console.log('[Planner] Sample lookup - plant_0004:', emojiMap.get('plant_0004'), nameMap.get('plant_0004'));
    
    // Also add from plantDatabase as fallback
    plantDatabase.forEach(plant => {
      if (!emojiMap.has(plant.id)) {
        emojiMap.set(plant.id, plant.image || '🌱');
      }
      if (!nameMap.has(plant.id)) {
        nameMap.set(plant.id, plant.name);
      }
    });
    
    console.log('[Planner] Plant lookup created. Total plants:', emojiMap.size);
    return { plantLookup: emojiMap, nameLookup: nameMap };
  }, [plantDatabase]);

  const loadGardenBeds = async () => {
    if (!user) return;
    
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      const gardenDoc = await getDoc(doc(db, 'users', user.id, 'gardens', 'default'));
      if (gardenDoc.exists()) {
        const data = gardenDoc.data();
        console.log('[Planner] Loaded garden data:', data);
        if (data.beds) {
          // Convert flat arrays back to 2D grids
          const loadedBeds = data.beds.map((bed: any) => {
            const grid: (string | null)[][] = [];
            for (let i = 0; i < bed.rows; i++) {
              grid.push(bed.grid.slice(i * bed.cols, (i + 1) * bed.cols));
            }
            console.log('[Planner] Bed grid sample:', bed.grid.slice(0, 5));
            return {
              ...bed,
              grid
            };
          });
          setBeds(loadedBeds);
          if (loadedBeds.length > 0 && !selectedBedId) {
            setSelectedBedId(loadedBeds[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading garden beds:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    console.log('[Planner] Refresh triggered by user');
    setRefreshing(true);
    setRefreshMessage('Syncing with website...');
    await loadGardenBeds();
    setRefreshMessage('✓ Garden plans updated!');
    setTimeout(() => setRefreshMessage(''), 2000);
  };

  useEffect(() => {
    if (!user) return;
    loadGardenBeds();
  }, [user]);

  const selectedBed = beds.find(b => b.id === selectedBedId);

  if (loading) {
    return (
      <View style={[t.card, { alignItems: 'center', marginTop: 12 }]}>
        <MaterialCommunityIcons name="loading" size={64} color={palette.primary} />
        <Text style={t.h3}>Loading Garden Plans...</Text>
      </View>
    );
  }

  if (beds.length === 0) {
    return (
      <View style={[t.card, { alignItems: 'center', marginTop: 12 }]}>
        <MaterialCommunityIcons name="sprout-outline" size={64} color={palette.primary} />
        <Text style={t.h3}>No Garden Plans Yet</Text>
        <Text style={[t.p, { textAlign: 'center', marginTop: 8 }]}>
          Create your first garden plan on the website to see it here!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[palette.primary]}
          tintColor={palette.primary}
        />
      }
    >
      <Text style={[t.h3, { marginTop: 12, marginBottom: 8 }]}>Your Garden Plans</Text>
      <Text style={[t.small, { color: palette.textMuted, marginBottom: 12 }]}>
        Pull down to refresh from website
      </Text>
      
      {/* Refresh Feedback Message */}
      {refreshMessage && (
        <View 
          style={[
            t.card, 
            { 
              backgroundColor: palette.primary,
              padding: 12,
              marginBottom: 12,
              alignItems: 'center'
            }
          ]}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
            {refreshMessage}
          </Text>
        </View>
      )}
      
      {/* Bed Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {beds.map(bed => (
          <TouchableOpacity
            key={bed.id}
            style={[
              t.btn,
              { marginRight: 8 },
              selectedBedId === bed.id && t.btnPrimary
            ]}
            onPress={() => setSelectedBedId(bed.id)}
          >
            <Text style={[t.btnText, selectedBedId === bed.id && t.btnTextPrimary]}>
              {bed.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Bed Display */}
      {selectedBed && (
        <View style={[t.card]}>
          <Text style={t.h3}>{selectedBed.name}</Text>
          <Text style={[t.small, { color: palette.textMuted, marginBottom: 12 }]}>
            {selectedBed.rows} × {selectedBed.cols} grid
          </Text>

          {/* Garden Grid */}
          <ScrollView horizontal>
            <View>
              {selectedBed.grid.map((row: any[], rowIndex: number) => (
                <View key={rowIndex} style={{ flexDirection: 'row' }}>
                  {row.map((cell: string | null, colIndex: number) => {
                    // Get the emoji and name for this plant ID
                    const plantEmoji = cell ? plantLookup.get(cell) || '🌱' : null;
                    const plantName = cell ? nameLookup.get(cell) || cell : null;
                    
                    if (cell && rowIndex < 2 && colIndex < 2) {
                      console.log('[Planner] Cell [' + rowIndex + ',' + colIndex + ']:', cell, '| Emoji:', plantEmoji, '| Name:', plantName, '| Has in lookup:', plantLookup.has(cell));
                    }
                    
                    return (
                      <View
                        key={`${rowIndex}-${colIndex}`}
                        style={{
                          width: 70,
                          height: 70,
                          borderWidth: 1,
                          borderColor: palette.border,
                          backgroundColor: cell ? palette.surfaceMuted : palette.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 4,
                        }}
                      >
                        {plantEmoji && (
                          <>
                            <Text style={{ fontSize: 28 }}>{plantEmoji}</Text>
                            <Text 
                              style={{ 
                                fontSize: 8, 
                                color: palette.text,
                                textAlign: 'center',
                                marginTop: 2,
                              }}
                              numberOfLines={2}
                            >
                              {plantName}
                            </Text>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

export default function GardenScreen() {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const {
    gardens,
    trackedPlants,
    createGarden,
    placePlant,
    removePlant,
    deleteGarden,
    restoreGarden,
    plantDatabase,
    locationError,
    startTracking,
    removeTrackedPlant,
    calculateProgress,
    updateTrackedPlantPlantedDate,
    logWatering,
    updateWateringSettings,
    toggleWateringReminder,
    weather,
  } = useGarden();

  const [selectedGardenId, setSelectedGardenId] = useState<number | null>(gardens.length ? gardens[0].id : null);
  const [gardenSubTab, setGardenSubTab] = useState<'tracker' | 'planner'>('tracker');
  const [plannerFilter, setPlannerFilter] = useState<'all' | 'vegetables' | 'flowers' | 'herbs'>('all');
  const [showNewGardenModal, setShowNewGardenModal] = useState(false);
  const [showPlantSelector, setShowPlantSelector] = useState(false);
  const [showPlantTrackerModal, setShowPlantTrackerModal] = useState(false);
  const [showPlantedModalFor, setShowPlantedModalFor] = useState<TrackedPlant | null>(null);
  const [showPlantInfoModal, setShowPlantInfoModal] = useState<Plant | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [plantedDaysAgo, setPlantedDaysAgo] = useState<string>('0');
  const [plantedCustomDate, setPlantedCustomDate] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newRows, setNewRows] = useState('4');
  const [newCols, setNewCols] = useState('4');
  const [plannerQuery, setPlannerQuery] = useState('');
  const [trackerQuery, setTrackerQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ garden: typeof gardens[number]; index: number } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag and drop state
  const [draggedPlant, setDraggedPlant] = useState<Plant | null>(null);
  const [draggedFromCell, setDraggedFromCell] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ row: number; col: number } | null>(null);
  const gridLayoutRef = useRef<{ x: number; y: number; rows: number; cols: number } | null>(null);
  
  // Cell layout tracking for drop detection
  const cellRefsRef = useRef<Map<string, View | null>>(new Map());

  // Smart features state
  const [showSmartAlerts, setShowSmartAlerts] = useState(false);
  const [showCompanionGuide, setShowCompanionGuide] = useState(false);
  const [selectedPlantForCompanions, setSelectedPlantForCompanions] = useState<Plant | null>(null);

  React.useEffect(() => {
    if (gardens.length === 0) {
      setSelectedGardenId(null);
    } else if (!selectedGardenId || !gardens.some(g => g.id === selectedGardenId)) {
      setSelectedGardenId(gardens[0].id);
    }
  }, [gardens, selectedGardenId]);

  const selectedGarden = useMemo(() => {
    if (!selectedGardenId) return null;
    return gardens.find(g => g.id === selectedGardenId) ?? null;
  }, [gardens, selectedGardenId]);

  // Smart grid analysis
  const smartAlerts = useMemo(() => {
    if (!selectedGarden || !showSmartAlerts) return [];
    return analyzeGardenGrid(selectedGarden.grid);
  }, [selectedGarden, showSmartAlerts]);

  const filteredPlannerPlants = useMemo(() => {
    const query = plannerQuery.trim().toLowerCase();
    let plants = plantDatabase;
    
    // Apply category filter
    if (plannerFilter === 'vegetables') {
      plants = plants.filter(plant => plant.plantType === 'vegetable' || plant.category === 'Vegetables');
    } else if (plannerFilter === 'flowers') {
      plants = plants.filter(plant => plant.plantType === 'flower' || plant.category === 'Flowers');
    } else if (plannerFilter === 'herbs') {
      plants = plants.filter(plant => plant.plantType === 'herb' || plant.category === 'Herbs');
    }
    
    // Apply search query
    if (!query) return plants;
    return plants.filter(plant => (
      plant.name.toLowerCase().includes(query)
      || plant.category.toLowerCase().includes(query)
      || plant.indoorOutdoor.toLowerCase().includes(query)
    ));
  }, [plannerQuery, plannerFilter, plantDatabase]);

  const filteredTrackerPlants = useMemo(() => {
    const query = trackerQuery.trim().toLowerCase();
    if (!query) return plantDatabase;
    return plantDatabase.filter(plant => (
      plant.name.toLowerCase().includes(query)
      || plant.category.toLowerCase().includes(query)
      || plant.indoorOutdoor.toLowerCase().includes(query)
    ));
  }, [trackerQuery, plantDatabase]);

  // Helper functions for visual styling
  const getPlantTypeColor = (plantType?: string) => {
    switch (plantType) {
      case 'vegetable': return { bg: '#ecfdf5', border: '#34d399', accent: '#10b981' };
      case 'flower': return { bg: '#fdf2f8', border: '#f472b6', accent: '#ec4899' };
      case 'herb': return { bg: '#f0fdf4', border: '#86efac', accent: '#22c55e' };
      case 'ornamental': return { bg: '#faf5ff', border: '#d8b4fe', accent: '#a855f7' };
      default: return { bg: '#ecfdf5', border: '#34d399', accent: '#10b981' };
    }
  };

  const getGrowthStage = (plant: Plant) => {
    // For planner grid, we can't show growth stage since plants aren't tracked yet
    // This is used for visual categorization instead
    const plantType = plant.plantType || 'vegetable';
    if (plantType === 'flower') return { label: '� Flower', color: '#ec4899' };
    if (plantType === 'herb') return { label: '🌿 Herb', color: '#22c55e' };
    if (plantType === 'ornamental') return { label: '� Ornamental', color: '#a855f7' };
    return { label: '🥬 Vegetable', color: '#10b981' };
  };

  const handleCreate = React.useCallback(() => {
    const rows = Math.max(1, Math.min(20, parseInt(newRows, 10) || 4));
    const cols = Math.max(1, Math.min(20, parseInt(newCols, 10) || 4));
    const id = createGarden(newName || `Garden ${gardens.length + 1}`, 'Raised Bed', rows, cols);
    setSelectedGardenId(id);
    setShowNewGardenModal(false);
    setNewName('');
    setNewRows('4');
    setNewCols('4');
  }, [createGarden, gardens.length, newCols, newName, newRows]);

  const handleApplyTemplate = React.useCallback((template: GardenTemplate) => {
    // Close modal first
    setShowTemplateModal(false);
    
    // Small delay to ensure modal closes
    setTimeout(() => {
      // If no garden exists, create one with the template dimensions
      if (!selectedGarden) {
        const newGardenId = createGarden(
          template.name,
          'Raised Bed',
          template.rows,
          template.cols
        );
        setSelectedGardenId(newGardenId);
        
        // Wait for garden to be created, then apply template
        setTimeout(() => {
          const newGarden = gardens.find(g => g.id === newGardenId);
          if (newGarden) {
            applyTemplateToGarden(template, newGarden);
          }
        }, 100);
        return;
      }
      
      // Garden exists - ask to confirm replacement
      Alert.alert(
        'Apply Template',
        `This will replace all plants in "${selectedGarden.name}" with the ${template.name} layout. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply',
            onPress: () => applyTemplateToGarden(template, selectedGarden),
          },
        ],
      );
    }, 100);
  }, [selectedGarden, gardens]);

  const applyTemplateToGarden = React.useCallback((template: GardenTemplate, garden: typeof gardens[number]) => {
    // Helper function to normalize plant names for matching
    const normalizeName = (name: string) => {
      const normalized = name.toLowerCase().trim();
      // Remove 's' at end for plural forms
      if (normalized.endsWith('s')) {
        return normalized.slice(0, -1);
      }
      return normalized;
    };

    // Clear the garden
    for (let r = 0; r < garden.rows; r++) {
      for (let c = 0; c < garden.cols; c++) {
        if (garden.grid[r][c]) {
          removePlant(garden.id, r, c);
        }
      }
    }
    
    // Apply template
    template.layout.forEach((row, rowIdx) => {
      row.forEach((plantName, colIdx) => {
        if (plantName && rowIdx < garden.rows && colIdx < garden.cols) {
          // Try exact match first
          let plant = plantDatabase.find(p => p.name === plantName);
          
          // Try case-insensitive
          if (!plant) {
            plant = plantDatabase.find(p => 
              p.name.toLowerCase() === plantName.toLowerCase()
            );
          }
          
          // Try normalized (handles plural/singular)
          if (!plant) {
            const normalizedTemplate = normalizeName(plantName);
            plant = plantDatabase.find(p => 
              normalizeName(p.name) === normalizedTemplate
            );
          }
          
          if (plant) {
            placePlant(garden.id, rowIdx, colIdx, plant);
          } else {
            console.warn(`Template plant "${plantName}" not found in database`);
          }
        }
      });
    });
  }, [plantDatabase, placePlant, removePlant]);

  const handlePlacePlant = React.useCallback((plant: Plant) => {
    if (!selectedGarden || !selectedCell) {
      Alert.alert('Error', 'Please select a cell in your garden first');
      return;
    }
    placePlant(selectedGarden.id, selectedCell.row, selectedCell.col, plant);
    setShowPlantSelector(false);
    setSelectedCell(null);
  }, [placePlant, selectedCell, selectedGarden]);

  const handleStartTrackingPlant = React.useCallback((plant: Plant) => {
    startTracking(plant);
    setShowPlantTrackerModal(false);
  }, [startTracking]);

  const handleRemoveTracked = React.useCallback((trackingId: string) => {
    removeTrackedPlant(trackingId);
  }, [removeTrackedPlant]);

  const handleDeleteGarden = React.useCallback((gardenId: number, gardenName: string) => {
    Alert.alert(
      'Delete garden',
      `Delete "${gardenName}"? This will remove the bed and any plants placed in its grid.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Capture the garden and its index for undo
            const idx = gardens.findIndex(g => g.id === gardenId);
            const g = gardens.find(g => g.id === gardenId);
            if (g && idx !== -1) {
              setLastDeleted({ garden: g, index: idx });
              if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current);
              }
              undoTimerRef.current = setTimeout(() => {
                setLastDeleted(null);
                undoTimerRef.current = null;
              }, 6000);
            }
            // If the deleted garden is currently selected, clear selection immediately
            setSelectedGardenId(prev => (prev === gardenId ? null : prev));
            deleteGarden(gardenId);
          },
        },
      ],
    );
  }, [deleteGarden, gardens]);

  const handleUndo = React.useCallback(() => {
    if (!lastDeleted) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    restoreGarden(lastDeleted.garden, lastDeleted.index);
    setSelectedGardenId(lastDeleted.garden.id);
    setLastDeleted(null);
  }, [lastDeleted, restoreGarden]);

  const handleDragStart = React.useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = React.useCallback((fromRow: number, fromCol: number, absoluteX: number, absoluteY: number) => {
    if (!selectedGarden) {
      setIsDragging(false);
      setDraggedPlant(null);
      setDraggedFromCell(null);
      return;
    }

    // Find which cell was dropped on by measuring each cell
    let targetRow = -1;
    let targetCol = -1;
    let foundTarget = false;

    const checkCells = Array.from(cellRefsRef.current.entries());
    let checked = 0;
    
    const measureNext = () => {
      if (checked >= checkCells.length || foundTarget) {
        // Done checking all cells
        if (targetRow !== -1 && targetCol !== -1 && (targetRow !== fromRow || targetCol !== fromCol)) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          
          const draggedPlant = selectedGarden.grid[fromRow][fromCol];
          const targetPlant = selectedGarden.grid[targetRow][targetCol];

          if (draggedPlant) {
            // Remove from original position
            removePlant(selectedGarden.id, fromRow, fromCol);
            
            // Place at target position
            placePlant(selectedGarden.id, targetRow, targetCol, draggedPlant);
            
            // If target had a plant, swap it to original position
            if (targetPlant) {
              placePlant(selectedGarden.id, fromRow, fromCol, targetPlant);
            }
          }
        }
        
        setIsDragging(false);
        setDraggedPlant(null);
        setDraggedFromCell(null);
        return;
      }
      
      const [key, ref] = checkCells[checked];
      checked++;
      
      if (ref && !foundTarget) {
        ref.measureInWindow((x, y, width, height) => {
          if (
            absoluteX >= x &&
            absoluteX <= x + width &&
            absoluteY >= y &&
            absoluteY <= y + height &&
            !foundTarget
          ) {
            const [row, col] = key.split('-').map(Number);
            targetRow = row;
            targetCol = col;
            foundTarget = true;
          }
          measureNext();
        });
      } else {
        measureNext();
      }
    };
    
    measureNext();
  }, [selectedGarden, placePlant, removePlant]);

  const renderGrid = (garden: typeof gardens[number]) => {
    // Calculate responsive cell size based on screen width
    const screenWidth = windowMetrics.width;
    const screenPadding = 24; // Padding from screen edge (12px on each side from ScrollView)
    const borderPadding = 24; // Garden bed border padding (12px on each side)
    const safePadding = 16; // Extra safety margin
    const cellGap = 4;
    
    // Total space we need to account for
    const totalPadding = screenPadding + borderPadding + safePadding;
    const totalGaps = (garden.cols - 1) * cellGap;
    
    // Calculate maximum available width for cells
    const availableWidth = screenWidth - totalPadding - totalGaps;
    const calculatedCellSize = Math.floor(availableWidth / garden.cols);
    const cellSize = Math.max(40, Math.min(calculatedCellSize, 80)); // Between 40-80px
    
    // Calculate actual grid width
    const gridWidth = (garden.cols * cellSize) + totalGaps;
    const containerWidth = Math.min(gridWidth + borderPadding, screenWidth - screenPadding);

    return (
      <View style={[styles.gardenBed, { width: containerWidth, maxWidth: '100%', alignSelf: 'center' }]}>
        {garden.grid.map((row, rowIdx) => (
          <View key={`r-${rowIdx}`} style={[styles.gridRow, { gap: cellGap }]}>
            {row.map((cell, colIdx) => {
              const colors = cell ? getPlantTypeColor(cell.plantType) : { bg: '#8b6f47', border: '#6b5437', accent: '#8b6f47' };
              const stage = cell ? getGrowthStage(cell) : null;
              const isDropTarget = dropTarget?.row === rowIdx && dropTarget?.col === colIdx;
              const isDraggingThisCell = draggedFromCell?.row === rowIdx && draggedFromCell?.col === colIdx;

              const cellElement = (
                <View
                  key={`${rowIdx}-${colIdx}`}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isDropTarget ? '#a5824a' : (cell ? '#6b5437' : '#8b6f47'),
                      borderWidth: isDragging && !isDraggingThisCell ? 2 : 0,
                      borderColor: isDragging ? '#fbbf24' : 'transparent',
                      borderStyle: isDragging ? 'dashed' : 'solid',
                      borderRadius: 8,
                      opacity: isDraggingThisCell && isDragging ? 0.3 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: cell ? 4 : 1 },
                      shadowOpacity: cell ? 0.3 : 0.15,
                      shadowRadius: cell ? 6 : 2,
                      elevation: cell ? 4 : 1,
                    }
                  ]}
                >
                  {cell ? (
                    <View 
                      ref={(ref) => { cellRefsRef.current.set(`${rowIdx}-${colIdx}`, ref); }}
                      style={styles.cellContent}
                      collapsable={false}
                    >
                      <TouchableOpacity
                        style={[styles.cellRemove, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${cell.name} from garden cell`}
                        onPress={() => {
                          if (!isDragging) {
                            removePlant(garden.id, rowIdx, colIdx);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="#7c2d12" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          if (!isDragging) {
                            // Single tap shows info
                            setShowPlantInfoModal(cell);
                          }
                        }}
                        style={{ flex: 1 }}
                      >
                        <DraggablePlantCell
                          plant={cell}
                          cellSize={cellSize}
                          rowIdx={rowIdx}
                          colIdx={colIdx}
                          gardenId={garden.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={isDragging}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      ref={(ref) => { cellRefsRef.current.set(`${rowIdx}-${colIdx}`, ref); }}
                      collapsable={false}
                      style={{ flex: 1 }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          if (!isDragging) {
                            // Add new plant
                            setSelectedCell({ row: rowIdx, col: colIdx });
                            setShowPlantSelector(true);
                          }
                        }}
                        style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
                      >
                        <MaterialCommunityIcons 
                          name={isDragging ? "arrow-collapse" : "seed"} 
                          size={Math.min(cellSize * 0.38, 32)} 
                          color={isDragging ? "#fbbf24" : "#a5824a"} 
                        />
                        <Text style={[styles.cellAdd, { 
                          color: isDragging ? '#fbbf24' : '#d4a574', 
                          fontWeight: '600', 
                          fontSize: Math.min(cellSize * 0.12, 10) 
                        }]}>
                          {isDragging ? 'Drop' : 'Plant'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );

              return cellElement;
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
        <HeaderBar />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32, paddingTop: 16 }}>
        {locationError && (
          <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: palette.border, marginBottom: 12 }}>
            <Text style={{ color: palette.text, fontWeight: '600' }}>{locationError}</Text>
          </View>
        )}

        <Text style={t.h2}>My Garden</Text>

        <View style={[styles.subTabRow, { marginTop: 12 }]}>
          <TouchableOpacity
            style={[styles.subTabButton, gardenSubTab === 'tracker' && styles.subTabActive, { marginRight: 8 }]}
            onPress={() => setGardenSubTab('tracker')}
          >
            <Text style={gardenSubTab === 'tracker' ? styles.subTabTextActive : styles.subTabText}>Tracker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTabButton, gardenSubTab === 'planner' && styles.subTabActive]}
            onPress={() => setGardenSubTab('planner')}
          >
            <Text style={gardenSubTab === 'planner' ? styles.subTabTextActive : styles.subTabText}>Planner</Text>
          </TouchableOpacity>
        </View>

        {gardenSubTab === 'tracker' ? (
          <View>
            <TouchableOpacity
              onPress={() => setShowPlantTrackerModal(true)}
              activeOpacity={0.8}
              style={{ alignSelf: 'flex-end', marginBottom: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>Track Plant</Text>
              </View>
            </TouchableOpacity>

            {trackedPlants.length === 0 ? (
              <View style={[t.card, { alignItems: 'center', padding: 32 }]}>
                <MaterialCommunityIcons name="leaf" size={64} color={palette.primary} />
                <Text style={[t.h3, { marginTop: 16, textAlign: 'center' }]}>Start Tracking Your Plants</Text>
                <Text style={[t.p, { marginTop: 8, textAlign: 'center', color: palette.textMuted }]}>Monitor growth from seed to harvest.</Text>
                <TouchableOpacity
                  onPress={() => setShowPlantTrackerModal(true)}
                  activeOpacity={0.8}
                  style={{ marginTop: 16 }}
                >
                  <View style={{ backgroundColor: palette.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' }}>Track Your First Plant</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              trackedPlants.map((tracked: TrackedPlant) => {
                const progress = calculateProgress(tracked);
                const currentTemp = weather?.currentTempF;
                const wateringStatus = getWateringStatus(tracked, currentTemp);
                
                return (
                  <View key={tracked.trackingId} style={{ ...t.card, marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
                    {/* Header with gradient */}
                    <View style={{ backgroundColor: progress.harvestReady ? '#16a34a' : palette.primary, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 36 }}>{tracked.image}</Text>
                      <View style={{ marginLeft: 14, flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>{tracked.name}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Day {progress.daysPassed} of {tracked.daysToHarvest}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
                          {Math.round(progress.percentComplete)}%
                        </Text>
                      </View>
                    </View>

                    {/* Body */}
                    <View style={{ padding: 16 }}>
                      {/* Next Milestone */}
                      <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: palette.primary }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 4 }}>Next Milestone</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: palette.primary }}>{progress.nextMilestone}</Text>
                      </View>

                      {/* Watering Status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: wateringStatus.color === '#3b82f6' ? '#dbeafe' : wateringStatus.color === '#f59e0b' ? '#fef3c7' : '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <MaterialCommunityIcons name="water" size={20} color={wateringStatus.color} />
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: wateringStatus.color }}>
                          {wateringStatus.message}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={{ height: 12, backgroundColor: '#e5e7eb', borderRadius: 999, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                        <View style={{ width: `${progress.percentComplete}%`, height: '100%', backgroundColor: progress.harvestReady ? '#16a34a' : palette.primary, borderRadius: 999 }} />
                      </View>

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Water ${tracked.name}`}
                          onPress={() => logWatering(tracked.trackingId)}
                          activeOpacity={0.7}
                          style={{ flex: 1, backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                        >
                          <MaterialCommunityIcons name="water" size={20} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Water</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Set planted date for ${tracked.name}`}
                          onPress={() => {
                            setShowPlantedModalFor(tracked);
                            setPlantedDaysAgo('0');
                            setPlantedCustomDate('');
                          }}
                          activeOpacity={0.7}
                          style={{ flex: 1, backgroundColor: tracked.plantedConfirmed ? '#10b981' : '#f3f4f6', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
                        >
                          <MaterialCommunityIcons name={tracked.plantedConfirmed ? 'check-circle' : 'calendar'} size={20} color={tracked.plantedConfirmed ? '#fff' : '#374151'} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 15, fontWeight: '700', color: tracked.plantedConfirmed ? '#fff' : '#374151' }}>{tracked.plantedConfirmed ? 'Planted' : 'Set Date'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Stop tracking ${tracked.name}`}
                          onPress={() => handleRemoveTracked(tracked.trackingId)}
                          activeOpacity={0.7}
                          style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#fee2e2', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <PlannerView />
        )}
      </ScrollView>

      <Modal transparent visible={showNewGardenModal} animationType="fade" onRequestClose={() => setShowNewGardenModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={t.h2}>Create New Garden</Text>
            <TextInput placeholder="Garden name" value={newName} onChangeText={setNewName} style={styles.input} />
            <View style={{ flexDirection: 'row' }}>
              <TextInput placeholder="Rows" value={newRows} onChangeText={setNewRows} keyboardType="number-pad" style={[styles.input, { flex: 1, marginRight: 8 }]} />
              <TextInput placeholder="Cols" value={newCols} onChangeText={setNewCols} keyboardType="number-pad" style={[styles.input, { flex: 1 }]} />
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[t.btn, { flex: 1 }]} onPress={() => setShowNewGardenModal(false)}>
                <Text style={t.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[t.btn, t.btnPrimary, { flex: 1, marginLeft: 8 }]} onPress={handleCreate}>
                <Text style={[t.btnText, t.btnTextPrimary]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showPlantSelector} animationType="fade" onRequestClose={() => setShowPlantSelector(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={t.h2}>Choose Plant</Text>
            <Text style={[t.small, { color: palette.textMuted, marginTop: 4 }]}>
              Tap a plant to move it • Tap another cell to drop • Long-press for info
            </Text>
            
            {/* Category Filter Buttons */}
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={[
                  t.btn,
                  { paddingVertical: 8, paddingHorizontal: 12 },
                  plannerFilter === 'all' && t.btnPrimary
                ]}
                onPress={() => setPlannerFilter('all')}
              >
                <Text style={[t.btnText, plannerFilter === 'all' && t.btnTextPrimary]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  t.btn,
                  { paddingVertical: 8, paddingHorizontal: 12 },
                  plannerFilter === 'vegetables' && t.btnPrimary
                ]}
                onPress={() => setPlannerFilter('vegetables')}
              >
                <Text style={[t.btnText, plannerFilter === 'vegetables' && t.btnTextPrimary]}>🥕 Vegetables</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  t.btn,
                  { paddingVertical: 8, paddingHorizontal: 12 },
                  plannerFilter === 'flowers' && t.btnPrimary
                ]}
                onPress={() => setPlannerFilter('flowers')}
              >
                <Text style={[t.btnText, plannerFilter === 'flowers' && t.btnTextPrimary]}>🌸 Flowers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  t.btn,
                  { paddingVertical: 8, paddingHorizontal: 12 },
                  plannerFilter === 'herbs' && t.btnPrimary
                ]}
                onPress={() => setPlannerFilter('herbs')}
              >
                <Text style={[t.btnText, plannerFilter === 'herbs' && t.btnTextPrimary]}>🌿 Herbs</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Search plants"
              value={plannerQuery}
              onChangeText={setPlannerQuery}
              style={[styles.input, { marginTop: 12 }]}
            />
            <FlatList
              data={filteredPlannerPlants}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => {
                const colors = getPlantTypeColor(item.plantType);
                return (
                  <TouchableOpacity
                    style={[styles.plantCardSmall, {
                      backgroundColor: colors.bg,
                      borderWidth: 2,
                      borderColor: colors.border,
                    }]}
                    onPress={() => handlePlacePlant(item)}
                    onLongPress={() => {
                      // Start drag mode from selector
                      setDraggedPlant(item);
                      setShowPlantSelector(false);
                    }}
                  >
                    <Text style={{ fontSize: 36 }}>{item.image}</Text>
                    <Text style={[t.h4, { textAlign: 'center', marginTop: 6, color: colors.accent }]}>{item.name}</Text>
                    <Text style={[t.small, { textAlign: 'center', marginTop: 2, color: palette.textMuted }]}>{item.indoorOutdoor}</Text>
                    <View style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: colors.accent,
                      borderRadius: 8,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: '#fff' }}>
                        {item.plantType === 'flower' ? '🌸' : item.plantType === 'herb' ? '🌿' : '🥬'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity onPress={() => setShowPlantSelector(false)} style={[t.btn, { marginTop: 8 }]}>
              <Text style={t.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showPlantTrackerModal} animationType="fade" onRequestClose={() => setShowPlantTrackerModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={t.h2}>Track a Plant</Text>
            <TextInput
              placeholder="Search plants"
              value={trackerQuery}
              onChangeText={setTrackerQuery}
              style={[styles.input, { marginTop: 12 }]}
            />
            <FlatList
              data={filteredTrackerPlants}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.plantCardSmall} onPress={() => handleStartTrackingPlant(item)}>
                  <Text style={{ fontSize: 36 }}>{item.image}</Text>
                  <Text style={[t.h4, { textAlign: 'center', marginTop: 6 }]}>{item.name}</Text>
                  <Text style={[t.small, { textAlign: 'center', marginTop: 2 }]}>{item.indoorOutdoor}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowPlantTrackerModal(false)} style={[t.btn, { marginTop: 8 }]}>
              <Text style={t.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={!!showPlantedModalFor}
        animationType="fade"
        onRequestClose={() => setShowPlantedModalFor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={t.h2}>Set Planted Date</Text>
            <Text style={[t.p, { marginTop: 4 }]}>Choose when you planted this crop.</Text>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={[t.btn, t.btnPrimary, { flex: 1, marginRight: 8 }]}
                onPress={() => {
                  if (!showPlantedModalFor) return;
                  const today = new Date().toISOString();
                  updateTrackedPlantPlantedDate(showPlantedModalFor.trackingId, today);
                  setShowPlantedModalFor(null);
                }}
              >
                <Text style={[t.btnText, t.btnTextPrimary]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[t.btn, { flex: 1 }]}
                onPress={() => {
                  setPlantedDaysAgo(prev => (prev || '0'));
                }}
              >
                <Text style={t.btnText}>Days ago</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Enter days ago (e.g., 7)"
              keyboardType="number-pad"
              value={plantedDaysAgo}
              onChangeText={setPlantedDaysAgo}
              style={[styles.input, { marginTop: 8 }]}
            />
            <Text style={[t.small, { marginTop: 8 }]}>Or pick a custom date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={plantedCustomDate}
              onChangeText={setPlantedCustomDate}
              style={[styles.input, { marginTop: 8 }]}
            />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[t.btn, { flex: 1 }]} onPress={() => setShowPlantedModalFor(null)}>
                <Text style={t.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[t.btn, t.btnPrimary, { flex: 1, marginLeft: 8 }]}
                onPress={() => {
                  if (!showPlantedModalFor) return;
                  const trackingId = showPlantedModalFor.trackingId;
                  let iso: string | null = null;
                  if (plantedCustomDate.trim()) {
                    const d = new Date(plantedCustomDate.trim());
                    if (!isNaN(d.getTime())) iso = d.toISOString();
                  } else {
                    const n = parseInt(plantedDaysAgo || '0', 10);
                    const days = Number.isFinite(n) ? Math.max(0, n) : 0;
                    const d = new Date();
                    d.setDate(d.getDate() - days);
                    iso = d.toISOString();
                  }
                  if (iso) {
                    updateTrackedPlantPlantedDate(trackingId, iso);
                  }
                  setShowPlantedModalFor(null);
                }}
              >
                <Text style={[t.btnText, t.btnTextPrimary]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Garden Templates Modal */}
      <Modal transparent visible={showTemplateModal} animationType="fade" onRequestClose={() => setShowTemplateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={t.h2}>Garden Templates</Text>
            <Text style={[t.p, { marginTop: 4, color: palette.textMuted }]}>
              Choose a pre-designed layout to quickly fill your garden
            </Text>
            
            <ScrollView style={{ marginTop: 16, maxHeight: 450 }}>
              {GARDEN_TEMPLATES.map((template, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[t.card, { marginBottom: 12, padding: 16 }]}
                  onPress={() => handleApplyTemplate(template)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 48, marginRight: 12 }}>{template.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[t.h3, { marginBottom: 4 }]}>{template.name}</Text>
                      <Text style={[t.small, { color: palette.textMuted }]}>{template.description}</Text>
                      <Text style={[t.small, { color: palette.textMuted, marginTop: 4 }]}>
                        {template.rows}×{template.cols} grid
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={palette.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[t.btn, { marginTop: 12 }]} 
              onPress={() => setShowTemplateModal(false)}
            >
              <Text style={t.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plant Info Modal - Long Press Details */}
      <Modal transparent visible={!!showPlantInfoModal} animationType="fade" onRequestClose={() => setShowPlantInfoModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {showPlantInfoModal && (() => {
              const plantReqs = getPlantRequirements(showPlantInfoModal.name);
              return (
              <>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 64 }}>{showPlantInfoModal.image}</Text>
                  <Text style={[t.h2, { marginTop: 8 }]}>{showPlantInfoModal.name}</Text>
                  <Text style={[t.p, { color: palette.textMuted }]}>{showPlantInfoModal.category}</Text>
                </View>

                <View style={{ gap: 12 }}>
                  {/* Plant Type */}
                  {showPlantInfoModal.plantType && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Type:</Text>
                      <Text style={t.p}>
                        {showPlantInfoModal.plantType === 'flower' ? '🌸 Flower' : 
                         showPlantInfoModal.plantType === 'herb' ? '🌿 Herb' : 
                         '🥕 Vegetable'}
                      </Text>
                    </View>
                  )}

                  {/* Sunlight Requirements */}
                  {plantReqs && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Sunlight:</Text>
                      <Text style={t.p}>
                        {plantReqs.sunlight === 'full' ? '☀️ Full Sun' : 
                         plantReqs.sunlight === 'partial' ? '⛅ Partial Sun' : 
                         '☁️ Shade'}
                      </Text>
                    </View>
                  )}

                  {/* Water Requirements */}
                  {plantReqs && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Water Needs:</Text>
                      <Text style={t.p}>
                        {plantReqs.water === 'high' ? '💧💧💧 High' : 
                         plantReqs.water === 'medium' ? '💧💧 Medium' : 
                         '💧 Low'}
                      </Text>
                    </View>
                  )}

                  {/* Spacing */}
                  {plantReqs && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Spacing:</Text>
                      <Text style={t.p}>{plantReqs.spacing}" apart</Text>
                    </View>
                  )}

                  {/* Hardiness Zone */}
                  <View style={[t.rowBetween]}>
                    <Text style={[t.p, { fontWeight: '600' }]}>Hardiness Zones:</Text>
                    <Text style={t.p}>{showPlantInfoModal.minZone} - {showPlantInfoModal.maxZone}</Text>
                  </View>

                  {/* Indoor/Outdoor */}
                  <View style={[t.rowBetween]}>
                    <Text style={[t.p, { fontWeight: '600' }]}>Growing:</Text>
                    <Text style={t.p}>{showPlantInfoModal.indoorOutdoor}</Text>
                  </View>

                  {/* For Flowers */}
                  {showPlantInfoModal.plantType === 'flower' && showPlantInfoModal.bloomSeason && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Bloom Season:</Text>
                      <Text style={t.p}>{showPlantInfoModal.bloomSeason}</Text>
                    </View>
                  )}

                  {/* For Vegetables */}
                  {showPlantInfoModal.daysToHarvest && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Days to Harvest:</Text>
                      <Text style={t.p}>{showPlantInfoModal.daysToHarvest} days</Text>
                    </View>
                  )}

                  {/* Planting Windows */}
                  {showPlantInfoModal.startSeedIndoor && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Start Indoors:</Text>
                      <Text style={[t.p, { textAlign: 'right', flex: 1, marginLeft: 8 }]}>
                        {showPlantInfoModal.startSeedIndoor}
                      </Text>
                    </View>
                  )}

                  {showPlantInfoModal.transplantOutdoor && (
                    <View style={[t.rowBetween]}>
                      <Text style={[t.p, { fontWeight: '600' }]}>Transplant:</Text>
                      <Text style={[t.p, { textAlign: 'right', flex: 1, marginLeft: 8 }]}>
                        {showPlantInfoModal.transplantOutdoor}
                      </Text>
                    </View>
                  )}

                  {/* Description */}
                  {showPlantInfoModal.description && (
                    <View style={{ marginTop: 8, padding: 12, backgroundColor: palette.background, borderRadius: 8 }}>
                      <Text style={[t.p, { fontStyle: 'italic' }]}>{showPlantInfoModal.description}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[t.btn, t.btnPrimary, { marginTop: 16 }]} 
                  onPress={() => setShowPlantInfoModal(null)}
                >
                  <Text style={[t.btnText, t.btnTextPrimary]}>Close</Text>
                </TouchableOpacity>
              </>
            );
            })()}
          </View>
        </View>
      </Modal>

      {/* Companion Planting Guide Modal */}
      <Modal transparent visible={showCompanionGuide} animationType="fade" onRequestClose={() => setShowCompanionGuide(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <Text style={t.h2}>🤝 Companion Planting Guide</Text>
            <Text style={[t.p, { marginTop: 4, color: palette.textMuted }]}>
              Learn which plants grow well together
            </Text>

            {selectedPlantForCompanions ? (
              <ScrollView style={{ marginTop: 16, maxHeight: 500 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 48 }}>{selectedPlantForCompanions.image}</Text>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={t.h3}>{selectedPlantForCompanions.name}</Text>
                    <Text style={[t.small, { color: palette.textMuted }]}>
                      Family: {getPlantFamily(selectedPlantForCompanions.name) || 'Unknown'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPlantForCompanions(null)}>
                    <MaterialCommunityIcons name="close" size={24} color={palette.textMuted} />
                  </TouchableOpacity>
                </View>

                {(() => {
                  const relationships = getCompanionRelationships(selectedPlantForCompanions.name);
                  const good = relationships.filter(r => r.status === 'good');
                  const bad = relationships.filter(r => r.status === 'bad');

                  return (
                    <>
                      {good.length > 0 && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={[t.h4, { color: '#22c55e', marginBottom: 8 }]}>✅ Good Companions</Text>
                          {good.map((rel, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: '#f0fdf4',
                                borderLeftWidth: 3,
                                borderLeftColor: '#22c55e',
                                padding: 10,
                                borderRadius: 8,
                                marginBottom: 6,
                              }}
                            >
                              <Text style={[t.p, { fontWeight: '600' }]}>{rel.plant}</Text>
                            </View>
                          ))}
                          {good[0]?.reason && (
                            <View style={{ backgroundColor: palette.background, padding: 10, borderRadius: 8, marginTop: 8 }}>
                              <Text style={[t.small, { fontStyle: 'italic' }]}>{good[0].reason}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {bad.length > 0 && (
                        <View>
                          <Text style={[t.h4, { color: '#ef4444', marginBottom: 8 }]}>⚠️ Avoid Planting With</Text>
                          {bad.map((rel, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: '#fef2f2',
                                borderLeftWidth: 3,
                                borderLeftColor: '#ef4444',
                                padding: 10,
                                borderRadius: 8,
                                marginBottom: 6,
                              }}
                            >
                              <Text style={[t.p, { fontWeight: '600' }]}>{rel.plant}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {good.length === 0 && bad.length === 0 && (
                        <Text style={[t.p, { color: palette.textMuted, textAlign: 'center', marginTop: 20 }]}>
                          No companion data available for this plant
                        </Text>
                      )}
                    </>
                  );
                })()}
              </ScrollView>
            ) : (
              <View style={{ marginTop: 16 }}>
                <Text style={[t.p, { marginBottom: 12 }]}>Select a plant to see companion suggestions:</Text>
                <FlatList
                  data={plantDatabase.filter(p => getPlantFamily(p.name)).slice(0, 20)}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.plantCardSmall, { margin: 4 }]}
                      onPress={() => setSelectedPlantForCompanions(item)}
                    >
                      <Text style={{ fontSize: 28 }}>{item.image}</Text>
                      <Text style={[t.small, { textAlign: 'center', marginTop: 4, fontWeight: '600' }]}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <TouchableOpacity 
              style={[t.btn, { marginTop: 16 }]} 
              onPress={() => {
                setShowCompanionGuide(false);
                setSelectedPlantForCompanions(null);
              }}
            >
              <Text style={t.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {lastDeleted && (
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 20,
            backgroundColor: palette.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: palette.text }}>
            Deleted "{lastDeleted.garden.name}".
          </Text>
          <TouchableOpacity onPress={handleUndo} style={[t.btn, t.btnPrimary]}>
            <Text style={[t.btnText, t.btnTextPrimary]}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
