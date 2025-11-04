import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import { useTheme } from '../context/ThemeContext';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import plantDB from '../../assets/data/plant-database.json';

const styles = appStyles;

interface Milestone {
  name: string;
  reached: boolean;
  reachedDate?: string;
  estimatedDays?: number;
}

interface TrackedPlant {
  id: string;
  plantId: string;
  plantName: string;
  variety?: string;
  emoji?: string;
  plantedDate: string; // Empty string for planned plants
  quantity: number;
  location?: string;
  milestones: Milestone[];
  currentStage: string;
  status: 'planned' | 'planted';
  notes?: string;
  userId: string;
  createdAt: any;
}

interface Plant {
  id: string;
  commonName: string;
  emoji?: string;
  daysToMaturity?: number;
}

export default function TrackerScreen() {
  const { user } = useAuth();
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);

  const [trackedPlants, setTrackedPlants] = useState<TrackedPlant[]>([]);
  const [plantDatabase, setPlantDatabase] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<TrackedPlant | null>(null);

  // Add/Edit form state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [formData, setFormData] = useState({
    plantId: '',
    plantName: '',
    variety: '',
    emoji: '🌱',
    quantity: 1,
    location: '',
    plantedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Harvest form state
  const [harvestData, setHarvestData] = useState({
    harvestDate: new Date().toISOString().split('T')[0],
    quantity: '',
    weight: '',
    notes: '',
  });

  // Load plant database
  useEffect(() => {
    const loadPlantDatabase = async () => {
      try {
        const data = (plantDB as any)?.plants ?? [];
        setPlantDatabase(data as Plant[]);
      } catch (error) {
        console.error('Error loading plant database:', error);
      }
    };
    loadPlantDatabase();
  }, []);

  // Real-time Firestore sync
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.id, 'tracker'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plants: TrackedPlant[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Backward compatibility: auto-assign status if missing
          if (!data.status) {
            data.status = data.plantedDate ? 'planted' : 'planned';
          }

          plants.push({
            id: doc.id,
            plantId: data.plantId,
            plantName: data.plantName,
            variety: data.variety || '',
            emoji: data.emoji || '🌱',
            plantedDate: data.plantedDate || '',
            quantity: data.quantity || 1,
            location: data.location || '',
            milestones: data.milestones || [],
            currentStage: data.currentStage || 'Planned',
            status: data.status,
            notes: data.notes || '',
            userId: data.userId,
            createdAt: data.createdAt,
          });
        });
        setTrackedPlants(plants);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading tracked plants:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter plants for search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPlants([]);
    } else {
      const filtered = plantDatabase.filter((p) =>
        p.commonName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlants(filtered.slice(0, 20));
    }
  }, [searchTerm, plantDatabase]);

  // Helper: Calculate days since planting
  const getDaysPlanted = (plantedDate: string): number => {
    if (!plantedDate) return 0;
    const planted = new Date(plantedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - planted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: Get progress percentage
  const getProgressPercentage = (plant: TrackedPlant): number => {
    if (plant.status === 'planned') return 0;
    const daysPlanted = getDaysPlanted(plant.plantedDate);
    const lastMilestone = plant.milestones[plant.milestones.length - 1];
    const totalDays = lastMilestone?.estimatedDays || 60;
    return Math.min(100, Math.round((daysPlanted / totalDays) * 100));
  };

  // Helper: Create default milestones
  const createDefaultMilestones = (plantId: string): Milestone[] => {
  const plant = plantDatabase.find((p) => p.id === plantId);
  const daysToMaturity = plant?.daysToMaturity || 60;
  const daysToGermination = Math.round(daysToMaturity * 0.1);

    return [
      {
        name: 'Germination',
        reached: false,
        estimatedDays: daysToGermination,
      },
      {
        name: 'Seedling',
        reached: false,
        estimatedDays: daysToGermination + 14,
      },
      {
  name: 'vegetative growth/flowering',
        reached: false,
        estimatedDays: Math.round(daysToMaturity * 0.8),
      },
      {
        name: 'Ready to Harvest',
        reached: false,
        estimatedDays: daysToMaturity,
      },
    ];
  };

  // Add new plant
  const handleAddPlant = async () => {
    if (!user || !formData.plantId || !formData.plantName) {
      Alert.alert('Error', 'Please select a plant from the database');
      return;
    }

    try {
      // Check for duplicates
      const q = query(
        collection(db, 'users', user.id, 'tracker'),
        where('plantId', '==', formData.plantId)
      );
      const existingPlants = await getDocs(q);

      if (!existingPlants.empty) {
        Alert.alert('Duplicate', `${formData.plantName} is already in your tracker`);
        return;
      }

      const milestones = createDefaultMilestones(formData.plantId);

      const newPlant = {
        plantId: formData.plantId,
        plantName: formData.plantName,
        variety: formData.variety,
        emoji: formData.emoji,
        plantedDate: formData.plantedDate,
        quantity: formData.quantity,
        location: formData.location,
        milestones: milestones,
        currentStage: 'Planted',
        status: 'planted' as 'planted',
        notes: formData.notes,
        userId: user.id,
        createdAt: serverTimestamp(),
      };

  await addDoc(collection(db, 'users', user.id, 'tracker'), newPlant);

      // Create calendar events for milestones
      const plantedDate = new Date(formData.plantedDate);
      for (const milestone of milestones) {
        const eventDate = new Date(plantedDate);
        eventDate.setDate(eventDate.getDate() + (milestone.estimatedDays || 0));

  await addDoc(collection(db, 'users', user.id, 'calendar'), {
          title: `${formData.emoji} ${formData.plantName} - ${milestone.name}`,
          date: eventDate.toISOString().split('T')[0],
          type: 'milestone',
          plantId: formData.plantId,
          plantName: formData.plantName,
          milestone: milestone.name,
          userId: user.id,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', `${formData.plantName} added to tracker! 🌱`);
      resetAddForm();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding plant:', error);
      Alert.alert('Error', 'Failed to add plant. Please try again.');
    }
  };

  // Mark as planted
  const handleMarkAsPlanted = async (plant: TrackedPlant) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
  const plantRef = doc(db, 'users', user.id, 'tracker', plant.id);

      await updateDoc(plantRef, {
        status: 'planted',
        plantedDate: today,
        currentStage: 'Planted',
      });

      // Create calendar events
      const plantedDate = new Date(today);
      for (const milestone of plant.milestones) {
        const eventDate = new Date(plantedDate);
        eventDate.setDate(eventDate.getDate() + (milestone.estimatedDays || 0));

  await addDoc(collection(db, 'users', user.id, 'calendar'), {
          title: `${plant.emoji} ${plant.plantName} - ${milestone.name}`,
          date: eventDate.toISOString().split('T')[0],
          type: 'milestone',
          plantId: plant.plantId,
          plantName: plant.plantName,
          milestone: milestone.name,
          userId: user.id,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', `🌱 ${plant.plantName} marked as planted with milestone reminders created!`);
    } catch (error) {
      console.error('Error marking as planted:', error);
      Alert.alert('Error', 'Failed to mark as planted. Please try again.');
    }
  };

  // Edit plant
  const handleEditPlant = async () => {
    if (!user || !selectedPlant) return;

    try {
  const plantRef = doc(db, 'users', user.id, 'tracker', selectedPlant.id);
      await updateDoc(plantRef, {
        variety: formData.variety,
        quantity: formData.quantity,
        location: formData.location,
        plantedDate: formData.plantedDate,
        notes: formData.notes,
      });

      Alert.alert('Success', 'Plant updated successfully!');
      setShowEditModal(false);
      setSelectedPlant(null);
      resetAddForm();
    } catch (error) {
      console.error('Error editing plant:', error);
      Alert.alert('Error', 'Failed to update plant. Please try again.');
    }
  };

  // Toggle milestone
  const handleToggleMilestone = async (plant: TrackedPlant, milestoneIndex: number) => {
    if (!user) return;

    try {
      const updatedMilestones = [...plant.milestones];
      const milestone = updatedMilestones[milestoneIndex];
      
      milestone.reached = !milestone.reached;
      milestone.reachedDate = milestone.reached
        ? new Date().toISOString().split('T')[0]
        : undefined;

  const plantRef = doc(db, 'users', user.id, 'tracker', plant.id);
      await updateDoc(plantRef, {
        milestones: updatedMilestones,
        currentStage: milestone.reached ? milestone.name : plant.currentStage,
      });
    } catch (error) {
      console.error('Error toggling milestone:', error);
      Alert.alert('Error', 'Failed to update milestone. Please try again.');
    }
  };

  // Harvest plant
  const handleHarvest = async () => {
    if (!user || !selectedPlant) return;

    // Validate
    if (selectedPlant.status === 'planned') {
      Alert.alert('Error', 'Cannot harvest a planned plant. Mark it as planted first.');
      return;
    }

    if (!selectedPlant.plantedDate) {
      Alert.alert('Error', 'Cannot harvest plant without a planted date.');
      return;
    }

    try {
      const daysToHarvest = getDaysPlanted(selectedPlant.plantedDate);

      // Create harvest history entry
  await addDoc(collection(db, 'users', user.id, 'harvestHistory'), {
        plantId: selectedPlant.plantId,
        plantName: selectedPlant.plantName,
        variety: selectedPlant.variety,
        emoji: selectedPlant.emoji,
        plantedDate: selectedPlant.plantedDate,
        harvestDate: harvestData.harvestDate,
        daysToHarvest: daysToHarvest,
        quantity: harvestData.quantity,
        weight: harvestData.weight,
        notes: harvestData.notes,
        userId: user.id,
        createdAt: serverTimestamp(),
      });

      // Delete from tracker
  const plantRef = doc(db, 'users', user.id, 'tracker', selectedPlant.id);
      await deleteDoc(plantRef);

      Alert.alert('Success', 'Plant harvested successfully! 🎉');
      setShowHarvestModal(false);
      setSelectedPlant(null);
      resetHarvestForm();
    } catch (error) {
      console.error('Error harvesting plant:', error);
      Alert.alert('Error', 'Failed to harvest plant. Please try again.');
    }
  };

  // Delete plant
  const handleDeletePlant = async (plantId: string, plantName: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Plant',
      `Are you sure you want to remove ${plantName} from tracking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const plantRef = doc(db, 'users', user.id, 'tracker', plantId);
              await deleteDoc(plantRef);
              Alert.alert('Success', 'Plant removed from tracker');
            } catch (error) {
              console.error('Error deleting plant:', error);
              Alert.alert('Error', 'Failed to delete plant. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Helper: Reset forms
  const resetAddForm = () => {
    setFormData({
      plantId: '',
      plantName: '',
      variety: '',
      emoji: '🌱',
      quantity: 1,
      location: '',
      plantedDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSearchTerm('');
    setFilteredPlants([]);
  };

  const resetHarvestForm = () => {
    setHarvestData({
      harvestDate: new Date().toISOString().split('T')[0],
      quantity: '',
      weight: '',
      notes: '',
    });
  };

  // Stats calculations
  const plantedCount = trackedPlants.filter((p) => p.status === 'planted').length;
  const plannedCount = trackedPlants.filter((p) => p.status === 'planned').length;
  const readyToHarvestCount = trackedPlants.filter(
    (p) => p.status === 'planted' && p.milestones[p.milestones.length - 1]?.reached
  ).length;
  const totalPlants = trackedPlants.reduce((sum, p) => sum + p.quantity, 0);

  const onRefresh = () => {
    setRefreshing(true);
    // Real-time listener will handle refresh
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
  <HeaderBar />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
  <HeaderBar />
      
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Dashboard */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {/* Planted */}
            <LinearGradient
              colors={['#dcfce7', '#bbf7d0']}
              style={{ ...t.card, flex: 1, minWidth: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                <MaterialCommunityIcons name="sprout" size={24} color="#fff" />
              </View>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#15803d', marginTop: 8 }}>
                {plantedCount}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>Planted</Text>
            </LinearGradient>

            {/* Planned */}
            <LinearGradient
              colors={['#fef3c7', '#fde68a']}
              style={{ ...t.card, flex: 1, minWidth: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#d97706', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#fff" />
              </View>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#b45309', marginTop: 8 }}>
                {plannedCount}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Planned</Text>
            </LinearGradient>

            {/* Ready to Harvest */}
            <LinearGradient
              colors={['#ddd6fe', '#c4b5fd']}
              style={{ ...t.card, flex: 1, minWidth: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                <MaterialCommunityIcons name="fruit-cherries" size={24} color="#fff" />
              </View>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#6d28d9', marginTop: 8 }}>
                {readyToHarvestCount}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ready</Text>
            </LinearGradient>

            {/* Total Plants */}
            <LinearGradient
              colors={['#e0e7ff', '#c7d2fe']}
              style={{ ...t.card, flex: 1, minWidth: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                <MaterialCommunityIcons name="leaf" size={24} color="#fff" />
              </View>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#4338ca', marginTop: 8 }}>
                {totalPlants}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#3730a3', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</Text>
            </LinearGradient>
          </View>

          {/* Add Plant Button */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
            style={{ alignSelf: 'flex-end', marginBottom: 16 }}
          >
            <LinearGradient
              colors={['#16a34a', '#15803d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>Add Plant</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Plant Cards */}
          {trackedPlants.length === 0 ? (
            <View style={[t.card, { alignItems: 'center', padding: 32 }]}>
              <MaterialCommunityIcons name="leaf" size={64} color={palette.primary} />
              <Text style={[t.h3, { marginTop: 16, textAlign: 'center' }]}>
                Start Tracking Your Plants
              </Text>
              <Text style={[t.p, { marginTop: 8, textAlign: 'center', color: palette.textMuted }]}>
                Monitor growth from seed to harvest
              </Text>
              <TouchableOpacity
                style={[t.btn, t.btnPrimary, { marginTop: 16 }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={[t.btnText, t.btnTextPrimary]}>Track Your First Plant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            trackedPlants.map((plant) => {
              const isPlanned = plant.status === 'planned';
              const progress = getProgressPercentage(plant);
              const daysPlanted = getDaysPlanted(plant.plantedDate);

              return (
                <View key={plant.id} style={{ ...t.card, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 }}>
                  {/* Header */}
                  <LinearGradient
                    colors={isPlanned ? ['#9ca3af', '#6b7280'] : ['#16a34a', '#15803d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 18,
                    }}
                  >
                    <Text style={{ fontSize: 36 }}>{plant.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>
                        {plant.plantName}
                      </Text>
                      {plant.variety && (
                        <Text style={{ fontSize: 14, color: '#f3f4f6', fontWeight: '500' }}>{plant.variety}</Text>
                      )}
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>
                        {isPlanned ? '📝 Planned' : plant.currentStage}
                      </Text>
                    </View>
                  </LinearGradient>

                  {/* Body */}
                  <View style={{ padding: 16 }}>
                    {isPlanned ? (
                      <>
                        <View
                          style={{
                            backgroundColor: '#fef3c7',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                          }}
                        >
                          <Text style={{ fontSize: 14, color: '#92400e' }}>
                            ℹ️ This plant is planned but not yet planted. Mark as planted to start
                            milestone tracking.
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => handleMarkAsPlanted(plant)}
                            activeOpacity={0.8}
                            style={{ flex: 1 }}
                          >
                            <LinearGradient
                              colors={['#16a34a', '#15803d']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}
                            >
                              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>Mark as Planted</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPlant(plant);
                              setFormData({
                                plantId: plant.plantId,
                                plantName: plant.plantName,
                                variety: plant.variety || '',
                                emoji: plant.emoji || '🌱',
                                quantity: plant.quantity,
                                location: plant.location || '',
                                plantedDate: plant.plantedDate || new Date().toISOString().split('T')[0],
                                notes: plant.notes || '',
                              });
                              setShowEditModal(true);
                            }}
                            activeOpacity={0.7}
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
                          >
                            <MaterialCommunityIcons name="pencil" size={20} color="#374151" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeletePlant(plant.id, plant.plantName)}
                            activeOpacity={0.7}
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#fee2e2', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Progress Bar */}
                        <View style={{ marginBottom: 16 }}>
                          <View
                            style={{
                              height: 10,
                              backgroundColor: '#e5e7eb',
                              borderRadius: 999,
                              overflow: 'hidden',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                            }}
                          >
                            <LinearGradient
                              colors={['#16a34a', '#15803d', '#14532d']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                              }}
                            />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textMuted, marginTop: 6, letterSpacing: 0.3 }}>
                            {progress}% Complete • Day {daysPlanted}
                          </Text>
                        </View>

                        {/* Milestones */}
                        <View style={{ marginBottom: 16 }}>
                          {plant.milestones.map((milestone, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => handleToggleMilestone(plant, index)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: index < plant.milestones.length - 1 ? 1 : 0,
                                borderBottomColor: '#e5e7eb',
                              }}
                            >
                              <View style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: milestone.reached ? '#dcfce7' : '#f3f4f6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: milestone.reached ? 0.1 : 0.05,
                                shadowRadius: 4,
                                elevation: milestone.reached ? 2 : 1,
                              }}>
                                <MaterialCommunityIcons
                                  name={milestone.reached ? 'check-circle' : 'circle-outline'}
                                  size={22}
                                  color={milestone.reached ? '#16a34a' : '#9ca3af'}
                                />
                              </View>
                              <Text
                                style={{
                                  flex: 1,
                                  marginLeft: 12,
                                  fontSize: 15,
                                  fontWeight: milestone.reached ? '600' : '500',
                                  color: milestone.reached ? palette.text : palette.textMuted,
                                  textDecorationLine: milestone.reached ? 'line-through' : 'none',
                                }}
                              >
                                {milestone.name}
                              </Text>
                              <View style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12,
                                backgroundColor: '#f3f4f6',
                              }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
                                  Day {milestone.estimatedDays}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPlant(plant);
                              setShowHarvestModal(true);
                            }}
                            activeOpacity={0.8}
                            style={{ flex: 1 }}
                          >
                            <LinearGradient
                              colors={['#16a34a', '#15803d']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}
                            >
                              <MaterialCommunityIcons name="fruit-cherries" size={20} color="#fff" style={{ marginRight: 6 }} />
                              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>Harvest</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPlant(plant);
                              setFormData({
                                plantId: plant.plantId,
                                plantName: plant.plantName,
                                variety: plant.variety || '',
                                emoji: plant.emoji || '🌱',
                                quantity: plant.quantity,
                                location: plant.location || '',
                                plantedDate: plant.plantedDate,
                                notes: plant.notes || '',
                              });
                              setShowEditModal(true);
                            }}
                            activeOpacity={0.7}
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
                          >
                            <MaterialCommunityIcons name="pencil" size={20} color="#374151" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeletePlant(plant.id, plant.plantName)}
                            activeOpacity={0.7}
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#fee2e2', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#dc2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Plant Info */}
                        {(plant.location || plant.notes) && (
                          <View
                            style={{
                              marginTop: 12,
                              padding: 12,
                              backgroundColor: '#f9fafb',
                              borderRadius: 8,
                            }}
                          >
                            {plant.location && (
                              <Text style={{ fontSize: 12, color: palette.textMuted }}>
                                📍 {plant.location}
                              </Text>
                            )}
                            {plant.notes && (
                              <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>
                                📝 {plant.notes}
                              </Text>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Plant Modal */}
      <Modal
        transparent
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardLarge, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={t.h2}>Add Plant to Tracker</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Search Plant */}
              <Text style={[{ fontSize: 14, fontWeight: '600', color: palette.text }, { marginBottom: 4 }]}>Search Plant Database</Text>
              <TextInput
                placeholder="Type plant name..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={styles.input}
              />

              {filteredPlants.length > 0 && (
                <FlatList
                  data={filteredPlants}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setFormData({
                          ...formData,
                          plantId: item.id,
                          plantName: item.commonName,
                          emoji: item.emoji || '🌱',
                        });
                        setSearchTerm('');
                        setFilteredPlants([]);
                      }}
                      style={{
                        padding: 12,
                        backgroundColor: '#f9fafb',
                        borderRadius: 8,
                        marginBottom: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 24, marginRight: 8 }}>{item.emoji}</Text>
                      <Text style={{ fontSize: 14, color: palette.text }}>{item.commonName}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              {formData.plantName && (
                <>
                  <View
                    style={{
                      backgroundColor: '#dcfce7',
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#15803d' }}>
                      ✓ Selected: {formData.emoji} {formData.plantName}
                    </Text>
                  </View>

                  {/* Variety */}
                  <Text style={[t.p, { marginBottom: 4, fontWeight: '600' }]}>Variety (Optional)</Text>
                  <TextInput
                    placeholder="e.g., Cherry, Roma..."
                    value={formData.variety}
                    onChangeText={(text) => setFormData({ ...formData, variety: text })}
                    style={styles.input}
                  />

                  {/* Planted Date */}
                  <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Planted Date</Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={formData.plantedDate}
                    onChangeText={(text) => setFormData({ ...formData, plantedDate: text })}
                    style={styles.input}
                  />

                  {/* Quantity */}
                  <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Quantity</Text>
                  <TextInput
                    placeholder="1"
                    value={formData.quantity ? String(formData.quantity) : ''}
                    onChangeText={(text) => setFormData({ ...formData, quantity: parseInt(text) || 1 })}
                    keyboardType="number-pad"
                    style={styles.input}
                  />

                  {/* Location */}
                  <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Location (Optional)</Text>
                  <TextInput
                    placeholder="e.g., Garden Bed 1, Container..."
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    style={styles.input}
                  />

                  {/* Notes */}
                  <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Notes (Optional)</Text>
                  <TextInput
                    placeholder="Add any observations..."
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    multiline
                    numberOfLines={3}
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  />
                </>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TouchableOpacity
                style={[t.btn, { flex: 1 }]}
                onPress={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
              >
                <Text style={t.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[t.btn, t.btnPrimary, { flex: 1 }]}
                onPress={handleAddPlant}
              >
                <Text style={[t.btnText, t.btnTextPrimary]}>Add Plant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Plant Modal */}
      <Modal
        transparent
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardLarge, { maxHeight: '70%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={t.h2}>Edit Plant</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={[t.p, { marginBottom: 4, fontWeight: '600' }]}>Plant</Text>
              <Text style={{ fontSize: 16, marginBottom: 12 }}>
                {formData.emoji} {formData.plantName}
              </Text>

              <Text style={[t.p, { marginBottom: 4, fontWeight: '600' }]}>Variety</Text>
              <TextInput
                value={formData.variety}
                onChangeText={(text) => setFormData({ ...formData, variety: text })}
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Planted Date</Text>
              <TextInput
                value={formData.plantedDate}
                onChangeText={(text) => setFormData({ ...formData, plantedDate: text })}
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Quantity</Text>
              <TextInput
                value={formData.quantity ? String(formData.quantity) : ''}
                onChangeText={(text) => setFormData({ ...formData, quantity: parseInt(text) || 1 })}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Location</Text>
              <TextInput
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Notes</Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TouchableOpacity
                style={[t.btn, { flex: 1 }]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedPlant(null);
                  resetAddForm();
                }}
              >
                <Text style={t.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[t.btn, t.btnPrimary, { flex: 1 }]}
                onPress={handleEditPlant}
              >
                <Text style={[t.btnText, t.btnTextPrimary]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Harvest Modal */}
      <Modal
        transparent
        visible={showHarvestModal}
        animationType="slide"
        onRequestClose={() => setShowHarvestModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '60%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={t.h2}>Harvest Plant</Text>
              <TouchableOpacity onPress={() => setShowHarvestModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedPlant && (
                <View
                  style={{
                    backgroundColor: '#dcfce7',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#15803d' }}>
                    {selectedPlant.emoji} {selectedPlant.plantName}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
                    Planted: {selectedPlant.plantedDate} • Day {getDaysPlanted(selectedPlant.plantedDate)}
                  </Text>
                </View>
              )}

              <Text style={[t.p, { marginBottom: 4, fontWeight: '600' }]}>Harvest Date</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={harvestData.harvestDate}
                onChangeText={(text) => setHarvestData({ ...harvestData, harvestDate: text })}
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Quantity</Text>
              <TextInput
                placeholder="e.g., 5 tomatoes"
                value={harvestData.quantity}
                onChangeText={(text) => setHarvestData({ ...harvestData, quantity: text })}
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Weight (Optional)</Text>
              <TextInput
                placeholder="e.g., 2.5 lbs"
                value={harvestData.weight}
                onChangeText={(text) => setHarvestData({ ...harvestData, weight: text })}
                style={styles.input}
              />

              <Text style={[t.p, { marginBottom: 4, marginTop: 12, fontWeight: '600' }]}>Notes (Optional)</Text>
              <TextInput
                placeholder="How was the harvest?"
                value={harvestData.notes}
                onChangeText={(text) => setHarvestData({ ...harvestData, notes: text })}
                multiline
                numberOfLines={3}
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <TouchableOpacity
                style={[t.btn, { flex: 1 }]}
                onPress={() => {
                  setShowHarvestModal(false);
                  setSelectedPlant(null);
                  resetHarvestForm();
                }}
              >
                <Text style={t.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[t.btn, t.btnPrimary, { flex: 1 }]}
                onPress={handleHarvest}
              >
                <Text style={[t.btnText, t.btnTextPrimary]}>Complete Harvest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
