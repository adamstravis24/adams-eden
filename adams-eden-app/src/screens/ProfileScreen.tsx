import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import HeaderBar from '../components/HeaderBar';
import Avatar from '../components/Avatar';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileScreen() {
  const { palette } = useTheme();
  const { user, logout, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a photo');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo');
      return;
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storage = getStorage();
      const filename = `profile_${user.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profilePictures/${user.id}/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile with new photo URL
      await updateUserProfile(displayName || undefined, downloadURL);

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(displayName || undefined, user?.photoURL);
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <HeaderBar />
        <View style={styles.centerContent}>
          <Text style={[styles.message, { color: palette.textMuted }]}>Please sign in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <HeaderBar />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Profile & Settings</Text>
        </View>

        {/* Avatar Section */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showPhotoOptions} disabled={isUploading}>
              <View>
                <Avatar 
                  photoURL={user.photoURL} 
                  displayName={displayName} 
                  email={user.email}
                  size={100}
                />
                <View style={[styles.editBadge, { backgroundColor: palette.primary }]}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: palette.textMuted }]}>
              {isUploading ? 'Uploading...' : 'Tap to change photo'}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Profile Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: palette.background, 
                color: palette.text,
                borderColor: palette.border
              }]}
              placeholder="Enter your name"
              placeholderTextColor={palette.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: palette.surfaceMuted, 
                color: palette.textMuted,
                borderColor: palette.border
              }]}
              value={user.email}
              editable={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#16a34a' }]}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Account</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomColor: palette.border }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#dc2626" />
            <Text style={[styles.actionText, { color: '#dc2626' }]}>Sign Out</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  formGroup: {
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
  },
});
