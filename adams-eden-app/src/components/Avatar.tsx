import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  photoURL?: string | null;
  displayName?: string;
  email?: string;
  size?: number;
}

export default function Avatar({ photoURL, displayName, email, size = 40 }: AvatarProps) {
  // Get initials from display name or email
  const getInitials = () => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Generate color based on email/name for consistent colors
  const getAvatarColor = () => {
    const str = email || displayName || 'default';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#16a34a', // green
      '#2563eb', // blue
      '#dc2626', // red
      '#ea580c', // orange
      '#9333ea', // purple
      '#0891b2', // cyan
      '#ca8a04', // yellow
      '#e11d48', // pink
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const backgroundColor = getAvatarColor();
  const containerSize = { width: size, height: size, borderRadius: size / 2 };
  const fontSize = size / 2.5;

  if (photoURL) {
    return (
      <View style={[styles.container, containerSize, styles.imageContainer]}>
        <Image 
          source={{ uri: photoURL }} 
          style={[styles.image, containerSize]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerSize, { backgroundColor }]}>
      <Text style={[styles.initials, { fontSize }]}>{getInitials()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    backgroundColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
