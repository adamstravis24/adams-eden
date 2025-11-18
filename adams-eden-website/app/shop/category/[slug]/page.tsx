import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

import { getAllProducts, ShopifyProduct } from "@/lib/shopify";
import { ProductGrid } from "@/components/shop/ProductGrid";

type CategoryInfo = {
  name: string;
  description: string;
  keywords: string[];
  excludeKeywords?: string[];
  icon: string;
};

export const dynamic = "force-dynamic";

const CATEGORIES: Record<string, CategoryInfo> = {
  "flowers": {
    name: "Flowers",
    description: "Beautiful blooms for your garden",
    keywords: ["flower", "bloom", "blossom", "petal", "perennial", "annual", "ornamental", "seed", "seeds", "marigold", "zinnia", "sunflower", "daisy", "rose", "tulip", "daffodil", "lily", "iris", "peony", "hydrangea", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon", "delphinium", "larkspur", "aster", "chrysanthemum", "dianthus", "carnation"],
    excludeKeywords: ["vegetable", "herb", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    icon: "🌸",
  },
  "flowers-perennials": {
    name: "Flowers - Perennials",
    description: "Flowers that return year after year",
    keywords: ["flower", "bloom", "blossom", "petal", "perennial", "ornamental", "seed", "seeds", "rose", "peony", "hydrangea", "iris", "lily", "daffodil", "tulip", "hosta", "daylily", "coneflower", "echinacea", "black-eyed susan", "rudbeckia", "salvia", "lavender", "sedum", "astilbe", "coral bells", "heuchera", "bleeding heart", "dicentra", "phlox", "delphinium", "larkspur", "dianthus", "carnation"],
    excludeKeywords: ["annual", "vegetable", "herb", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    icon: "🌺",
  },
  "flowers-annuals": {
    name: "Flowers - Annuals",
    description: "Bright annual flowers for seasonal color",
    keywords: ["flower", "bloom", "blossom", "petal", "annual", "ornamental", "seed", "seeds", "marigold", "zinnia", "sunflower", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon", "impatiens", "begonia", "geranium", "coleus", "sweet alyssum", "lobelia", "verbena", "portulaca", "moss rose"],
    excludeKeywords: ["perennial", "vegetable", "herb", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    icon: "🌻",
  },
  "vegetables": {
    name: "Vegetables",
    description: "Fresh vegetables for your kitchen garden",
    keywords: ["vegetable", "veggie", "seed", "seeds", "tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "pepper", "bell pepper", "jalapeño", "habanero", "okra", "brussels sprout", "cauliflower", "asparagus", "artichoke", "leek", "shallot", "celery", "parsnip", "rutabaga", "kohlrabi", "swiss chard", "collard", "mustard green", "bok choy", "pak choi"],
    excludeKeywords: ["herb", "flower", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    icon: "🥕",
  },
  "herbs": {
    name: "Herbs",
    description: "Fresh culinary herbs and aromatic plants",
    keywords: ["herb", "culinary", "aromatic", "spice", "seed", "seeds", "basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", "dill", "chive", "tarragon", "marjoram", "chervil", "fennel", "lavender", "lemongrass", "lemon balm", "stevia", "chamomile", "echinacea", "echinacea"],
    excludeKeywords: ["vegetable", "flower", "houseplant", "indoor", "succulent", "cactus", "diatomaceous earth", "diatomaceous", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
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
    keywords: ["tool", "supply", "equipment", "pot", "planter", "tray", "container", "pruner", "scissors", "bed", "beds", "garden bed", "raised bed", "hydroponic", "hydro", "fertilizer", "nutrient", "soil", "potting mix"],
    excludeKeywords: [],
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
  params: { slug: string };
}): Promise<Metadata> {
  const category = CATEGORIES[params.slug];
  
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

    // Check if product matches include keywords
    const matchesInclude = keywords.some((keyword) => 
      haystack.includes(keyword.toLowerCase())
    );

    // Check if product matches any exclude keywords
    const matchesExclude = excludeKeywords?.some((keyword) => 
      haystack.includes(keyword.toLowerCase())
    ) ?? false;

    // Include only if matches include keywords AND doesn't match exclude keywords
    return matchesInclude && !matchesExclude;
  });
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = CATEGORIES[params.slug];

  if (!category) {
    notFound();
  }

  const allProducts = await getAllProducts();
  let categoryProducts = filterProductsByCategory(
    allProducts, 
    category.keywords, 
    category.excludeKeywords
  );

  // Special handling for vegetables - group by type (stored separately for display)
  let vegetableGroups: Record<string, ShopifyProduct[]> | null = null;
  if (params.slug === "vegetables") {
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

    // Flatten for count display
    categoryProducts = Object.values(vegetableGroups).flat();
  } else {
    // Sort A-Z for categories that need it (flowers, herbs, houseplants, succulents)
    const sortCategories = ["flowers", "flowers-perennials", "flowers-annuals", "herbs", "houseplants", "succulents-cacti"];
    if (sortCategories.includes(params.slug)) {
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
              {params.slug === "flowers" && (
                <div className="mt-6 flex gap-4">
                  <Link
                    href="/shop/category/flowers-perennials"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    🌺 Perennials
                  </Link>
                  <Link
                    href="/shop/category/flowers-annuals"
                    className="rounded-lg border-2 border-primary-300 bg-white px-6 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 hover:border-primary-400"
                  >
                    🌻 Annuals
                  </Link>
                </div>
              )}
              
              {/* Subcategory Navigation for Supplies */}
              {params.slug === "gardening-supplies" && (
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
          ) : params.slug === "vegetables" && vegetableGroups ? (
            // Special grouped display for vegetables
            <div className="space-y-12">
              {Object.keys(vegetableGroups)
                .sort()
                .map((type) => (
                  <div key={type}>
                    <h2 className="mb-6 text-2xl font-bold text-slate-900 capitalize">
                      {type}
                    </h2>
                    <ProductGrid products={vegetableGroups![type]} />
                  </div>
                ))}
            </div>
          ) : (
            <ProductGrid products={categoryProducts} />
          )}
        </div>
      </section>
    </div>
  );
}
