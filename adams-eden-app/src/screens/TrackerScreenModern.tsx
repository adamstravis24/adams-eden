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
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useGarden } from '../context/GardenContext';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

const { width } = Dimensions.get('window');

interface Milestone {
  name: string;
  reached: boolean;
  reachedDate?: string;
  estimatedDays?: number;
}

interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  notes?: string;
  photoUri?: string;
  createdAt: string;
  category?: 'observation' | 'maintenance' | 'issue' | 'harvest' | 'custom';
  priority?: 'low' | 'medium' | 'high';
}

interface TrackedPlant {
  id: string;
  plantId: string;
  plantName: string;
  variety?: string;
  emoji?: string;
  plantedDate: string;
  quantity: number;
  location?: string;
  milestones: Milestone[];
  currentStage: string;
  status: 'planned' | 'planted';
  notes?: string;
  userId: string;
  createdAt: any;
  timeline?: TimelineEntry[];
}

const LOG_CATEGORIES: Array<{ key: TimelineEntry['category']; label: string; icon: string }> = [
  { key: 'observation', label: 'Observation', icon: 'eye-outline' },
  { key: 'maintenance', label: 'Maintenance', icon: 'shovel' },
  { key: 'issue', label: 'Issue', icon: 'alert-circle-outline' },
  { key: 'harvest', label: 'Harvest', icon: 'fruit-cherries' },
];

const LOG_PRIORITIES: Array<{ key: TimelineEntry['priority']; label: string; icon: string }> = [
  { key: 'low', label: 'Low', icon: 'arrow-down-circle-outline' },
  { key: 'medium', label: 'Normal', icon: 'minus-circle-outline' },
  { key: 'high', label: 'High', icon: 'arrow-up-circle-outline' },
];

interface Plant {
  id: string;
  commonName: string;
  emoji?: string;
  growthInfo?: {
    daysToGermination?: number;
    daysToMaturity?: number;
    daysToHarvest?: number;
  };
}

export default function TrackerScreenModern() {
  const { user } = useAuth();
  const { addTimelineEntry } = useGarden();
  const { palette } = useTheme();

  const [trackedPlants, setTrackedPlants] = useState<TrackedPlant[]>([]);
  const [plantDatabase, setPlantDatabase] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<TrackedPlant | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTargetPlant, setLogTargetPlant] = useState<TrackedPlant | null>(null);

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

  const [logForm, setLogForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    category: 'observation' as TimelineEntry['category'],
    priority: 'medium' as TimelineEntry['priority'],
  });
  const [logPhoto, setLogPhoto] = useState<string | null>(null);
  const [logUploading, setLogUploading] = useState(false);

  // Load plant database
  useEffect(() => {
    const loadPlantDatabase = async () => {
      try {
        const db = plantDB as any;
        setPlantDatabase(db.plants || []);
      } catch (error) {
        console.error('Error loading plant database:', error);
      }
    };
    loadPlantDatabase();
  }, []);

  // Real-time Firestore sync
  useEffect(() => {
    if (!user) return;

    const userUid = (user as any).uid || user.id;
    const q = query(
      collection(db, 'users', userUid, 'tracker'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plants: TrackedPlant[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
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
            timeline: data.timeline || [],
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

  const getDaysPlanted = (plantedDate: string): number => {
    if (!plantedDate) return 0;
    const planted = new Date(plantedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - planted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProgressPercentage = (plant: TrackedPlant): number => {
    if (plant.status === 'planned') return 0;
    const daysPlanted = getDaysPlanted(plant.plantedDate);
    const plantInfo = plantDatabase.find((p) => p.id === plant.plantId);
    const totalDays = plantInfo?.growthInfo?.daysToHarvest || 70;
    return Math.min(100, Math.round((daysPlanted / totalDays) * 100));
  };

  const formatTimelineDate = (value?: string): string => {
    if (!value) return new Date().toLocaleString();
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCategoryMeta = (category?: TimelineEntry['category']) => {
    if (!category) return undefined;
    const mapping = LOG_CATEGORIES.find((item) => item.key === category);
    if (mapping) return mapping;
    return {
      key: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      icon: 'note-text-outline',
    };
  };

  const getPriorityMeta = (priority?: TimelineEntry['priority']) => {
    if (!priority) return undefined;
    switch (priority) {
      case 'high':
        return { label: 'High Priority', backgroundColor: '#fee2e2', textColor: '#b91c1c' };
      case 'low':
        return { label: 'Low Priority', backgroundColor: '#dcfce7', textColor: '#166534' };
      case 'medium':
      default:
        return { label: 'Normal Priority', backgroundColor: '#fef3c7', textColor: '#b45309' };
    }
  };

  const getCurrentStageAuto = (plant: TrackedPlant): string => {
    if (plant.status === 'planned') return 'Planned';
    const daysPlanted = getDaysPlanted(plant.plantedDate);
    const plantInfo = plantDatabase.find((p) => p.id === plant.plantId);
    const daysToHarvest = plantInfo?.growthInfo?.daysToHarvest || 70;
    
    // Automatic stage progression based on days planted
    if (daysPlanted < 7) {
      return 'Germination';
    } else if (daysPlanted < 24.5) { // 7 + 17.5
      return 'Seedling';
    } else if (daysPlanted < 66.5) { // 7 + 17.5 + 42
      return 'vegetative growth/flowering';
    } else if (daysPlanted >= daysToHarvest) {
      return 'Ready to Harvest';
    } else {
      return 'vegetative growth/flowering';
    }
  };

  const normalizeStage = (stage?: string | null): string => {
    const t = (stage || '').toLowerCase().trim();
    if (!t) return '';
    if (t === 'flowering' || t === 'vegetative growth' || t.includes('flowering')) {
      return 'vegetative growth/flowering';
    }
    return stage || '';
  };

  const createDefaultMilestones = (plantId: string): Milestone[] => {
    const plant = plantDatabase.find((p) => p.id === plantId);
    const daysToHarvest = plant?.growthInfo?.daysToHarvest || 70;

    return [
      { name: 'Germination', reached: false, estimatedDays: 7 },
      { name: 'Seedling', reached: false, estimatedDays: 24.5 },
  { name: 'vegetative growth/flowering', reached: false, estimatedDays: 66.5 },
      { name: 'Ready to Harvest', reached: false, estimatedDays: daysToHarvest },
    ];
  };

  const handleAddPlant = async () => {
    if (!user || !formData.plantId || !formData.plantName) {
      Alert.alert('Error', 'Please select a plant from the database');
      return;
    }

    try {
      const userUid = (user as any).uid || user.id;
      const q = query(
        collection(db, 'users', userUid, 'tracker'),
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
        userId: userUid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'users', userUid, 'tracker'), newPlant);

      const plantedDate = new Date(formData.plantedDate);
      for (const milestone of milestones) {
        const eventDate = new Date(plantedDate);
        eventDate.setDate(eventDate.getDate() + (milestone.estimatedDays || 0));

        await addDoc(collection(db, 'users', userUid, 'calendar'), {
          title: `${formData.emoji} ${formData.plantName} - ${milestone.name}`,
          date: eventDate.toISOString().split('T')[0],
          type: 'milestone',
          plantId: formData.plantId,
          plantName: formData.plantName,
          milestone: milestone.name,
          userId: userUid,
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

  const handleMarkAsPlanted = async (plant: TrackedPlant) => {
    if (!user) return;

    try {
      const userUid = (user as any).uid || user.id;
      const today = new Date().toISOString().split('T')[0];
      const plantRef = doc(db, 'users', userUid, 'tracker', plant.id);

      await updateDoc(plantRef, {
        status: 'planted',
        plantedDate: today,
        currentStage: 'Planted',
      });

      const plantedDate = new Date(today);
      for (const milestone of plant.milestones) {
        const eventDate = new Date(plantedDate);
        eventDate.setDate(eventDate.getDate() + (milestone.estimatedDays || 0));

        await addDoc(collection(db, 'users', userUid, 'calendar'), {
          title: `${plant.emoji} ${plant.plantName} - ${milestone.name}`,
          date: eventDate.toISOString().split('T')[0],
          type: 'milestone',
          plantId: plant.plantId,
          plantName: plant.plantName,
          milestone: milestone.name,
          userId: userUid,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', `🌱 ${plant.plantName} marked as planted with milestone reminders created!`);
    } catch (error) {
      console.error('Error marking as planted:', error);
      Alert.alert('Error', 'Failed to mark as planted. Please try again.');
    }
  };

  const handleEditPlant = async () => {
    if (!user || !selectedPlant) return;

    try {
      const userUid = (user as any).uid || user.id;
      const plantRef = doc(db, 'users', userUid, 'tracker', selectedPlant.id);
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

  const handleToggleMilestone = async (plant: TrackedPlant, milestoneIndex: number) => {
    if (!user) return;

    try {
      const userUid = (user as any).uid || user.id;
      const updatedMilestones = [...plant.milestones];
      const milestone = updatedMilestones[milestoneIndex];
      
      milestone.reached = !milestone.reached;
      milestone.reachedDate = milestone.reached
        ? new Date().toISOString().split('T')[0]
        : undefined;

      const plantRef = doc(db, 'users', userUid, 'tracker', plant.id);
      await updateDoc(plantRef, {
        milestones: updatedMilestones,
        currentStage: milestone.reached ? milestone.name : plant.currentStage,
      });
    } catch (error) {
      console.error('Error toggling milestone:', error);
      Alert.alert('Error', 'Failed to update milestone. Please try again.');
    }
  };

  const handleHarvest = async () => {
    if (!user || !selectedPlant) return;

    if (selectedPlant.status === 'planned') {
      Alert.alert('Error', 'Cannot harvest a planned plant. Mark it as planted first.');
      return;
    }

    if (!selectedPlant.plantedDate) {
      Alert.alert('Error', 'Cannot harvest plant without a planted date.');
      return;
    }

    try {
      const userUid = (user as any).uid || user.id;
      const daysToHarvest = getDaysPlanted(selectedPlant.plantedDate);

      await addDoc(collection(db, 'users', userUid, 'harvestHistory'), {
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
        userId: userUid,
        createdAt: serverTimestamp(),
      });

      const plantRef = doc(db, 'users', userUid, 'tracker', selectedPlant.id);
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
              const userUid = (user as any).uid || user.id;
              const plantRef = doc(db, 'users', userUid, 'tracker', plantId);
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

  const openLogModal = (plant: TrackedPlant) => {
    const baseDate = plant.plantedDate && plant.plantedDate.includes('T')
      ? plant.plantedDate.split('T')[0]
      : new Date().toISOString().split('T')[0];

    setLogTargetPlant(plant);
    setLogForm({
      title: '',
      date: baseDate,
      notes: '',
      category: 'observation',
      priority: 'medium',
    });
    setLogPhoto(null);
    setShowLogModal(true);
  };

  const handlePickLogPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setLogPhoto(result.assets[0].uri);
    }
  };

  const handleAddTimelineLog = async () => {
    if (!user || !logTargetPlant) {
      Alert.alert('Error', 'No plant selected for logging.');
      return;
    }

    if (!logForm.title.trim() && !logForm.notes.trim() && !logPhoto) {
      Alert.alert('Add details', 'Please add a title, notes, or photo for the log.');
      return;
    }

    try {
      setLogUploading(true);
      const userUid = (user as any).uid || user.id;

      let photoUrl: string | undefined;
      if (logPhoto) {
        const storage = getStorage();
        const fileExt = logPhoto.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const storageRef = ref(storage, `users/${userUid}/timeline/${logTargetPlant.id}/${fileName}`);

        const response = await fetch(logPhoto);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        photoUrl = await getDownloadURL(storageRef);
      }

      const parsedDate = logForm.date ? new Date(logForm.date) : new Date();
      const entry: TimelineEntry = {
        id: `log-${Date.now()}`,
        title: logForm.title.trim() || 'Garden log',
        notes: logForm.notes.trim() || undefined,
        date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
        photoUri: photoUrl,
        createdAt: new Date().toISOString(),
        category: logForm.category,
        priority: logForm.priority,
      };

      await addTimelineEntry(logTargetPlant.id, entry);

      Alert.alert('Logged', `${logTargetPlant.plantName} updated with a new timeline entry.`);
      setShowLogModal(false);
      setLogTargetPlant(null);
      setLogForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        category: 'observation',
        priority: 'medium',
      });
      setLogPhoto(null);
    } catch (error) {
      console.error('Error adding timeline entry:', error);
      Alert.alert('Error', 'Failed to save timeline entry. Please try again.');
    } finally {
      setLogUploading(false);
    }
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
  };

  if (loading) {
    return (
      <SafeAreaView style={[modernStyles.container, { backgroundColor: '#f8fafc' }]} edges={['top']}>
        <LinearGradient
          colors={['#16a34a', '#15803d']}
          style={modernStyles.header}
        >
          <Text style={modernStyles.headerTitle}>🌱 Plant Tracker</Text>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[modernStyles.container, { backgroundColor: '#f8fafc' }]} edges={['top']}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#16a34a', '#15803d']}
        style={modernStyles.header}
      >
        <Text style={modernStyles.headerTitle}>🌱 Plant Tracker</Text>
        <Text style={modernStyles.headerSubtitle}>Grow with confidence</Text>
      </LinearGradient>
      
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Stats Dashboard */}
        <View style={modernStyles.statsContainer}>
          <View style={modernStyles.statsRow}>
            {/* Planted Card */}
            <LinearGradient
              colors={['#dcfce7', '#bbf7d0']}
              style={modernStyles.statCard}
            >
              <View style={[modernStyles.statIconContainer, { backgroundColor: '#16a34a' }]}>
                <MaterialCommunityIcons name="sprout" size={24} color="#fff" />
              </View>
              <Text style={[modernStyles.statNumber, { color: '#15803d' }]}>{plantedCount}</Text>
              <Text style={[modernStyles.statLabel, { color: '#166534' }]}>Planted</Text>
            </LinearGradient>

            {/* Planned Card */}
            <LinearGradient
              colors={['#fef3c7', '#fde68a']}
              style={modernStyles.statCard}
            >
              <View style={[modernStyles.statIconContainer, { backgroundColor: '#d97706' }]}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#fff" />
              </View>
              <Text style={[modernStyles.statNumber, { color: '#b45309' }]}>{plannedCount}</Text>
              <Text style={[modernStyles.statLabel, { color: '#92400e' }]}>Planned</Text>
            </LinearGradient>
          </View>

          <View style={modernStyles.statsRow}>
            {/* Ready to Harvest Card */}
            <LinearGradient
              colors={['#ddd6fe', '#c4b5fd']}
              style={modernStyles.statCard}
            >
              <View style={[modernStyles.statIconContainer, { backgroundColor: '#7c3aed' }]}>
                <MaterialCommunityIcons name="fruit-cherries" size={24} color="#fff" />
              </View>
              <Text style={[modernStyles.statNumber, { color: '#6d28d9' }]}>{readyToHarvestCount}</Text>
              <Text style={[modernStyles.statLabel, { color: '#5b21b6' }]}>Ready</Text>
            </LinearGradient>

            {/* Total Plants Card */}
            <LinearGradient
              colors={['#e0e7ff', '#c7d2fe']}
              style={modernStyles.statCard}
            >
              <View style={[modernStyles.statIconContainer, { backgroundColor: '#4f46e5' }]}>
                <MaterialCommunityIcons name="leaf" size={24} color="#fff" />
              </View>
              <Text style={[modernStyles.statNumber, { color: '#4338ca' }]}>{totalPlants}</Text>
              <Text style={[modernStyles.statLabel, { color: '#3730a3' }]}>Total</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Add Plant Button */}
        <View style={modernStyles.actionContainer}>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#16a34a', '#15803d']}
              style={modernStyles.addButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
              <Text style={modernStyles.addButtonText}>Add Plant</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modern Plant Cards */}
        <View style={modernStyles.plantsContainer}>
          {trackedPlants.length === 0 ? (
            <View style={modernStyles.emptyState}>
              <LinearGradient
                colors={['#f0fdf4', '#dcfce7']}
                style={modernStyles.emptyCard}
              >
                <Text style={{ fontSize: 64, marginBottom: 16 }}>🌱</Text>
                <Text style={modernStyles.emptyTitle}>Start Tracking</Text>
                <Text style={modernStyles.emptySubtitle}>
                  Monitor your plants from seed to harvest
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                  style={{ marginTop: 20 }}
                >
                  <LinearGradient
                    colors={['#16a34a', '#15803d']}
                    style={[modernStyles.addButton, { paddingVertical: 12 }]}
                  >
                    <Text style={modernStyles.addButtonText}>Track Your First Plant</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            trackedPlants.map((plant) => {
              const isPlanned = plant.status === 'planned';
              const progress = getProgressPercentage(plant);
              const daysPlanted = getDaysPlanted(plant.plantedDate);

              return (
                <View key={plant.id} style={modernStyles.plantCard}>
                  {/* Plant Header with Gradient */}
                  <LinearGradient
                    colors={isPlanned ? ['#9ca3af', '#6b7280'] : ['#16a34a', '#15803d']}
                    style={modernStyles.plantHeader}
                  >
                    <View style={modernStyles.plantHeaderContent}>
                      <Text style={modernStyles.plantEmoji}>{plant.emoji}</Text>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={modernStyles.plantName}>{plant.plantName}</Text>
                        {plant.variety && (
                          <Text style={modernStyles.plantVariety}>{plant.variety}</Text>
                        )}
                      </View>
                      <View style={modernStyles.statusBadge}>
                        <Text style={modernStyles.statusText}>
                          {isPlanned ? '📝 Planned' : plant.currentStage}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Plant Body */}
                  <View style={modernStyles.plantBody}>
                    {isPlanned ? (
                      <>
                        <View style={modernStyles.infoBox}>
                          <Ionicons name="information-circle" size={20} color="#d97706" />
                          <Text style={modernStyles.infoText}>
                            Mark as planted to start milestone tracking
                          </Text>
                        </View>

                        <View style={modernStyles.plantActions}>
                          <TouchableOpacity
                            onPress={() => handleMarkAsPlanted(plant)}
                            activeOpacity={0.8}
                            style={{ flex: 1 }}
                          >
                            <LinearGradient
                              colors={['#16a34a', '#15803d']}
                              style={modernStyles.primaryAction}
                            >
                              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                              <Text style={modernStyles.primaryActionText}>Mark as Planted</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={[modernStyles.plantActions, { marginTop: 8 }]}>
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
                            style={[modernStyles.secondaryAction, { marginRight: 8 }]}
                          >
                            <MaterialCommunityIcons name="pencil" size={18} color="#16a34a" />
                            <Text style={modernStyles.secondaryActionText}>Edit</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleDeletePlant(plant.id, plant.plantName)}
                            style={[modernStyles.secondaryAction, { borderColor: '#dc2626' }]}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#dc2626" />
                            <Text style={[modernStyles.secondaryActionText, { color: '#dc2626' }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={[modernStyles.plantActions, { marginTop: 8 }]}>
                          <TouchableOpacity
                            onPress={() => openLogModal(plant)}
                            style={[modernStyles.secondaryAction, { borderColor: '#2563eb' }]}
                          >
                            <MaterialCommunityIcons name="note-plus" size={18} color="#2563eb" />
                            <Text style={[modernStyles.secondaryActionText, { color: '#2563eb' }]}>Add Log</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Progress Section */}
                        <View style={modernStyles.progressSection}>
                          <View style={modernStyles.progressHeader}>
                            <Text style={modernStyles.progressLabel}>Days Since Planted</Text>
                            <Text style={modernStyles.progressPercent}>{daysPlanted} days</Text>
                          </View>
                          <View style={modernStyles.progressBarContainer}>
                            <LinearGradient
                              colors={['#16a34a', '#22c55e']}
                              style={[modernStyles.progressBar, { width: `${progress}%` }]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            />
                          </View>
                          <Text style={modernStyles.currentStageText}>
                            Current Stage: {normalizeStage(getCurrentStageAuto(plant))}
                          </Text>
                        </View>

                        {/* Milestones */}
                        <View style={modernStyles.milestonesSection}>
                          {plant.milestones.map((milestone, index) => {
                            const current = normalizeStage(getCurrentStageAuto(plant));
                            const name = normalizeStage(milestone.name);
                            const isCurrentStage = name === current;
                            const isPastStage = daysPlanted >= (milestone.estimatedDays || 0);
                            
                            return (
                              <View
                                key={index}
                                style={[
                                  modernStyles.milestoneItem,
                                  isCurrentStage && modernStyles.milestoneItemActive,
                                  isPastStage && modernStyles.milestoneItemPast
                                ]}
                              >
                                <View style={[
                                  modernStyles.milestoneIcon,
                                  { backgroundColor: isPastStage ? '#16a34a' : isCurrentStage ? '#22c55e' : '#e5e7eb' }
                                ]}>
                                  <MaterialCommunityIcons
                                    name={isPastStage ? 'check' : isCurrentStage ? 'clock-outline' : 'circle-outline'}
                                    size={16}
                                    color={isPastStage || isCurrentStage ? '#fff' : '#9ca3af'}
                                  />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[
                                    modernStyles.milestoneText,
                                    (isPastStage || isCurrentStage) && modernStyles.milestoneTextReached
                                  ]}>
                                    {name}
                                  </Text>
                                  <Text style={modernStyles.milestoneDays}>Day {Math.round(milestone.estimatedDays || 0)}</Text>
                                </View>
                                {isCurrentStage && (
                                  <View style={modernStyles.activeBadge}>
                                    <Text style={modernStyles.activeBadgeText}>Active</Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>

                        {/* Action Buttons */}
                        <View style={[modernStyles.plantActions, { marginTop: 16 }]}>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPlant(plant);
                              setShowHarvestModal(true);
                            }}
                            activeOpacity={0.8}
                            style={{ flex: 1, marginRight: 8 }}
                          >
                            <LinearGradient
                              colors={['#7c3aed', '#6d28d9']}
                              style={modernStyles.primaryAction}
                            >
                              <MaterialCommunityIcons name="fruit-cherries" size={20} color="#fff" />
                              <Text style={modernStyles.primaryActionText}>Harvest</Text>
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
                            style={modernStyles.iconAction}
                          >
                            <MaterialCommunityIcons name="pencil" size={20} color="#16a34a" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleDeletePlant(plant.id, plant.plantName)}
                            style={[modernStyles.iconAction, { marginLeft: 8 }]}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#dc2626" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => openLogModal(plant)}
                            style={[modernStyles.iconAction, { marginLeft: 8 }]}
                          >
                            <MaterialCommunityIcons name="note-plus" size={20} color="#2563eb" />
                          </TouchableOpacity>
                        </View>

                      </>
                    )}

                    {/* Timeline */}
                    {(() => {
                      const timelineEntries = (plant.timeline || []).slice().sort((a, b) => {
                        const aTime = new Date(a.date || a.createdAt || '').getTime();
                        const bTime = new Date(b.date || b.createdAt || '').getTime();
                        return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
                      });
                      if (!timelineEntries.length) return null;
                      return (
                        <View style={modernStyles.timelineSection}>
                          <Text style={modernStyles.timelineHeader}>Plant Timeline</Text>
                          {timelineEntries.map((entry) => {
                            const categoryMeta = getCategoryMeta(entry.category);
                            const priorityMeta = getPriorityMeta(entry.priority);
                            return (
                              <View key={entry.id} style={modernStyles.timelineRow}>
                                <View style={modernStyles.timelineDotContainer}>
                                  <View style={modernStyles.timelineDot} />
                                  <View style={modernStyles.timelineLine} />
                                </View>
                                <View style={modernStyles.timelineCard}>
                                  <Text style={modernStyles.timelineTitle}>{entry.title || 'Update'}</Text>
                                  <Text style={modernStyles.timelineDate}>
                                    {formatTimelineDate(entry.date || entry.createdAt)}
                                  </Text>

                                  {(categoryMeta || priorityMeta) && (
                                    <View style={modernStyles.timelineMetaRow}>
                                      {categoryMeta ? (
                                        <View style={[modernStyles.timelineMetaTag, modernStyles.timelineCategoryTag]}>
                                          <MaterialCommunityIcons
                                            name={categoryMeta.icon || 'note-text-outline'}
                                            size={14}
                                            color="#0c4a6e"
                                          />
                                          <Text style={[modernStyles.timelineMetaText, { color: '#0c4a6e' }]}>
                                            {categoryMeta.label}
                                          </Text>
                                        </View>
                                      ) : null}

                                      {priorityMeta ? (
                                        <View
                                          style={[
                                            modernStyles.timelineMetaTag,
                                            { backgroundColor: priorityMeta.backgroundColor },
                                          ]}
                                        >
                                          <Text style={[modernStyles.timelineMetaText, { color: priorityMeta.textColor }]}>
                                            {priorityMeta.label}
                                          </Text>
                                        </View>
                                      ) : null}
                                    </View>
                                  )}

                                  {entry.photoUri ? (
                                    <Image
                                      source={{ uri: entry.photoUri }}
                                      style={modernStyles.timelinePhoto}
                                      resizeMode="cover"
                                    />
                                  ) : null}
                                  {entry.notes ? (
                                    <Text style={modernStyles.timelineNotes}>{entry.notes}</Text>
                                  ) : null}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()}

                    {/* Plant Info */}
                    {(plant.location || plant.notes) && (
                      <View style={modernStyles.plantInfo}>
                        {plant.location && (
                          <View style={modernStyles.infoRow}>
                            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
                            <Text style={modernStyles.infoRowText}>{plant.location}</Text>
                          </View>
                        )}
                        {plant.notes && (
                          <View style={modernStyles.infoRow}>
                            <MaterialCommunityIcons name="note-text" size={14} color="#6b7280" />
                            <Text style={modernStyles.infoRowText}>{plant.notes}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showLogModal}
        onRequestClose={() => {
          if (!logUploading) {
            setShowLogModal(false);
            setLogTargetPlant(null);
          }
        }}
      >
        <View style={modernStyles.logModalBackdrop}>
          <View style={modernStyles.logModalCard}>
            <View style={modernStyles.logModalHeader}>
              <Text style={modernStyles.logModalTitle}>Add Timeline Entry</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!logUploading) {
                    setShowLogModal(false);
                    setLogTargetPlant(null);
                  }
                }}
              >
                <MaterialCommunityIcons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Title (e.g., Pruned basil)"
                value={logForm.title}
                onChangeText={(text) => setLogForm((prev) => ({ ...prev, title: text }))}
                style={modernStyles.logInput}
              />
              <TextInput
                placeholder="Date (YYYY-MM-DD)"
                value={logForm.date}
                onChangeText={(text) => setLogForm((prev) => ({ ...prev, date: text }))}
                style={modernStyles.logInput}
              />

              <Text style={modernStyles.logSectionLabel}>Log Type</Text>
              <View style={modernStyles.logChipRow}>
                {LOG_CATEGORIES.map((option) => {
                  const active = logForm.category === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[modernStyles.logChip, active && modernStyles.logChipActive]}
                      onPress={() => setLogForm((prev) => ({ ...prev, category: option.key }))}
                    >
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={14}
                        color={active ? '#fff' : '#2563eb'}
                      />
                      <Text style={[modernStyles.logChipText, active && modernStyles.logChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={modernStyles.logSectionLabel}>Priority</Text>
              <View style={modernStyles.logChipRow}>
                {LOG_PRIORITIES.map((option) => {
                  const active = logForm.priority === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[modernStyles.logChip, active && modernStyles.logChipActive]}
                      onPress={() => setLogForm((prev) => ({ ...prev, priority: option.key }))}
                    >
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={14}
                        color={active ? '#fff' : '#2563eb'}
                      />
                      <Text style={[modernStyles.logChipText, active && modernStyles.logChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                placeholder="Notes"
                value={logForm.notes}
                onChangeText={(text) => setLogForm((prev) => ({ ...prev, notes: text }))}
                style={[modernStyles.logInput, modernStyles.logTextArea]}
                multiline
              />

              {logPhoto ? (
                <View style={modernStyles.logPhotoPreviewContainer}>
                  <Image source={{ uri: logPhoto }} style={modernStyles.logPhotoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={modernStyles.logPhotoRemove}
                    onPress={() => setLogPhoto(null)}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={modernStyles.logPhotoButton} onPress={handlePickLogPhoto}>
                  <MaterialCommunityIcons name="image-plus" size={20} color="#2563eb" />
                  <Text style={modernStyles.logPhotoButtonText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={modernStyles.logModalActions}>
              <TouchableOpacity
                style={[modernStyles.logModalButton, { backgroundColor: '#f3f4f6', marginRight: 12 }]}
                onPress={() => {
                  if (!logUploading) {
                    setShowLogModal(false);
                    setLogTargetPlant(null);
                  }
                }}
              >
                <Text style={[modernStyles.logModalButtonText, { color: '#374151' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modernStyles.logModalButton, { backgroundColor: logUploading ? '#93c5fd' : '#2563eb' }]}
                onPress={handleAddTimelineLog}
                disabled={logUploading}
              >
                <Text style={[modernStyles.logModalButtonText, { color: '#fff' }]}>
                  {logUploading ? 'Saving...' : 'Save Log'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dcfce7',
    marginTop: 4,
    fontWeight: '500',
  },
  statsContainer: {
    padding: 16,
    marginTop: -16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  plantsContainer: {
    paddingHorizontal: 16,
  },
  plantCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  plantHeader: {
    padding: 16,
  },
  plantHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantEmoji: {
    fontSize: 40,
  },
  plantName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  plantVariety: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  plantBody: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  daysText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  currentStageText: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 8,
    fontWeight: '600',
  },
  milestonesSection: {
    marginBottom: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 8,
  },
  milestoneItemActive: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    marginBottom: 4,
  },
  milestoneItemPast: {
    opacity: 0.7,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  milestoneTextReached: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  milestoneDays: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  timelineSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  timelineHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDotContainer: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
    marginTop: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  timelineNotes: {
    fontSize: 13,
    color: '#374151',
    marginTop: 8,
    lineHeight: 18,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  timelineMetaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  timelineMetaText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timelineCategoryTag: {
    backgroundColor: '#e0f2fe',
  },
  timelinePhoto: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 8,
  },
  logModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logModalCard: {
    width: width - 48,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  logModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  logInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 12,
  },
  logTextArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  logPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
  },
  logPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 6,
  },
  logSectionLabel: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  logChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  logChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  logChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  logChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 6,
  },
  logChipTextActive: {
    color: '#fff',
  },
  logPhotoPreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  logPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  logPhotoRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  logModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logModalButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  plantActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#16a34a',
    backgroundColor: '#fff',
  },
  secondaryActionText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  iconAction: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  plantInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoRowText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCard: {
    width: width - 64,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
