import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { HeaderBar } from '../components/HeaderBar';
import * as ImagePicker from 'expo-image-picker';
import { identifyPlantFromBase64, PlantIdResponse, PlantIdSuggestion, getPlantIdApiKeyInfo } from '../services/plantIdService';
import { useGarden } from '../context/GardenContext';
import { findBestLocalPlant } from '../services/localPlantDb';
import PlantDetailsCard from '../components/PlantDetailsCard';
import { useTheme } from '../context/ThemeContext';

const styles = appStyles;

export default function IdentifyScreen() {
  const { plantDatabase } = useGarden();
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const [images, setImages] = React.useState<{ uri: string; base64?: string }[]>([]);
  const [result, setResult] = React.useState<PlantIdResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const apiInfo = React.useMemo(() => getPlantIdApiKeyInfo(), []);

  const topSuggestion = React.useMemo<PlantIdSuggestion | null>(() => {
    if (!result?.suggestions?.length) return null;
    let best: PlantIdSuggestion | null = null;
    for (const s of result.suggestions) {
      if (!best || (s.probability ?? 0) > (best.probability ?? 0)) best = s;
    }
    return best;
  }, [result]);

  const requestPermissions = React.useCallback(async (kind: 'camera' | 'library') => {
    if (kind === 'camera') {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.status !== 'granted') {
        Alert.alert('Camera permission required', 'Please allow camera access to take a photo.');
        return false;
      }
      return true;
    }
    // library
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (lib.status !== 'granted') {
      Alert.alert('Photo library permission required', 'Please allow photo library access to pick an image.');
      return false;
    }
    return true;
  }, []);

  const pickImage = React.useCallback(async (useCamera: boolean) => {
    const ok = await requestPermissions(useCamera ? 'camera' : 'library');
    if (!ok) return;
    setError(null);
  setResult(null);

    const options: ImagePicker.ImagePickerOptions = {
      base64: true,
      quality: 0.85,
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      cameraType: ImagePicker.CameraType.back,
    };

    const resp = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (resp.canceled) return;
    const asset = resp.assets?.[0];
    if (!asset) return;
  setImages([{ uri: asset.uri, base64: typeof asset.base64 === 'string' ? asset.base64 : undefined }]);
  }, [requestPermissions]);

  const runIdentify = React.useCallback(async () => {
    try {
      if (!images.length || !images[0].base64) {
        Alert.alert('No image', 'Please take or pick a photo first.');
        return;
      }
      setLoading(true);
      setError(null);
      const res = await identifyPlantFromBase64([images[0].base64]);
      setResult(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Identification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [images]);

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
      <HeaderBar />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, paddingTop: 24 }}>
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <MaterialCommunityIcons name="camera" size={48} color={palette.primary} />
          <Text style={[t.h2, { marginTop: 8 }]}>Plant Identification</Text>
          <Text style={[t.p, { textAlign: 'center' }]}>Take or pick a photo to identify the plant</Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: apiInfo.present ? palette.primary : '#fca5a5' }}>
            API key: {apiInfo.present ? `Detected (${apiInfo.preview})` : 'Missing EXPO_PUBLIC_PLANT_ID_API_KEY'}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <TouchableOpacity style={[t.btn, t.btnPrimary, { marginRight: 8 }]} onPress={() => pickImage(true)}>
              <Text style={[t.btnText, t.btnTextPrimary]}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[t.btn]} onPress={() => pickImage(false)}>
              <Text style={t.btnText}>Pick from Library</Text>
            </TouchableOpacity>
          </View>
          {images.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Image source={{ uri: images[0].uri }} style={{ width: 220, height: 220, borderRadius: 12 }} />
            </View>
          )}
          <TouchableOpacity
            style={[t.btn, t.btnPrimary, { marginTop: 12, opacity: loading ? 0.7 : 1 }]}
            onPress={runIdentify}
            disabled={loading || images.length === 0}
          >
            <Text style={[t.btnText, t.btnTextPrimary]}>{loading ? 'Identifying…' : 'Identify'}</Text>
          </TouchableOpacity>
          {error && (
            <Text style={{ color: '#fca5a5', marginTop: 8 }}>{error}</Text>
          )}
        </View>

        {loading && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        )}

        {result && (
          <View style={{ marginTop: 16 }}>
            <View style={[t.card] }>
              <Text style={t.h3}>Top match</Text>
              {result.is_plant !== undefined && (
                <Text style={{ color: palette.text, marginTop: 4 }}>Is plant: {String(result.is_plant)} ({Math.round((result.is_plant_probability ?? 0) * 100)}%)</Text>
              )}
            </View>
            {topSuggestion ? (
              <View style={{ marginTop: 12 }}>
                <PlantDetailsCard
                  suggestion={topSuggestion}
                  localPlant={findBestLocalPlant(plantDatabase, {
                    scientificName: topSuggestion.name,
                    commonNames: topSuggestion.common_names,
                  })}
                />
              </View>
            ) : (
              <View style={[t.card, { marginTop: 12 }]}>
                <Text>No suggestions found.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
