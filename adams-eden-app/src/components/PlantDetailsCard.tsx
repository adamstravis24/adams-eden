import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appStyles, makeThemedStyles } from '../styles/appStyles';
import { useTheme } from '../context/ThemeContext';
import { Plant } from '../types/plants';
import { PlantIdSuggestion } from '../services/plantIdService';

const styles = appStyles;

type Props = {
  suggestion: PlantIdSuggestion;
  localPlant?: Plant;
};

export const PlantDetailsCard: React.FC<Props> = ({ suggestion, localPlant }) => {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const hasImages = Array.isArray(suggestion.similar_images) && suggestion.similar_images.length > 0;
  const desc = (suggestion.wiki_description?.value || '').toLowerCase();

  const inferSunlight = React.useMemo((): 'full sun' | 'partial sun' | 'shade' | 'unknown' => {
    // Prefer structured sunlight from API if present
    const sl = Array.isArray(suggestion.sunlight) ? suggestion.sunlight.map(s => s.toLowerCase()) : [];
    if (sl.length) {
      if (sl.some(s => s.includes('full'))) return 'full sun';
      if (sl.some(s => s.includes('partial') || s.includes('part shade') || s.includes('part sun'))) return 'partial sun';
      if (sl.some(s => s.includes('shade'))) return 'shade';
    }
    // Fallback to description heuristics
    const t = desc;
    if (!t) return 'unknown';
    if (/(full\s+sun|full\s+sunlight|requires\s+full\s+sun)/i.test(t)) return 'full sun';
    if (/(partial\s+(sun|shade)|part\s+(sun|shade)|dappled\s+shade)/i.test(t)) return 'partial sun';
    if (/(full\s+shade|grows\s+in\s+shade|shade\s+tolerant)/i.test(t)) return 'shade';
    return 'unknown';
  }, [desc, suggestion.sunlight]);

  const inferToxicity = React.useMemo(() => {
    const res: { humans?: boolean; cats?: boolean; dogs?: boolean } = {};
    const tox = suggestion.toxicity;
    // Prefer structured toxicity if available
    try {
      if (tox && typeof tox === 'object') {
        const val = (k: string) => {
          const v = (tox as any)[k];
          if (typeof v === 'boolean') return v;
          if (typeof v === 'string') return /toxic|poisonous/i.test(v) && !/non[-\s]?toxic|not\s+toxic/i.test(v);
          return undefined;
        };
        res.humans = val('humans') ?? val('human');
        res.cats = val('cats') ?? val('cat');
        res.dogs = val('dogs') ?? val('dog');
        const pets = val('pets') ?? val('pet');
        if (pets !== undefined) {
          if (res.cats === undefined) res.cats = pets;
          if (res.dogs === undefined) res.dogs = pets;
        }
      }
    } catch {}

    // Fallback to description heuristics
    const t = desc;
    if (t) {
      if (res.humans === undefined) {
        if (/non[-\s]?toxic\s+to\s+humans|not\s+toxic\s+to\s+humans/i.test(t)) res.humans = false;
        else if (/toxic|poisonous/.test(t) && /to\s+humans/.test(t)) res.humans = true;
      }
      const petsNonToxic = /non[-\s]?toxic\s+to\s+pets|not\s+toxic\s+to\s+pets/i.test(t);
      if (res.cats === undefined) {
        if (/non[-\s]?toxic\s+to\s+cats|not\s+toxic\s+to\s+cats/i.test(t) || petsNonToxic) res.cats = false;
        else if (/toxic|poisonous/.test(t) && (/to\s+cats/.test(t) || /to\s+pets/.test(t))) res.cats = true;
      }
      if (res.dogs === undefined) {
        if (/non[-\s]?toxic\s+to\s+dogs|not\s+toxic\s+to\s+dogs/i.test(t) || petsNonToxic) res.dogs = false;
        else if (/toxic|poisonous/.test(t) && (/to\s+dogs/.test(t) || /to\s+pets/.test(t))) res.dogs = true;
      }
    }
    return res;
  }, [desc, suggestion.toxicity]);

  const displayCommonName = React.useMemo(() => {
    // Prefer a local catalog name (often common name), fall back to first common name from Plant.id
    if (localPlant?.name) return localPlant.name;
    if (Array.isArray(suggestion.common_names) && suggestion.common_names.length) {
      return suggestion.common_names[0];
    }
    return undefined;
  }, [localPlant?.name, suggestion.common_names]);

  return (
    <View style={[t.card]}>
      {/* Names */}
      {displayCommonName ? (
        <Text style={t.h3}>{displayCommonName}</Text>
      ) : null}
      <Text style={{ marginTop: displayCommonName ? 2 : 0 }}>
        <Text style={{ fontStyle: 'italic', fontWeight: '600' }}>{suggestion.name}</Text>
        <Text style={{ color: palette.textMuted }}> ({Math.round(suggestion.probability * 100)}%)</Text>
      </Text>

      {/* Family */}
      {suggestion.taxonomy?.family ? (
        <Text style={{ marginTop: 4, color: palette.text }}>Family: <Text style={{ fontWeight: '600' }}>{suggestion.taxonomy.family}</Text></Text>
      ) : null}

      {/* Description */}
      {suggestion.wiki_description?.value ? (
        <Text style={{ marginTop: 6, color: palette.text }}>{suggestion.wiki_description.value}</Text>
      ) : null}

      {/* Sun exposure & Cold hardiness */}
      <View style={{ marginTop: 10 }}>
        <Text>
          Sunlight: <Text style={{ fontWeight: '700', textTransform: 'capitalize' }}>{inferSunlight}</Text>
        </Text>
        <Text style={{ marginTop: 2 }}>
          Cold hardiness: <Text style={{ fontWeight: '700' }}>{localPlant ? `Zones ${localPlant.minZone}–${localPlant.maxZone}` : 'Unknown'}</Text>
        </Text>
      </View>

      {/* Toxicity */}
      <View style={{ marginTop: 10 }}>
        <Text style={t.h4}>Toxicity</Text>
        <Text style={{ marginTop: 4 }}>Humans: <Text style={{ fontWeight: '700' }}>{inferToxicity.humans === undefined ? 'Unknown' : inferToxicity.humans ? 'Toxic' : 'Not toxic'}</Text></Text>
        <Text>Pets: <Text style={{ fontWeight: '700' }}>{(inferToxicity.cats ?? inferToxicity.dogs) === undefined ? 'Unknown' : (inferToxicity.cats || inferToxicity.dogs) ? 'Toxic' : 'Not toxic'}</Text></Text>
        <Text style={{ color: palette.textMuted, marginTop: 2 }}>• Cats: <Text style={{ color: palette.text, fontWeight: '600' }}>{inferToxicity.cats === undefined ? 'Unknown' : inferToxicity.cats ? 'Toxic' : 'Not toxic'}</Text></Text>
        <Text style={{ color: palette.textMuted }}>• Dogs: <Text style={{ color: palette.text, fontWeight: '600' }}>{inferToxicity.dogs === undefined ? 'Unknown' : inferToxicity.dogs ? 'Toxic' : 'Not toxic'}</Text></Text>
      </View>

      {/* Family chips removed to avoid duplication; Family line above covers it */}

      {/* Common names */}
      {suggestion.common_names?.length ? (
        <Text style={{ marginTop: 8, color: palette.text }}>Also known as: {suggestion.common_names.slice(0, 5).join(', ')}</Text>
      ) : null}

      {/* Local planting calendar */}
      {localPlant ? (
        <View style={{ marginTop: 12 }}>
          <Text style={t.h4}>Your local schedule</Text>
          <View style={{ marginTop: 6 }}>
            <Text>Start seeds indoor: <Text style={{ fontWeight: '700' }}>{localPlant.startSeedIndoor}</Text></Text>
            <Text>Transplant outdoors: <Text style={{ fontWeight: '700' }}>{localPlant.transplantOutdoor}</Text></Text>
            <Text>Direct sow outdoors: <Text style={{ fontWeight: '700' }}>{localPlant.startSeedOutdoor}</Text></Text>
            <Text>Harvest: <Text style={{ fontWeight: '700' }}>{localPlant.harvestDate}</Text></Text>
          </View>
        </View>
      ) : (
        <Text style={{ marginTop: 12, color: palette.textMuted }}>No local schedule found in catalog.</Text>
      )}

      {/* Similar images carousel */}
      {hasImages ? (
        <View style={{ marginTop: 12 }}>
          <Text style={t.h4}>Similar images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {suggestion.similar_images!.slice(0, 10).map((img, idx) => (
              <Image key={idx} source={{ uri: img.url }} style={{ width: 120, height: 120, borderRadius: 10, marginRight: 8 }} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Provenance footer without links */}
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <MaterialCommunityIcons name="information" color={palette.textMuted} size={18} />
        <Text style={{ color: palette.textMuted, marginLeft: 6 }}>Details provided by Plant.id; schedule from your Adams Eden settings</Text>
      </View>
    </View>
  );
};

export default PlantDetailsCard;
