import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, Platform, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { makeThemedStyles } from '../styles/appStyles';
// API-only database screen: no local catalog fallback
import { isPerenualConfigured, listSpecies, PerenualSpeciesListItem, getSpeciesDetails, PerenualSpeciesDetail, subscribeRateLimit, getRateLimitState } from '../services/perenualService';
import { HeaderBar } from '../components/HeaderBar';
import { Plant } from '../types/plants';

export default function PlantDatabaseScreen() {
  const { palette } = useTheme();
  const t = makeThemedStyles(palette);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const MIN_QUERY = 3; // avoid hammering API on very short queries

  const [apiEnabled] = useState(isPerenualConfigured() && Platform.OS !== 'web');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiItems, setApiItems] = useState<PerenualSpeciesListItem[]>([]);
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null);
  const [selected, setSelected] = useState<
    | { mode: 'api'; item: PerenualSpeciesListItem; details?: PerenualSpeciesDetail | null }
    | { mode: 'local'; item: Plant }
    | null
  >(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>(getRateLimitState().until);
  const cooling = cooldownUntil !== undefined && Date.now() < cooldownUntil;
  // Tick state to refresh countdown UI while cooling
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [endReachedDuringMomentum, setEndReachedDuringMomentum] = useState<boolean>(false);
  const [lastLoadMoreAt, setLastLoadMoreAt] = useState<number>(0);
  useEffect(() => {
    if (!cooling) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooling]);

  // Debounce query input to avoid rapid API calls and 429
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 650);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    // Subscribe to rate-limit cooldown updates
    const unsub = subscribeRateLimit((s) => setCooldownUntil(s.until));
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!apiEnabled) return;
    // Don't start a request while we're cooling down
    if (cooling) return;
    const ac = new AbortController();
    const run = async () => {
      // Don't fetch without a search query or if below minimum length
      if (!debouncedQuery || debouncedQuery.length < MIN_QUERY) {
        if (!cancelled) {
          setIsLoading(false);
          setError(null);
          if (page === 1) {
            setApiItems([]);
            setMeta(null);
          }
        }
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await listSpecies({ q: debouncedQuery || undefined, page }, { signal: ac.signal });
        if (cancelled) return;
        const items = Array.isArray(res.data) ? res.data : [];
        // Client-side relevance ranking
        const rank = (txt: string, q: string) => {
          const t = normalize(txt);
          const qq = normalize(q);
          if (!qq) return 0;
          if (t === qq) return 100;
          if (t.startsWith(qq)) return 80;
          if (t.includes(qq)) return 60;
          return 0;
        };
        const scoreItem = (item: PerenualSpeciesListItem, q: string) => {
          const names: string[] = [];
          if (item.common_name) names.push(item.common_name);
          if (Array.isArray(item.scientific_name)) names.push(...item.scientific_name);
          if (Array.isArray(item.other_name)) names.push(...(item.other_name as string[]));
          else if (typeof item.other_name === 'string') names.push(item.other_name);
          return Math.max(0, ...names.map(n => rank(n, q)));
        };
        const ranked = debouncedQuery
          ? [...items].sort((a, b) => scoreItem(b, debouncedQuery) - scoreItem(a, debouncedQuery))
          : items;
        setApiItems(prev => (page === 1 ? ranked : [...prev, ...ranked]));
        setMeta({ current_page: res.meta?.current_page ?? page, last_page: res.meta?.last_page ?? page });
        if (page === 1 && items.length === 0 && debouncedQuery) {
          setError('No species found. Try a different search or clear filters.');
        }
      } catch (e) {
        if (cancelled) return;
        if ((e as any)?.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load species');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
      // Abort in-flight fetch when effect disposes
      try { ac.abort(); } catch {}
    };
  }, [apiEnabled, debouncedQuery, page]); // Don't depend on 'cooling' to avoid feedback loop

  const data = useMemo(() => apiItems, [apiItems]);

  function normalize(s: string): string {
    try {
      return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s.-]/g, '')
        .trim();
    } catch {
      return s.toLowerCase();
    }
  }

  const openItem = async (item: any) => {
    if (typeof item.id === 'number') {
      // API item
      setSelected({ mode: 'api', item });
      setIsDetailLoading(true);
      setDetailError(null);
      try {
        const ac = new AbortController();
        const details = await getSpeciesDetails(item.id, { signal: ac.signal });
        setSelected(prev => (prev && prev.mode === 'api' ? { ...prev, details } : prev));
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          setDetailError(e instanceof Error ? e.message : 'Failed to load details');
        }
      } finally {
        setIsDetailLoading(false);
      }
    } else {
      // Local catalog item
      setSelected({ mode: 'local', item });
    }
  };

  // Reset page to 1 when debounced search actually changes (skip initial mount)
  const prevDebouncedQuery = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!apiEnabled) return;
    if (prevDebouncedQuery.current !== undefined && prevDebouncedQuery.current !== debouncedQuery) {
      setPage(1);
      setApiItems([]);
      setMeta(null);
    }
    prevDebouncedQuery.current = debouncedQuery;
  }, [apiEnabled, debouncedQuery]);

  const headerComponent = (
    <View style={{ paddingHorizontal: 12, paddingTop: 16 }}>
      <Text style={t.h2}>Plant Database</Text>
      <Text style={[t.small, { marginTop: 4, color: palette.textMuted }]}>Using: {apiEnabled ? 'Perenual API (online)' : 'API disabled (set EXPO_PUBLIC_PERENUAL_API_KEY and use device/emulator)'}</Text>
      <TextInput
        placeholder="Search plants..."
        value={query}
        onChangeText={(v) => { setQuery(v); }}
        style={[t.input, { marginTop: 12 }]}
        placeholderTextColor={palette.textMuted}
      />
      {((query && query.trim().length > 0 && query.trim().length < MIN_QUERY)) && (
        <Text style={[t.small, { marginTop: 6, color: palette.textMuted }]}>Type at least {MIN_QUERY} characters to search.</Text>
      )}
      {/* A–Z removed for reliability; search-driven catalog */}
      {apiEnabled && error && (
        <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 }}>
          <Text style={{ color: palette.text, fontWeight: '700', marginBottom: 6 }}>⚠️ API Error</Text>
          <Text style={{ color: palette.text }}>{error}</Text>
          {error.includes('Rate limited') && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: palette.background, borderRadius: 8 }}>
              <Text style={{ color: palette.textMuted, fontSize: 13 }}>
                💡 Perenual's free tier has strict limits (~100 requests/day, possibly 1-2/minute).{'\n\n'}
                Try:{'\n'}
                • Wait a few minutes before searching again{'\n'}
                • Use more specific search terms{'\n'}
                • Consider upgrading at perenual.com for higher limits
              </Text>
            </View>
          )}
          {Platform.OS === 'web' && (
            <Text style={{ color: palette.text, marginTop: 6 }}>Tip: Browsers may block cross-origin requests (CORS). Use a device/emulator, or set EXPO_PUBLIC_PERENUAL_PROXY_URL to a CORS proxy.</Text>
          )}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity onPress={() => setPage(p => p)} style={[t.btn, { paddingHorizontal: 12, paddingVertical: 6 }]}>
              <Text style={t.btnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {apiEnabled && isLoading && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      )}
      {apiEnabled && cooling && (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }}>
          <Text style={[t.small, { color: palette.text }]}>
            {(() => {
              const secs = Math.max(0, Math.ceil(((cooldownUntil || nowTs) - nowTs) / 1000));
              return `Cooling down due to API rate limit. Resuming in ${secs}s…`;
            })()}
          </Text>
        </View>
      )}
    </View>
  );

  // data prepared above

  return (
    <SafeAreaView style={[t.container, { paddingTop: 0 }]} edges={["left", "right", "bottom"]}>
      <HeaderBar />
      <FlatList
        data={data}
        keyExtractor={(item: any) => (typeof item.id === 'number' ? String(item.id) : item.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={headerComponent}
        renderItem={({ item }: any) => {
          const isApi = typeof item.id === 'number';
          return (
            <TouchableOpacity onPress={() => openItem(item)} activeOpacity={0.7} style={{ width: '48%' }}>
              <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
                  {isApi ? (
                    item.default_image?.thumbnail ? (
                      <Image source={{ uri: item.default_image.thumbnail }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                    ) : item.default_image?.small_url ? (
                      <Image source={{ uri: item.default_image.small_url }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                    ) : item.default_image?.regular_url ? (
                      <Image source={{ uri: item.default_image.regular_url }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                    ) : (
                      <Text style={{ fontSize: 36 }}>🌱</Text>
                    )
                  ) : (
                    <Text style={{ fontSize: 36 }}>{item.image}</Text>
                  )}
                </View>
                <Text style={[t.h4, { textAlign: 'center', marginTop: 6 }]}>
                  {isApi ? (item.common_name || (item.scientific_name?.[0] ?? 'Unknown')) : item.name}
                </Text>
                <Text style={[t.small, { textAlign: 'center', marginTop: 2 }]}>
                  {isApi ? (item.genus || item.family || '') : item.category}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={!isLoading ? (
          <View style={{ paddingHorizontal: 12, paddingTop: 16 }}>
            <Text style={t.p}>{
              !query || query.trim().length === 0
                ? 'Start typing to search.'
                : (query.trim().length < MIN_QUERY
                    ? `Type at least ${MIN_QUERY} characters to search.`
                    : (debouncedQuery ? 'No results found. Try adjusting your search.' : ''))
            }</Text>
          </View>
        ) : null}
        onMomentumScrollBegin={() => setEndReachedDuringMomentum(false)}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (endReachedDuringMomentum) return;
          const now = Date.now();
          if (now - lastLoadMoreAt < 1200) return; // throttle load-more calls
          if (meta && page < (meta.last_page || 1) && !isLoading && !error && !cooling && debouncedQuery && debouncedQuery.length >= MIN_QUERY) {
            setEndReachedDuringMomentum(true);
            setLastLoadMoreAt(now);
            setPage(p => p + 1);
          }
        }}
        refreshing={(isLoading && page === 1) || cooling}
        onRefresh={() => { if (!cooling && debouncedQuery && debouncedQuery.length >= MIN_QUERY) { setPage(1); setApiItems([]); setMeta(null); setError(null); } }}
        ListFooterComponent={apiEnabled && !error && meta && debouncedQuery && debouncedQuery.length >= MIN_QUERY ? (
          page < (meta.last_page || 1)
            ? (
                (isLoading && page > 1) || cooling
                  ? <View style={{ paddingVertical: 12 }}><ActivityIndicator color={palette.primary} /></View>
                  : (
                    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => setPage(p => p + 1)} disabled={cooling} style={[t.btn, { paddingHorizontal: 16, paddingVertical: 8, opacity: cooling ? 0.6 : 1 }]}>
                        <Text style={t.btnText}>Load more</Text>
                      </TouchableOpacity>
                    </View>
                  )
              )
            : null
        ) : null}
      />
      <View style={{ marginTop: 8, paddingHorizontal: 12 }}>
        <Text style={[t.small, { color: palette.textMuted }]}>Source: Perenual API • Showing {data.length} item{data.length === 1 ? '' : 's'}{meta ? ` • Page ${meta.current_page}/${meta.last_page}` : ''}</Text>
      </View>

      {/* Details Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: palette.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={t.h3}>{selected?.mode === 'api' ? (selected.item.common_name || selected.item.scientific_name?.[0] || 'Details') : (selected?.mode === 'local' ? selected.item.name : 'Details')}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={[t.btn, { paddingHorizontal: 12, paddingVertical: 6 }]}>
                <Text style={t.btnText}>Close</Text>
              </TouchableOpacity>
            </View>

            {selected?.mode === 'api' ? (
              <View style={{ flex: 1 }}>
                {/* Keep content visible, overlay spinner while loading */}
                {isDetailLoading && (
                  <View style={{ position: 'absolute', top: 8, right: 16, zIndex: 2 }}>
                    <ActivityIndicator color={palette.primary} />
                  </View>
                )}
                {detailError && (
                  <Text style={{ color: palette.text, marginTop: 12 }}>Error: {detailError}</Text>
                )}
                {
                  <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
                    {/* Image fallback chain: details -> item regular -> item small -> item thumbnail */}
                    {selected?.details?.default_image?.regular_url ? (
                      <Image source={{ uri: selected.details.default_image.regular_url }} style={{ width: '100%', height: 200, borderRadius: 10 }} />
                    ) : selected?.item?.default_image?.regular_url ? (
                      <Image source={{ uri: selected.item.default_image.regular_url }} style={{ width: '100%', height: 200, borderRadius: 10 }} />
                    ) : selected?.item?.default_image?.small_url ? (
                      <Image source={{ uri: selected.item.default_image.small_url }} style={{ width: '100%', height: 180, borderRadius: 10 }} />
                    ) : selected?.item?.default_image?.thumbnail ? (
                      <Image source={{ uri: selected.item.default_image.thumbnail }} style={{ width: '100%', height: 160, borderRadius: 10 }} />
                    ) : null}
                    <Text style={{ marginTop: 8 }}>
                      <Text style={{ fontWeight: '700' }}>Scientific: </Text>
                      {(selected?.details?.scientific_name?.[0] || selected?.item?.scientific_name?.[0] || 'Unknown')}
                    </Text>
                    {(selected?.details?.genus || selected?.details?.family || selected?.item?.genus || selected?.item?.family) ? (
                      <Text style={{ marginTop: 4 }}>
                        Genus/Family: <Text style={{ fontWeight: '700' }}>{selected?.details?.genus || selected?.item?.genus || '–'}</Text> / <Text style={{ fontWeight: '700' }}>{selected?.details?.family || selected?.item?.family || '–'}</Text>
                      </Text>
                    ) : null}

                    {/* Key facts grid */}
                    <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                      {selected?.details?.cycle ? (
                        <View style={{ width: '50%', paddingVertical: 4 }}>
                          <Text>Cycle: <Text style={{ fontWeight: '700', textTransform: 'capitalize' }}>{String(selected.details.cycle).replace(/_/g, ' ')}</Text></Text>
                        </View>
                      ) : null}
                      {selected?.details?.watering ? (
                        <View style={{ width: '50%', paddingVertical: 4 }}>
                          <Text>Watering: <Text style={{ fontWeight: '700', textTransform: 'capitalize' }}>{selected.details.watering.replace(/_/g, ' ')}</Text></Text>
                        </View>
                      ) : null}
                      {selected?.details?.sunlight?.length ? (
                        <View style={{ width: '50%', paddingVertical: 4 }}>
                          <Text>Sunlight: <Text style={{ fontWeight: '700' }}>{selected.details.sunlight.join(', ').replace(/_/g, ' ')}</Text></Text>
                        </View>
                      ) : null}
                      {selected?.details?.hardiness ? (
                        <View style={{ width: '50%', paddingVertical: 4 }}>
                          <Text>Hardiness: <Text style={{ fontWeight: '700' }}>Zones {selected.details.hardiness.min ?? '?'}–{selected.details.hardiness.max ?? '?'}</Text></Text>
                        </View>
                      ) : null}
                      {selected?.details?.growth_rate ? (
                        <View style={{ width: '50%', paddingVertical: 4 }}>
                          <Text>Growth rate: <Text style={{ fontWeight: '700', textTransform: 'capitalize' }}>{String(selected.details.growth_rate).replace(/_/g, ' ')}</Text></Text>
                        </View>
                      ) : null}
                      {selected?.details?.indoor !== undefined ? (
                        <View style={{ width: '50%', paddingVertical: 4 }}>
                          <Text>Indoor friendly: <Text style={{ fontWeight: '700' }}>{selected.details.indoor ? 'Yes' : 'No'}</Text></Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Attributes lists */}
                    {selected?.details?.soil?.length ? (
                      <Text style={{ marginTop: 8 }}>Soil: <Text style={{ fontWeight: '700' }}>{selected.details.soil.join(', ').replace(/_/g, ' ')}</Text></Text>
                    ) : null}
                    {selected?.details?.propagation?.length ? (
                      <Text style={{ marginTop: 4 }}>Propagation: <Text style={{ fontWeight: '700' }}>{selected.details.propagation.join(', ').replace(/_/g, ' ')}</Text></Text>
                    ) : null}
                    {selected?.details?.attracts?.length ? (
                      <Text style={{ marginTop: 4 }}>Attracts: <Text style={{ fontWeight: '700' }}>{selected.details.attracts.join(', ').replace(/_/g, ' ')}</Text></Text>
                    ) : null}
                    {selected?.details?.edible_part ? (
                      <Text style={{ marginTop: 4 }}>Edible parts: <Text style={{ fontWeight: '700' }}>{Array.isArray(selected.details.edible_part) ? selected.details.edible_part.join(', ') : String(selected.details.edible_part)}</Text></Text>
                    ) : null}
                    {selected?.details?.flowering_season ? (
                      <Text style={{ marginTop: 4 }}>Flowering season: <Text style={{ fontWeight: '700' }}>{Array.isArray(selected.details.flowering_season) ? selected.details.flowering_season.join(', ') : String(selected.details.flowering_season)}</Text></Text>
                    ) : null}

                    {/* Description */}
                    {selected?.details?.description ? (
                      <Text style={{ marginTop: 10 }}>{selected.details.description}</Text>
                    ) : null}

                    {/* Raw JSON toggle */}
                    <View style={{ marginTop: 12 }}>
                      <TouchableOpacity onPress={() => setSelected(prev => (prev && prev.mode === 'api' ? { ...prev, showRaw: !(prev as any).showRaw } as any : prev))}>
                        <Text style={[t.small, { color: palette.primary, fontWeight: '700' }]}>{(selected as any)?.showRaw ? 'Hide raw JSON' : 'Show raw JSON'}</Text>
                      </TouchableOpacity>
                      {(selected as any)?.showRaw ? (
                        <View style={{ marginTop: 8, backgroundColor: palette.background, borderRadius: 8, padding: 8, maxHeight: 220 }}>
                          <ScrollView>
                            <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' as any : undefined, fontSize: 12, color: palette.text }}>{JSON.stringify(selected.details ?? selected.item, null, 2)}</Text>
                          </ScrollView>
                        </View>
                      ) : null}
                    </View>
                  </ScrollView>
                }
              </View>
            ) : selected?.mode === 'local' ? (
              <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 48 }}>{selected.item.image}</Text>
                </View>
                <Text style={{ marginTop: 8 }}>Category: <Text style={{ fontWeight: '700' }}>{selected.item.category}</Text></Text>
                <Text style={{ marginTop: 4 }}>Start seeds indoor: <Text style={{ fontWeight: '700' }}>{selected.item.startSeedIndoor}</Text></Text>
                <Text>Transplant outdoors: <Text style={{ fontWeight: '700' }}>{selected.item.transplantOutdoor}</Text></Text>
                <Text>Direct sow outdoors: <Text style={{ fontWeight: '700' }}>{selected.item.startSeedOutdoor}</Text></Text>
                <Text>Harvest: <Text style={{ fontWeight: '700' }}>{selected.item.harvestDate}</Text></Text>
                <Text style={{ marginTop: 4 }}>Hardiness: <Text style={{ fontWeight: '700' }}>Zones {selected.item.minZone}–{selected.item.maxZone}</Text></Text>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
