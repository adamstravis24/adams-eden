// Plant Types - Matching mobile app structure
export type PlantType = 'vegetable' | 'flower' | 'herb' | 'ornamental' | 'fruit' | 'tree';

export interface Plant {
  id: string;
  name: string;
  commonName?: string;
  scientificName?: string;
  category: string;
  plantType?: PlantType;
  image: string; // Emoji or image URL
  thumbnail?: string;
  description?: string;
  
  // Growing information
  indoorOutdoor: string;
  minZone: number;
  maxZone: number;
  daysToHarvest?: number;
  
  // Planting windows
  startSeedIndoor?: string;
  transplantOutdoor?: string;
  directSeedOutdoor?: string;
  bloomSeason?: string;
  
  // Care requirements
  sunlight?: 'full' | 'partial' | 'shade';
  water?: 'low' | 'medium' | 'high';
  spacing?: number;
  soilType?: string[];
  soilPH?: { min: number; max: number };
}

// Garden Types
export interface Garden {
  id: number;
  name: string;
  bedType: string;
  rows: number;
  cols: number;
  grid: (Plant | null)[][];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

// Garden Template
export interface GardenTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  rows: number;
  cols: number;
  layout: string[][]; // Plant names at each position
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  estimatedCost?: number;
  tags?: string[];
}

// Tracked Plant (for mobile app sync)
export interface TrackedPlant extends Plant {
  trackingId: string;
  plantedDate: string | null;
  plantedConfirmed: boolean;
  lastWateredDate: string | null;
  wateringFrequency?: number; // days
  notes?: string;
  harvestDate?: string | null;
}

// User Profile
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  location?: {
    zipCode?: string;
    hardyZone?: number;
    state?: string;
    country?: string;
  };
  gardens: Garden[];
  trackedPlants: TrackedPlant[];
  createdAt: string;
  lastLoginAt?: string;
}

// E-commerce Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  category: 'seeds' | 'plants' | 'soil' | 'tools' | 'beds' | 'irrigation' | 'other';
  images: string[];
  inStock: boolean;
  stockCount?: number;
  sku: string;
  tags?: string[];
  
  // Plant product specific
  plantId?: string; // Links to Plant database
  variety?: string;
  organic?: boolean;
  hardinessZones?: number[];
  quantity?: string; // e.g., "50 seeds", "1 plant"
  
  // Ratings
  rating?: number;
  reviewCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShoppingCart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}
