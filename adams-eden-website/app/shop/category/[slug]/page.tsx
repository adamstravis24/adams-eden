import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

import { getAllProducts, ShopifyProduct } from "@/lib/shopify";
import { ProductList } from "@/components/shop/ProductList";
import { ScrollToSection } from "@/components/shop/ScrollToSection";

type CategoryInfo = {
  name: string;
  description: string;
  keywords: string[];
  excludeKeywords?: string[];
  icon: string;
};

export const revalidate = 300; // Revalidate every 5 minutes

const CATEGORIES: Record<string, CategoryInfo> = {
  "flowers": {
    name: "Flowers",
    description: "Beautiful blooms for your garden",
    keywords: ["flower", "bloom", "blossom", "petal", "perennial", "annual", "ornamental", "seed", "seeds", "marigold", "zinnia", "sunflower", "daisy", "rose", "tulip", "daffodil", "lily", "iris", "peony", "hydrangea", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon", "delphinium", "larkspur", "aster", "chrysanthemum", "dianthus", "carnation"],
    excludeKeywords: ["vegetable", "herb", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "garden bed", "raised bed", "broadleaf sage", "extrakta sage", "italian parsley", "kitchen sage", "rosemary", "tatsoi", "mustard", "triple curled parsley", "white sage"],
    icon: "🌸",
  },
  "flowers-perennials": {
    name: "Flowers - Perennials",
    description: "Flowers that return year after year",
    keywords: ["flower", "bloom", "blossom", "petal", "perennial", "ornamental", "seed", "seeds", "rose", "peony", "hydrangea", "iris", "lily", "daffodil", "tulip", "hosta", "daylily", "coneflower", "echinacea", "black-eyed susan", "rudbeckia", "salvia", "lavender", "sedum", "astilbe", "coral bells", "heuchera", "bleeding heart", "dicentra", "phlox", "delphinium", "larkspur", "dianthus", "carnation"],
    excludeKeywords: ["annual", "vegetable", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "garden bed", "raised bed", "broadleaf sage", "extrakta sage", "italian parsley", "kitchen sage", "rosemary", "tatsoi", "mustard", "triple curled parsley", "white sage"],
    icon: "🌺",
  },
  "flowers-annuals": {
    name: "Flowers - Annuals",
    description: "Bright annual flowers for seasonal color",
    keywords: ["flower", "bloom", "blossom", "petal", "annual", "ornamental", "seed", "seeds", "marigold", "zinnia", "sunflower", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon", "impatiens", "begonia", "geranium", "coleus", "sweet alyssum", "lobelia", "verbena", "portulaca", "moss rose"],
    excludeKeywords: ["perennial", "vegetable", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "garden bed", "raised bed", "broadleaf sage", "extrakta sage", "italian parsley", "kitchen sage", "rosemary", "tatsoi", "mustard", "triple curled parsley", "white sage"],
    icon: "🌻",
  },
  "vegetables": {
    name: "Vegetables",
    description: "Fresh vegetables for your kitchen garden",
    keywords: ["vegetable", "veggie", "seed", "seeds", "tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "pepper", "bell pepper", "jalapeño", "habanero", "okra", "brussels sprout", "cauliflower", "asparagus", "artichoke", "leek", "shallot", "celery", "parsnip", "rutabaga", "kohlrabi", "swiss chard", "collard", "mustard green", "bok choy", "pak choi", "banana pepper", "mung bean", "mustard", "pimento", "royal burgundy", "winter wheat", "purslane", "miner's lettuce"],
    excludeKeywords: ["houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "garden bed", "raised bed", "gift", "gift card", "gift wrap", "herb", "culinary", "aromatic", "spice", "basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", "dill", "chive", "tarragon", "marjoram", "chervil", "fennel", "lavender", "lemongrass", "lemon balm", "stevia", "chamomile", "echinacea", "medicinal", "alaska mix nasturtium", "american wild licorice", "american wisteria", "wisteria", "apricot peach strawflower", "strawflower", "astragalus", "birdhouse bottle gourd", "bottle gourd", "licorice"],
    icon: "🥕",
  },
  "herbs": {
    name: "Herbs",
    description: "Fresh culinary herbs and aromatic plants",
    keywords: ["herb", "culinary", "aromatic", "spice", "seed", "seeds", "basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", "dill", "chive", "tarragon", "marjoram", "chervil", "fennel", "lavender", "lemongrass", "lemon balm", "stevia", "chamomile", "echinacea", "medicinal herb", "shiso", "cardamom", "bee balm", "anise hyssop"],
    excludeKeywords: ["vegetable", "houseplant", "indoor", "succulent", "cactus", "diatomaceous earth", "diatomaceous", "light", "lamp", "soil", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "garden bed", "raised bed"],
    icon: "🌿",
  },
  "houseplants": {
    name: "Houseplants",
    description: "Beautiful indoor plants to brighten any space",
    keywords: ["houseplant", "indoor plant", "interior plant", "foliage", "pothos", "philodendron", "monstera", "snake plant", "sansevieria", "spider plant", "peace lily", "fiddle leaf", "rubber tree", "zz plant", "zamioculcas", "dieffenbachia", "dumb cane", "calathea", "prayer plant", "maranta", "alocasia", "elephant ear", "anthurium", "begonia", "fern", "boston fern", "maidenhair", "ivy", "english ivy"],
    excludeKeywords: ["light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    icon: "🪴",
  },
  "succulents-cacti": {
    name: "Succulents & Cacti",
    description: "Low-maintenance desert beauties",
    keywords: ["succulent", "cactus", "cacti", "xerophyte", "desert", "arid", "echeveria", "aloe", "haworthia", "sedum", "crassula", "jade plant", "hens and chicks", "sempervivum", "agave", "yucca", "opuntia", "prickly pear", "barrel cactus", "christmas cactus", "thanksgiving cactus", "easter cactus", "schlumbergera", "lithops", "living stone"],
    excludeKeywords: ["bed", "beds", "garden bed", "raised bed"],
    icon: "🌵",
  },
  "gardening-supplies": {
    name: "Gardening Supplies",
    description: "Everything you need for successful gardening",
    keywords: ["tool", "supply", "equipment", "pot", "planter", "tray", "container", "pruner", "scissors", "bed", "beds", "garden bed", "raised bed", "hydroponic", "hydro", "fertilizer", "nutrient", "soil", "potting mix", "spray", "care", "treatment", "pest", "disease", "fungicide", "insecticide", "watering can", "saucer", "dome", "tie", "station", "humidistat", "remote", "fabric pot", "square pot", "liquid", "bloom", "diatomaceous", "leaf care", "plant leaf"],
    excludeKeywords: ["seed", "seeds", "vegetable", "herb", "flower", "houseplant", "succulent", "cactus", "tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", "dill", "chive", "marigold", "zinnia", "sunflower", "daisy", "rose", "tulip", "daffodil", "lily", "iris", "peony", "hydrangea", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon"],
    icon: "🛠️",
  },
  "supplies-beds": {
    name: "Garden Beds & Containers",
    description: "Raised beds, containers, and growing systems",
    keywords: ["bed", "beds", "garden bed", "raised bed", "container", "planter", "pot", "grow bag"],
    excludeKeywords: ["hydroponic", "hydro", "fertilizer", "nutrient", "soil", "potting mix", "tool", "pruner", "scissors"],
    icon: "📦",
  },
  "supplies-hydroponic": {
    name: "Hydroponic Supplies",
    description: "Advanced soil-free growing systems and equipment",
    keywords: ["hydroponic", "hydro", "dwc", "nft", "aeroponic", "water culture", "nutrient solution", "grow system"],
    excludeKeywords: ["bed", "beds", "garden bed", "raised bed", "fertilizer", "soil", "potting mix"],
    icon: "💧",
  },
  "supplies-fertilizers": {
    name: "Fertilizers & Nutrients",
    description: "Premium fertilizers, nutrients, and soil amendments",
    keywords: ["fertilizer", "nutrient", "soil", "potting mix", "compost", "amendment", "peat", "coco", "organic"],
    excludeKeywords: ["bed", "beds", "garden bed", "raised bed", "hydroponic", "hydro", "tool", "pruner", "scissors"],
    icon: "🌱",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : params;
  const category = CATEGORIES[resolvedParams.slug];
  
  if (!category) {
    return {
      title: "Category Not Found | Adams Eden Shop",
    };
  }

  return {
    title: `${category.name} | Adams Eden Shop`,
    description: category.description,
  };
}

function filterProductsByCategory(
  products: ShopifyProduct[], 
  keywords: string[], 
  excludeKeywords?: string[]
): ShopifyProduct[] {
  return products.filter((product) => {
    const haystack = [
      product.title,
      product.description,
      product.productType,
      ...(product.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // For vegetables category specifically, check for vegetable names first
    const isVegetableCategory = keywords.includes("vegetable") || keywords.includes("veggie");
    if (isVegetableCategory) {
      // List of vegetable names to check (include both singular and plural forms)
      const vegetableNames = ["tomato", "tomatoes", "carrot", "carrots", "lettuce", "pepper", "peppers", "cucumber", "cucumbers", "squash", "bean", "beans", "pea", "peas", "corn", 
        "broccoli", "cabbage", "onion", "onions", "garlic", "potato", "potatoes", "spinach", "kale", "radish", "radishes",
        "beet", "beets", "turnip", "turnips", "eggplant", "zucchini", "okra", "brussels sprout", "cauliflower", 
        "asparagus", "artichoke", "artichokes", "leek", "leeks", "shallot", "shallots", "celery", "parsnip", "parsnips", "rutabaga", 
        "kohlrabi", "swiss chard", "collard", "mustard green", "bok choy", "pak choi",
        "banana pepper", "mung bean", "mustard", "pimento", "royal burgundy", "winter wheat",
        "purslane", "miner's lettuce", "delicata", "dragon", "nettle", "stinging nettle"];
      
      const hasVegetableName = vegetableNames.some(name => haystack.includes(name));
      
      // If it has a vegetable name, include it (unless it's clearly a supply product)
      if (hasVegetableName) {
        // Only exclude if it's clearly a supply product (use word boundaries to avoid false matches)
        // This prevents "pot" from excluding "potato" or "bed" from excluding products with "bed" in description
        const isClearSupply = haystack.includes(" supply ") || 
                             haystack.includes(" tool ") || 
                             haystack.includes(" equipment ") ||
                             haystack.includes(" fertilizer ") ||
                             haystack.includes(" planter ") ||
                             haystack.includes(" garden bed ") ||
                             haystack.includes(" raised bed ") ||
                             haystack.startsWith("supply ") ||
                             haystack.startsWith("tool ") ||
                             haystack.startsWith("equipment ") ||
                             haystack.startsWith("fertilizer ") ||
                             haystack.startsWith("planter ");
        
        if (isClearSupply) {
          return false;
        }
        
        // Include products with vegetable names (even if they mention herbs or other keywords in description)
        return true;
      }
    }

    // For flowers category specifically, check for flower names first
    const isFlowerCategory = keywords.includes("flower") || keywords.includes("bloom") || keywords.includes("blossom");
    if (isFlowerCategory) {
      // List of flower names to check (include both singular and plural forms)
      const flowerNames = ["marigold", "marigolds", "zinnia", "zinnias", "sunflower", "sunflowers", "daisy", "daisies", "rose", "roses", 
        "tulip", "tulips", "daffodil", "daffodils", "lily", "lilies", "iris", "peony", "peonies", "hydrangea", "hydrangeas", 
        "petunia", "petunias", "pansy", "pansies", "viola", "violas", "cosmos", "nasturtium", "nasturtiums", "calendula", 
        "snapdragon", "snapdragons", "delphinium", "delphiniums", "larkspur", "larkspurs", "aster", "asters", 
        "chrysanthemum", "chrysanthemums", "dianthus", "carnation", "carnations", "hosta", "hostas", "daylily", "daylilies", 
        "coneflower", "coneflowers", "echinacea", "black-eyed susan", "rudbeckia", "salvia", "sedum", "astilbe", 
        "coral bells", "heuchera", "bleeding heart", "dicentra", "phlox", "impatiens", "begonia", "begonias", 
        "geranium", "geraniums", "coleus", "sweet alyssum", "lobelia", "verbena", "portulaca", "moss rose",
        "alaska mix nasturtium", "american wild licorice", "american wisteria", "wisteria", "apricot peach strawflower", 
        "strawflower", "astragalus", "birdhouse bottle gourd", "bottle gourd", "licorice"];
      
      const hasFlowerName = flowerNames.some(name => haystack.includes(name));
      
      // If it has a flower name, include it (unless it's clearly a supply product)
      if (hasFlowerName) {
        const isClearSupply = haystack.includes(" supply ") || 
                             haystack.includes(" tool ") || 
                             haystack.includes(" equipment ") ||
                             haystack.includes(" fertilizer ") ||
                             haystack.includes(" planter ") ||
                             haystack.includes(" garden bed ") ||
                             haystack.includes(" raised bed ") ||
                             haystack.startsWith("supply ") ||
                             haystack.startsWith("tool ") ||
                             haystack.startsWith("equipment ") ||
                             haystack.startsWith("fertilizer ") ||
                             haystack.startsWith("planter ");
        
        if (isClearSupply) {
          return false;
        }
        
        // Include products with flower names
        return true;
      }
    }

    // For herbs category specifically, check for herb names first
    const isHerbCategory = keywords.includes("herb") || keywords.includes("culinary") || keywords.includes("aromatic");
    if (isHerbCategory) {
      // List of herb names to check (include both singular and plural forms)
      const herbNames = ["basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", 
        "dill", "chive", "chives", "tarragon", "marjoram", "chervil", "fennel", "lavender", "lemongrass", "lemon balm", 
        "stevia", "chamomile", "echinacea", "shiso", "cardamom", "bee balm", "anise hyssop", "broadleaf sage", 
        "extrakta sage", "italian parsley", "kitchen sage", "white sage", "triple curled parsley", "tatsoi", "mustard"];
      
      const hasHerbName = herbNames.some(name => haystack.includes(name));
      
      // If it has a herb name, include it (unless it's clearly a supply product)
      if (hasHerbName) {
        const isClearSupply = haystack.includes(" supply ") || 
                             haystack.includes(" tool ") || 
                             haystack.includes(" equipment ") ||
                             haystack.includes(" fertilizer ") ||
                             haystack.includes(" planter ") ||
                             haystack.includes(" garden bed ") ||
                             haystack.includes(" raised bed ") ||
                             haystack.startsWith("supply ") ||
                             haystack.startsWith("tool ") ||
                             haystack.startsWith("equipment ") ||
                             haystack.startsWith("fertilizer ") ||
                             haystack.startsWith("planter ");
        
        if (isClearSupply) {
          return false;
        }
        
        // Include products with herb names
        return true;
      }
    }

    // Check if product matches include keywords
    const matchesInclude = keywords.some((keyword) => 
      haystack.includes(keyword.toLowerCase())
    );

    // If it doesn't match include keywords, exclude it
    if (!matchesInclude) {
      return false;
    }

    // Check if product matches any exclude keywords
    const matchesExclude = excludeKeywords?.some((keyword) => 
      haystack.includes(keyword.toLowerCase())
    ) ?? false;
    
    // Exclude if it matches exclude keywords
    if (matchesExclude) {
      return false;
    }

    return true;
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ type?: string }> | { type?: string };
}) {
  // Handle params and searchParams as Promise (Next.js 15) or object (Next.js 14)
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  
  const category = CATEGORIES[resolvedParams.slug];

  if (!category) {
    notFound();
  }

  let allProducts: ShopifyProduct[] = [];
  try {
    allProducts = await getAllProducts();
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array if fetch fails
    allProducts = [];
  }
  
  let categoryProducts = filterProductsByCategory(
    allProducts, 
    category.keywords, 
    category.excludeKeywords
  );

  // Special handling for flowers - separate into annuals and perennials
  // Declare at function scope so they're available in JSX
  let flowerAnnuals: ShopifyProduct[] = [];
  let flowerPerennials: ShopifyProduct[] = [];
  
  if (resolvedParams.slug === "flowers") {
    categoryProducts.forEach((product) => {
      const haystack = [
        product.title,
        product.description,
        product.productType,
        ...(product.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      
      if (haystack.includes("annual") && !haystack.includes("perennial")) {
        flowerAnnuals.push(product);
      } else if (haystack.includes("perennial")) {
        flowerPerennials.push(product);
      } else {
        // If unclear, add to both
        flowerAnnuals.push(product);
        flowerPerennials.push(product);
      }
    });
    
    // Sort both A-Z
    flowerAnnuals = flowerAnnuals.sort((a, b) => a.title.localeCompare(b.title));
    flowerPerennials = flowerPerennials.sort((a, b) => a.title.localeCompare(b.title));
    
    // All flowers sorted A-Z
    categoryProducts = [...categoryProducts].sort((a, b) => a.title.localeCompare(b.title));
  }

  // Special handling for vegetables - group by type for filtering
  let vegetableGroups: Record<string, ShopifyProduct[]> | null = null;
  let vegetableTypes: string[] = [];
  if (resolvedParams.slug === "vegetables") {
    // Group vegetables by type (tomatoes together, carrots together, etc.)
    vegetableGroups = {};
    const other: ShopifyProduct[] = [];

    categoryProducts.forEach((product) => {
      const haystack = [
        product.title,
        product.description,
        product.productType,
        ...(product.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Try to match common vegetable types
      let matched = false;
      const types = ["tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "okra", "brussels sprout", "cauliflower", "asparagus", "artichoke", "leek", "shallot", "celery", "parsnip", "rutabaga", "kohlrabi", "swiss chard", "collard", "mustard green", "bok choy", "pak choi"];
      
      for (const type of types) {
        if (haystack.includes(type)) {
          if (!vegetableGroups![type]) {
            vegetableGroups![type] = [];
          }
          vegetableGroups![type].push(product);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        other.push(product);
      }
    });

    // Sort each group A-Z
    Object.keys(vegetableGroups).forEach((type) => {
      vegetableGroups![type] = vegetableGroups![type].sort((a, b) => a.title.localeCompare(b.title));
    });
    if (other.length > 0) {
      vegetableGroups["Other"] = other.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Get sorted list of types for navigation
    vegetableTypes = Object.keys(vegetableGroups).sort();

    // Filter by type if searchParams.type is provided
    if (resolvedSearchParams.type && resolvedSearchParams.type !== "all" && vegetableGroups[resolvedSearchParams.type]) {
      categoryProducts = vegetableGroups[resolvedSearchParams.type];
    } else {
      // Sort all products A-Z for display
      categoryProducts = [...categoryProducts].sort((a, b) => a.title.localeCompare(b.title));
    }
  } else if (resolvedParams.slug !== "flowers") {
    // Sort A-Z for categories that need it (herbs, houseplants, succulents)
    const sortCategories = ["herbs", "houseplants", "succulents-cacti"];
    if (sortCategories.includes(resolvedParams.slug)) {
      categoryProducts = [...categoryProducts].sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/shop" className="hover:text-primary-600">
              Shop
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-slate-900">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="text-7xl">{category.icon}</div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900">{category.name}</h1>
              <p className="mt-3 text-lg text-slate-600">{category.description}</p>
              <p className="mt-2 text-sm font-semibold text-primary-600">
                {categoryProducts.length} {categoryProducts.length === 1 ? "product" : "products"} available
              </p>
              
              {/* Subcategory Navigation for Flowers */}
              {resolvedParams.slug === "flowers" && (
                <div className="mt-6 flex gap-4">
                  <ScrollToSection
                    targetId="flowers-perennials"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    🌺 Perennials
                  </ScrollToSection>
                  <ScrollToSection
                    targetId="flowers-annuals"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    🌻 Annuals
                  </ScrollToSection>
                </div>
              )}
              
              {/* Subcategory Navigation for Vegetables */}
              {resolvedParams.slug === "vegetables" && vegetableTypes.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Filter by type:</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/shop/category/vegetables"
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition ${
                        !resolvedSearchParams.type || resolvedSearchParams.type === "all"
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-primary-300 bg-white text-primary-700 hover:bg-primary-50 hover:border-primary-400"
                      }`}
                    >
                      All Vegetables
                    </Link>
                    {vegetableTypes.map((type) => (
                      <Link
                        key={type}
                        href={`/shop/category/vegetables?type=${type}`}
                        className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition capitalize ${
                          resolvedSearchParams.type === type
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-primary-300 bg-white text-primary-700 hover:bg-primary-50 hover:border-primary-400"
                        }`}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Subcategory Navigation for Supplies */}
              {resolvedParams.slug === "gardening-supplies" && (
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    href="/shop/category/supplies-beds"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    📦 Garden Beds & Containers
                  </Link>
                  <Link
                    href="/shop/category/supplies-hydroponic"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    💧 Hydroponic Supplies
                  </Link>
                  <Link
                    href="/shop/category/supplies-fertilizers"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    🌱 Fertilizers & Nutrients
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {categoryProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <div className="mb-4 text-6xl">{category.icon}</div>
              <p className="text-lg font-semibold text-slate-900">
                No {category.name.toLowerCase()} in stock right now
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Check back soon or browse our other categories
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Back to Shop Home
              </Link>
            </div>
          ) : resolvedParams.slug === "flowers" ? (
            // Flowers page with sections for annuals and perennials
            <div className="space-y-12">
              {/* All Flowers Section */}
              <div>
                <h2 className="mb-6 text-2xl font-bold text-slate-900">All Flowers</h2>
                <ProductList products={categoryProducts} />
              </div>
              
              {/* Perennials Section */}
              {flowerPerennials.length > 0 && (
                <div id="flowers-perennials" className="scroll-mt-8">
                  <h2 className="mb-6 text-2xl font-bold text-slate-900">Perennials</h2>
                  <ProductList products={flowerPerennials} />
                </div>
              )}
              
              {/* Annuals Section */}
              {flowerAnnuals.length > 0 && (
                <div id="flowers-annuals" className="scroll-mt-8">
                  <h2 className="mb-6 text-2xl font-bold text-slate-900">Annuals</h2>
                  <ProductList products={flowerAnnuals} />
                </div>
              )}
            </div>
          ) : (
            <ProductList products={categoryProducts} />
          )}
        </div>
      </section>
    </div>
  );
}
