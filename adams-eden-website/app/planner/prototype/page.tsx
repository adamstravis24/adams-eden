'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  Sparkles,
  Layers,
  Ruler,
  Leaf,
  Fence,
  Waves,
  Droplets,
  Lightbulb,
  Flower2,
  SunMedium,
  Compass
} from 'lucide-react'
import PremiumFeatureWrapper from '@/components/PremiumFeatureWrapper'

type LayerKey = 'beds' | 'structures' | 'water' | 'wellness' | 'lighting'

interface LayerMeta {
  label: string
  description: string
  icon: ReactNode
  gradient: string
  glow: string
}

interface LayoutItem {
  id: string
  name: string
  layer: LayerKey
  summary: string
  headlineMetric: string
  coordinates: {
    column: number
    row: number
    width: number
    height: number
  }
  accentGradient: string
  borderClass: string
  emoji: string
  callouts: string[]
  zIndex?: number
}

interface MetricCard {
  label: string
  value: string
  detail: string
}

interface PaletteCard {
  title: string
  swatch: string
  description: string
  pairing: string
}

const LAYER_META: Record<LayerKey, LayerMeta> = {
  beds: {
    label: 'Productive Beds',
    description: 'Floating biochar planters with climate-responsive irrigation',
    icon: <Leaf className="h-4 w-4" />,
    gradient: 'from-emerald-500/85 via-emerald-400/65 to-emerald-300/35',
    glow: 'shadow-[0_32px_80px_-24px_rgba(16,122,52,0.55)]'
  },
  structures: {
    label: 'Structures & Trellising',
    description: 'Cantilevered carbon lattice and ultra-light trellis spines',
    icon: <Fence className="h-4 w-4" />,
    gradient: 'from-slate-900/90 via-slate-800/55 to-slate-700/25',
    glow: 'shadow-[0_32px_90px_-28px_rgba(15,23,42,0.55)]'
  },
  water: {
    label: 'Hydrology',
    description: 'Levitation fountains and kinetic rills with greywater loops',
    icon: <Waves className="h-4 w-4" />,
    gradient: 'from-cyan-400/80 via-sky-300/60 to-cyan-200/30',
    glow: 'shadow-[0_32px_90px_-28px_rgba(18,113,219,0.55)]'
  },
  wellness: {
    label: 'Wellness & Lounge',
    description: 'Biophilic lounges with radiant decks and aroma misting',
    icon: <Flower2 className="h-4 w-4" />,
    gradient: 'from-pink-400/80 via-rose-300/60 to-orange-200/30',
    glow: 'shadow-[0_32px_90px_-28px_rgba(236,72,153,0.45)]'
  },
  lighting: {
    label: 'Illumination',
    description: 'Solar threads, ambient uplighting, and pathway beacons',
    icon: <Lightbulb className="h-4 w-4" />,
    gradient: 'from-amber-400/85 via-yellow-300/55 to-emerald-200/25',
    glow: 'shadow-[0_32px_90px_-28px_rgba(234,179,8,0.45)]'
  }
}

const LAYOUT_ITEMS: LayoutItem[] = [
  {
    id: 'north-canopy-bed',
    name: 'North Canopy Bed',
    layer: 'beds',
    summary: 'Pollinator-forward planting with staggered LED soil mesh.',
    headlineMetric: '42 sq ft carbon-neutral soil matrix',
    coordinates: { column: 2, row: 2, width: 3, height: 3 },
    accentGradient: 'bg-gradient-to-br from-emerald-500/90 via-emerald-400/60 to-emerald-200/30',
    borderClass: 'border-emerald-200/60',
    emoji: '🌺',
    callouts: ['Self-leveling aerated substrate', 'Integrated micro-drip grid', 'AI-guided bloom staggering']
  },
  {
    id: 'west-edible-bed',
    name: 'West Edible Runway',
    layer: 'beds',
    summary: 'Chef-grade herbs with responsive nutrition dosing.',
    headlineMetric: '18 varietals w/ seasonal auto-rotation',
    coordinates: { column: 6, row: 2, width: 3, height: 3 },
    accentGradient: 'bg-gradient-to-br from-emerald-400/90 via-lime-300/60 to-emerald-200/30',
    borderClass: 'border-lime-200/70',
    emoji: '🥬',
    callouts: ['Dynamic LED grow rail', 'Scent-guided harvesting rail', 'Nitrogen mapping via nano-sensors']
  },
  {
    id: 'south-floating-bed',
    name: 'Floating Culinary Terrace',
    layer: 'beds',
    summary: 'Suspended bed for quick harvest greens & edible blooms.',
    headlineMetric: 'Adaptive trellis track along perimeter',
    coordinates: { column: 3, row: 6, width: 5, height: 2 },
    accentGradient: 'bg-gradient-to-br from-emerald-500/80 via-emerald-400/55 to-emerald-200/25',
    borderClass: 'border-emerald-300/60',
    emoji: '🪴',
    callouts: ['Floating basalt pavers', 'Smart substrate warming', 'Harvest-ready lighting cues']
  },
  {
    id: 'east-spiral-trellis',
    name: 'Spiral Trellis Spine',
    layer: 'structures',
    summary: 'Parametric trellis with kinetic shading ribbons.',
    headlineMetric: '12ft helical carbon lattice',
    coordinates: { column: 9, row: 3, width: 3, height: 4 },
    accentGradient: 'bg-gradient-to-br from-slate-900/85 via-slate-800/55 to-slate-700/25',
    borderClass: 'border-slate-500/60',
    emoji: '🌀',
    callouts: ['Dynamic vine guidance', 'Automated seasonal tensioning', 'Filtered daylight diffusion']
  },
  {
    id: 'central-promenade',
    name: 'Central Trellis Promenade',
    layer: 'structures',
    summary: 'Cantilevered path with perforated aluminum canopy.',
    headlineMetric: '8ft axial promenade with radiant heat',
    coordinates: { column: 2, row: 1, width: 8, height: 1 },
    accentGradient: 'bg-gradient-to-r from-slate-900/80 via-slate-700/45 to-slate-600/25',
    borderClass: 'border-slate-400/50',
    emoji: '╌',
    callouts: ['Recessed guide lighting', 'Smart glass canopy', 'Adaptive privacy weave']
  },
  {
    id: 'perimeter-fence-west',
    name: 'West Perimeter Fencing',
    layer: 'structures',
    summary: 'Matte basalt composite with integrated grow pockets.',
    headlineMetric: '18 linear ft privacy band',
    coordinates: { column: 1, row: 1, width: 1, height: 9 },
    accentGradient: 'bg-gradient-to-b from-slate-900/75 via-emerald-900/30 to-slate-800/20',
    borderClass: 'border-slate-500/40',
    emoji: '🧱',
    callouts: ['Photovoltaic mesh', 'Sound dampening core', 'Night-glow edge lighting'],
    zIndex: 2
  },
  {
    id: 'perimeter-fence-east',
    name: 'East Perimeter Fencing',
    layer: 'structures',
    summary: 'Perforated titanium veil with moss integration.',
    headlineMetric: '18 linear ft luminous screen',
    coordinates: { column: 12, row: 1, width: 1, height: 9 },
    accentGradient: 'bg-gradient-to-b from-slate-900/75 via-slate-700/35 to-slate-600/15',
    borderClass: 'border-slate-400/45',
    emoji: '🛡️',
    callouts: ['Mist-integrated cooling', 'Quantum dot light refraction', 'Biophilic acoustic buffering'],
    zIndex: 2
  },
  {
    id: 'levitation-fountain',
    name: 'Levitation Fountain',
    layer: 'water',
    summary: 'Mag-lev basin with reflective halo and mist projection.',
    headlineMetric: 'Recycles 32L greywater / hr',
    coordinates: { column: 6, row: 5, width: 2, height: 2 },
    accentGradient: 'bg-gradient-to-br from-cyan-400/90 via-sky-300/60 to-cyan-200/30',
    borderClass: 'border-cyan-200/60',
    emoji: '💧',
    callouts: ['Water levitation halo', 'Programmable mist choreography', 'Cooling microclimate buffer']
  },
  {
    id: 'mirror-water-rill',
    name: 'Mirror Rill',
    layer: 'water',
    summary: 'Ultra-thin reflecting channel with koi kinetic sensors.',
    headlineMetric: 'Biophilic index +18%',
    coordinates: { column: 9, row: 6, width: 3, height: 2 },
    accentGradient: 'bg-gradient-to-br from-sky-400/85 via-cyan-300/55 to-sky-200/25',
    borderClass: 'border-sky-200/60',
    emoji: '🌊',
    callouts: ['Programmable ripples', 'Water purity telemetry', 'Underlit basalt ridge']
  },
  {
    id: 'mist-oasis',
    name: 'Mist Oasis',
    layer: 'water',
    summary: 'Aroma-infused atomizer for tropical microclimates.',
    headlineMetric: '4 stage aromatic loops',
    coordinates: { column: 4, row: 1, width: 2, height: 2 },
    accentGradient: 'bg-gradient-to-br from-cyan-300/85 via-emerald-200/50 to-sky-200/25',
    borderClass: 'border-cyan-200/55',
    emoji: '🫧',
    callouts: ['Humidity balancer', 'Essential oil diffusion', 'Sunrise mist scripting']
  },
  {
    id: 'wellness-lounge',
    name: 'Wellness Lounge Deck',
    layer: 'wellness',
    summary: 'Timber-slat platform with sunken lounge modules.',
    headlineMetric: 'Heated ceramic weave seating',
    coordinates: { column: 10, row: 1, width: 2, height: 3 },
    accentGradient: 'bg-gradient-to-br from-rose-400/80 via-pink-300/60 to-orange-200/25',
    borderClass: 'border-rose-200/60',
    emoji: '🛋️',
    callouts: ['Neuro-light therapy', 'Aromatic thermal vents', 'Acoustic canopy']
  },
  {
    id: 'cocoon-nest',
    name: 'Cocoon Nest',
    layer: 'wellness',
    summary: 'Suspended daybed with sound bath integration.',
    headlineMetric: 'Hovering at 28 inches',
    coordinates: { column: 10, row: 5, width: 2, height: 3 },
    accentGradient: 'bg-gradient-to-br from-orange-400/75 via-pink-300/55 to-rose-200/25',
    borderClass: 'border-orange-200/60',
    emoji: '🪷',
    callouts: ['Resonant sound therapy', 'Breathwork guidance', 'Ambient chroma lighting']
  },
  {
    id: 'light-spine',
    name: 'Luminous Spine',
    layer: 'lighting',
    summary: 'Embedded fiber optics guiding visitors through beds.',
    headlineMetric: '270° adaptive lumen arc',
    coordinates: { column: 2, row: 4, width: 8, height: 1 },
    accentGradient: 'bg-gradient-to-r from-amber-400/85 via-yellow-300/60 to-emerald-200/30',
    borderClass: 'border-amber-200/60',
    emoji: '✨',
    callouts: ['Circadian-tuned lighting', 'Motion-reactive glow', 'Emergency path sequencing']
  },
  {
    id: 'sentinel-uplights',
    name: 'Sentinel Uplights',
    layer: 'lighting',
    summary: 'Programmatic uplights accenting trellis architecture.',
    headlineMetric: '12 individually addressable towers',
    coordinates: { column: 8, row: 1, width: 1, height: 2 },
    accentGradient: 'bg-gradient-to-b from-amber-400/85 via-emerald-300/50 to-emerald-200/25',
    borderClass: 'border-amber-200/55',
    emoji: '🔆',
    callouts: ['Solar pairing', 'Weather reactive dimming', 'Sculptural shadow play']
  }
]

const METRICS: MetricCard[] = [
  {
    label: 'Modular Bays',
    value: '12 zones',
    detail: 'Individually sensored micro-climates with auto-balancing'
  },
  {
    label: 'Water Reuse',
    value: '92%',
    detail: 'Closed-loop hydrology with UV sterilisation + bio-char polishing'
  },
  {
    label: 'Nighttime Mood',
    value: 'RGBA 2.1',
    detail: 'Scene presets for stargazing, dining, and dawn cultivation'
  },
  {
    label: 'Material Circularity',
    value: '87%',
    detail: 'FSC timber, recycled titanium mesh, basalt composite cladding'
  }
]

const PALETTE: PaletteCard[] = [
  {
    title: 'Ceramic Mist Paver',
    swatch: 'bg-gradient-to-br from-slate-100 via-white to-slate-200',
    description: 'Porous ceramic macro-tile that keeps surfaces cool underfoot.',
    pairing: 'Pairs with matte black titanium edge bands.'
  },
  {
    title: 'Basalt Composite Fence',
    swatch: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black',
    description: 'Multi-layer carbon basalt with integrated photovoltaic mesh.',
    pairing: 'Contrast with uplift moss modules.'
  },
  {
    title: 'Prismatic Water Tile',
    swatch: 'bg-gradient-to-br from-sky-200 via-cyan-300 to-emerald-200',
    description: 'Low-profile glass tile that refracts fountain lighting.',
    pairing: 'Highlights levitation basin and mist features.'
  },
  {
    title: 'Aromatic Timber Slat',
    swatch: 'bg-gradient-to-br from-amber-200 via-amber-300 to-orange-200',
    description: 'Thermally treated cedar with micro-perfume reservoirs.',
    pairing: 'Creates warm balance across lounge decks.'
  }
]

const FUTURE_SCENES = [
  {
    title: 'Aurora Dining',
    description: 'Soft luminance with synchronized fountain choreography for twilight dining experiences.',
    icon: <SunMedium className="h-5 w-5 text-amber-400" />
  },
  {
    title: 'Botanical Lab',
    description: 'Switch to research mode with nutrient analytics, sampling trays, and robot-ready track lines.',
    icon: <Layers className="h-5 w-5 text-emerald-400" />
  },
  {
    title: 'Solstice Wellness',
    description: 'Guided breathwork with aroma mist, sound bath sequences, and temperature-tuned seating.',
    icon: <Flower2 className="h-5 w-5 text-rose-400" />
  }
]

export default function PlannerPrototypePage() {
  const [activeLayers, setActiveLayers] = useState<LayerKey[]>(['beds', 'structures', 'water', 'wellness', 'lighting'])
  const [selectedItemId, setSelectedItemId] = useState<string>(LAYOUT_ITEMS[0]?.id ?? '')

  const displayedItems = useMemo(
    () => LAYOUT_ITEMS.filter(item => activeLayers.includes(item.layer)),
    [activeLayers]
  )

  useEffect(() => {
    if (!displayedItems.some(item => item.id === selectedItemId)) {
      setSelectedItemId(displayedItems[0]?.id ?? '')
    }
  }, [displayedItems, selectedItemId])

  const selectedItem = useMemo(
    () => displayedItems.find(item => item.id === selectedItemId) ?? LAYOUT_ITEMS.find(item => item.id === selectedItemId) ?? null,
    [displayedItems, selectedItemId]
  )

  const toggleLayer = (layer: LayerKey) => {
    setActiveLayers(prev => {
      if (prev.includes(layer)) {
        const next = prev.filter(item => item !== layer)
        return next.length > 0 ? next : prev
      }
      return [...prev, layer]
    })
  }

  return (
    <PremiumFeatureWrapper featureName="Planner Prototype">
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/70 text-slate-100 pb-24">
        <span className="pointer-events-none absolute -top-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/30 blur-[180px]" />
        <span className="pointer-events-none absolute top-10 right-[-10rem] h-[24rem] w-[24rem] rounded-full bg-sky-500/25 blur-[160px]" />
        <span className="pointer-events-none absolute bottom-[-12rem] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-rose-500/20 blur-[200px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="pt-16">
            <div className="glass-panel bg-white/10 border-white/20 px-8 py-10 sm:px-12 sm:py-14 text-slate-100">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
                <div className="max-w-2xl space-y-6">
                  <span className="glass-pill bg-white/15 border-white/20 text-xs text-white uppercase tracking-[0.35em]">
                    Ultra Modern Prototype
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-200 to-rose-200">Future Garden</span>{' '}
                    planner for immersive landscapes
                  </h1>
                  <p className="text-lg sm:text-xl text-slate-200/80 leading-relaxed">
                    Explore a concept garden that fuses smart horticulture, architectural trellising, climate-responsive water features,
                    and biophilic lounges—rendered in a cinematic spatial UI ready for client walk-throughs.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                      Sentient planting intelligence
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                      <Layers className="h-4 w-4 text-cyan-200" />
                      Multi-layer structural mapping
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                      <Ruler className="h-4 w-4 text-rose-200" />
                      Precision-scaled blueprinting
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -top-8 -right-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
                  <div className="relative glass-card bg-slate-900/70 border border-white/10 p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Compass className="h-5 w-5 text-emerald-200" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Scenario</p>
                          <p className="text-lg font-semibold">Aurora Courtyard</p>
                        </div>
                      </div>
                      <span className="glass-pill bg-emerald-500/20 border-emerald-200/40 text-emerald-100 px-4 py-1">
                        Concept v2.1
                      </span>
                    </div>
                    <div className="mt-6 space-y-4 text-sm text-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span>Dynamic layers active</span>
                        <span className="font-semibold text-white">{activeLayers.length} / 5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sensor hand-offs</span>
                        <span className="font-semibold text-emerald-200">Realtime</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Experience presets</span>
                        <span className="font-semibold text-emerald-200">3 Scenes</span>
                      </div>
                    </div>
                    <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-400/20 via-cyan-300/20 to-rose-300/20 px-4 py-3 text-xs uppercase tracking-[0.3em] text-white/80">
                      Spatial planning canvas • 36ft × 24ft
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Layer Controls */}
          <section className="mt-14">
            <div className="grid gap-4 md:grid-cols-[1.5fr_2fr]">
              <div className="glass-panel bg-white/5 border-white/15 p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white mb-2">Layer orchestration</h2>
                <p className="text-sm text-slate-200/75 mb-6">
                  Toggle design layers to explore structural, botanical, hydrological, and mood-driven compositions.
                </p>
                <div className="space-y-3">
                  {(Object.keys(LAYER_META) as LayerKey[]).map(key => {
                    const meta = LAYER_META[key]
                    const isActive = activeLayers.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleLayer(key)}
                        className={clsx(
                          'w-full rounded-2xl border px-4 py-4 text-left transition backdrop-blur-md flex items-center justify-between gap-4',
                          isActive
                            ? 'border-white/40 bg-white/12 shadow-[0_22px_60px_-30px_rgba(255,255,255,0.45)]'
                            : 'border-white/15 bg-white/4 hover:bg-white/8'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={clsx(
                              'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-slate-900',
                              meta.gradient
                            )}
                          >
                            {meta.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{meta.label}</p>
                            <p className="text-xs text-slate-200/75">{meta.description}</p>
                          </div>
                        </div>
                        <span className={clsx('text-xs font-semibold uppercase tracking-[0.3em]', isActive ? 'text-emerald-200' : 'text-slate-200/50')}>
                          {isActive ? 'Active' : 'Off'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="glass-panel bg-white/5 border-white/15 p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-white mb-4">Performance metrics</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {METRICS.map(metric => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-lg"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                      <p className="mt-3 text-sm text-slate-200/75 leading-relaxed">{metric.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Spatial Canvas */}
          <section className="mt-16">
            <div className="glass-panel bg-white/8 border-white/15 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Spatial layout</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Immersive plan overview</h2>
                    </div>
                    <span className="glass-pill bg-white/10 border-white/15 text-emerald-100 px-4 py-1.5">
                      {displayedItems.length} elements visible
                    </span>
                  </div>

                  <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-2xl">
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_60%)]" />
                    <div className="relative z-10">
                      <div
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                          gridTemplateRows: 'repeat(9, minmax(0, 1fr))'
                        }}
                      >
                        {displayedItems
                          .slice()
                          .sort((a, b) => (a.zIndex ?? 5) - (b.zIndex ?? 5))
                          .map(item => (
                            <button
                              key={item.id}
                              onClick={() => setSelectedItemId(item.id)}
                              className={clsx(
                                'relative flex flex-col justify-between rounded-3xl border px-4 py-4 text-left transition-all duration-300',
                                item.accentGradient,
                                item.borderClass,
                                LAYER_META[item.layer].glow,
                                selectedItemId === item.id
                                  ? 'ring-2 ring-white/70 scale-[1.02]'
                                  : 'ring-1 ring-white/20 hover:ring-white/40 hover:scale-[1.01]'
                              )}
                              style={{
                                gridColumn: `${item.coordinates.column} / span ${item.coordinates.width}`,
                                gridRow: `${item.coordinates.row} / span ${item.coordinates.height}`,
                                zIndex: item.zIndex ?? 5
                              }}
                            >
                              <div className="flex items-start justify-between text-white">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                  <span>{item.emoji}</span>
                                  <span>{item.name}</span>
                                </div>
                                <span className="text-xs uppercase tracking-[0.3em] text-white/70">
                                  {LAYER_META[item.layer].label}
                                </span>
                              </div>
                              <p className="mt-3 text-xs text-white/85 leading-relaxed">{item.summary}</p>
                              <div className="mt-4 flex items-center justify-between text-[0.7rem] text-white/75">
                                <span>{item.headlineMetric}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                                  <Droplets className="h-3 w-3" />
                                  Smart flow
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-white/10" />
                    <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>

                <div className="lg:w-1/3 space-y-6">
                  <div className="rounded-[28px] border border-white/15 bg-white/6 p-6 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Element detail</p>
                    {selectedItem ? (
                      <>
                        <div className="mt-4 flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                            {selectedItem.emoji}
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-white">{selectedItem.name}</h3>
                            <p className="text-xs text-slate-200/70">
                              {LAYER_META[selectedItem.layer].label}
                            </p>
                          </div>
                        </div>
                        <p className="mt-5 text-sm text-slate-200/80 leading-relaxed">{selectedItem.summary}</p>
                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/12 px-4 py-3 text-xs uppercase tracking-[0.3em] text-emerald-100">
                          {selectedItem.headlineMetric}
                        </div>
                        <div className="mt-6 space-y-3">
                          {selectedItem.callouts.map(callout => (
                            <div
                              key={callout}
                              className="rounded-xl border border-white/10 bg-white/8 px-3 py-3 text-xs text-slate-200/80"
                            >
                              {callout}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-6 text-sm text-slate-200/70">
                        Activate a layer to inspect spatial elements in detail.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-white/15 bg-white/6 p-6 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Mood presets</p>
                    <div className="mt-5 space-y-4">
                      {FUTURE_SCENES.map(scene => (
                        <div key={scene.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                            {scene.icon}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{scene.title}</p>
                            <p className="text-xs text-slate-200/75 leading-relaxed">{scene.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Material Palette */}
          <section className="mt-16">
            <div className="glass-panel bg-white/6 border-white/12 px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Material palette</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Tactile ecosystem</h2>
                  <p className="mt-3 text-sm text-slate-200/75 max-w-2xl">
                    Ultra-modern materials and finishes curated to balance carbon-smart infrastructure with sensory delight.
                  </p>
                </div>
                <span className="glass-pill bg-white/12 border-white/20 text-emerald-100 px-4 py-1.5">
                  Recyclability index 87%
                </span>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {PALETTE.map(card => (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl space-y-4"
                  >
                    <div className={clsx('h-28 w-full rounded-2xl border border-white/15', card.swatch)} />
                    <div>
                      <p className="text-sm font-semibold text-white">{card.title}</p>
                      <p className="mt-2 text-xs text-slate-200/75 leading-relaxed">{card.description}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-3 text-xs text-emerald-100/80">
                      {card.pairing}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PremiumFeatureWrapper>
  )
}
