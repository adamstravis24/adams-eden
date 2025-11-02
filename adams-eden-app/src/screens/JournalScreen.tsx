import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import HeaderBar from '../components/HeaderBar';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  tags?: string[];
  plantName?: string;
  weather?: string;
  temperature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function JournalScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [plantName, setPlantName] = useState('');
  const [weather, setWeather] = useState('');
  const [temperature, setTemperature] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showWeatherPicker, setShowWeatherPicker] = useState(false);

  const weatherOptions = [
    { label: 'None', value: '' },
    { label: '☀️ Sunny', value: '☀️ Sunny' },
    { label: '⛅ Partly Cloudy', value: '⛅ Partly Cloudy' },
    { label: '☁️ Cloudy', value: '☁️ Cloudy' },
    { label: '🌧️ Rainy', value: '🌧️ Rainy' },
    { label: '⛈️ Stormy', value: '⛈️ Stormy' },
  ];

  // Load entries from Firebase with real-time updates
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const entriesRef = collection(db, 'users', user.id, 'journal');
    const q = query(entriesRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedEntries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          date: data.date?.toDate() || new Date(),
          tags: data.tags || [],
          plantName: data.plantName,
          weather: data.weather,
          temperature: data.temperature,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });
      setEntries(loadedEntries);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading journal entries:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load journal entries');
    });

    return () => unsubscribe();
  }, [user]);

  const handleNewEntry = () => {
    setCurrentEntry(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
  };

  const handleSaveEntry = async () => {
    if (!user) {
      Alert.alert('Not Signed In', 'Please sign in to save journal entries');
      return;
    }

    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Entry', 'Please add a title or content');
      return;
    }

    try {
      const entryData = {
        title: title.trim() || 'Untitled',
        content: content.trim(),
        date: Timestamp.now(),
        tags: tags,
        plantName: plantName.trim() || undefined,
        weather: weather.trim() || undefined,
        temperature: temperature.trim() || undefined,
        updatedAt: Timestamp.now(),
      };

      if (currentEntry) {
        // Update existing entry
        const entryRef = doc(db, 'users', user.id, 'journal', currentEntry.id);
        await updateDoc(entryRef, entryData);
      } else {
        // Create new entry
        const entriesRef = collection(db, 'users', user.id, 'journal');
        await addDoc(entriesRef, {
          ...entryData,
          createdAt: Timestamp.now(),
        });
      }

      setIsEditing(false);
      setCurrentEntry(null);
      setTitle('');
      setContent('');
      setTags([]);
      setPlantName('');
      setWeather('');
      setTemperature('');
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.id, 'journal', id));
              if (currentEntry?.id === id) {
                setIsEditing(false);
                setCurrentEntry(null);
                setTitle('');
                setContent('');
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setTags(entry.tags || []);
    setPlantName(entry.plantName || '');
    setWeather(entry.weather || '');
    setTemperature(entry.temperature || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentEntry(null);
    setTitle('');
    setContent('');
    setTags([]);
    setPlantName('');
    setWeather('');
    setTemperature('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <HeaderBar />
        <View style={[styles.emptyState, { justifyContent: 'center' }]}>
          <MaterialCommunityIcons name="loading" size={64} color={palette.textMuted} />
          <Text style={[styles.emptyText, { color: palette.textMuted, marginTop: 16 }]}>
            Loading journal entries...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <HeaderBar />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-alert" size={64} color={palette.textMuted} />
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            Please sign in to view your journal
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <HeaderBar showBack onMenuPress={handleCancel} />
        <View style={styles.editorHeader}>
          <Text style={[styles.editorTitle, { color: palette.text }]}>
            {currentEntry ? 'Edit Entry' : 'New Journal Entry'}
          </Text>
        </View>
        <ScrollView style={[styles.editorContainer, { backgroundColor: palette.background }]}>
          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Title *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: palette.surface, 
                color: palette.text,
                borderColor: palette.border
              }]}
              placeholder="What happened today?"
              placeholderTextColor={palette.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Plant Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Plant Name (Optional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: palette.surface, 
                color: palette.text,
                borderColor: palette.border
              }]}
              placeholder="e.g., Tomato, Basil"
              placeholderTextColor={palette.textMuted}
              value={plantName}
              onChangeText={setPlantName}
            />
          </View>

          {/* Weather & Temperature Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: palette.text }]}>Weather</Text>
              <TouchableOpacity
                onPress={() => setShowWeatherPicker(true)}
                style={[styles.pickerContainer, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <View style={styles.pickerButton}>
                  <Text style={[styles.pickerText, { color: weather ? palette.text : palette.textMuted }]}>
                    {weather || 'Select...'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={palette.textMuted} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: palette.text }]}>Temperature (°F)</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: palette.surface, 
                  color: palette.text,
                  borderColor: palette.border
                }]}
                placeholder="72"
                placeholderTextColor={palette.textMuted}
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Entry *</Text>
            <TextInput
              style={[styles.contentInput, { 
                backgroundColor: palette.surface, 
                color: palette.text,
                borderColor: palette.border
              }]}
              placeholder="Write about your observations, tasks completed, or anything noteworthy..."
              placeholderTextColor={palette.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, { color: palette.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: '#16a34a' }]}
              onPress={handleSaveEntry}
            >
              <MaterialCommunityIcons name="check" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={[styles.buttonText, { color: '#fff' }]}>{currentEntry ? 'Update Entry' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Weather Picker Modal */}
        <Modal
          visible={showWeatherPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWeatherPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowWeatherPicker(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Select Weather</Text>
              {weatherOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: palette.border },
                    weather === option.value && { backgroundColor: palette.surfaceMuted }
                  ]}
                  onPress={() => {
                    setWeather(option.value);
                    setShowWeatherPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: palette.text }]}>
                    {option.label}
                  </Text>
                  {weather === option.value && (
                    <MaterialCommunityIcons name="check" size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <HeaderBar />
      <View style={styles.mainHeader}>
        <Text style={[styles.screenTitle, { color: palette.text }]}>Garden Journal</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="notebook-outline" size={64} color={palette.textMuted} />
            <Text style={[styles.emptyText, { color: palette.textMuted }]}>
              No journal entries yet
            </Text>
            <Text style={[styles.emptySubtext, { color: palette.textMuted }]}>
              Start documenting your garden journey!
            </Text>
          </View>
        ) : (
          entries.map(entry => (
            <View key={entry.id} style={[styles.entryCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.entryHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.entryTitle, { color: palette.text }]}>{entry.title}</Text>
                  <Text style={[styles.entryDate, { color: palette.textMuted }]}>
                    {formatDate(entry.date)}
                  </Text>
                </View>
                <View style={styles.entryActions}>
                  <TouchableOpacity onPress={() => handleEditEntry(entry)} style={styles.iconButton}>
                    <MaterialCommunityIcons name="pencil" size={20} color={palette.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.iconButton}>
                    <MaterialCommunityIcons name="delete" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
              {entry.content && (
                <Text style={[styles.entryContent, { color: palette.text }]} numberOfLines={4}>
                  {entry.content}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#16a34a' }]}
        onPress={handleNewEntry}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mainHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
  },
  contentInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 150,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
  },
});
