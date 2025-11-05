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

const CATEGORIES: Record<string, CategoryInfo> = {
  "houseplants": {
    name: "Houseplants",
    description: "Beautiful indoor plants to brighten any space",
    keywords: ["houseplant", "indoor plant", "interior plant", "foliage"],
    excludeKeywords: ["light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro"],
    icon: "🪴",
  },
  "outdoor-plants": {
    name: "Outdoor Plants",
    description: "Hardy perennials, vibrant annuals, and garden favorites",
    keywords: ["outdoor", "garden", "perennial", "annual", "landscape"],
    excludeKeywords: ["light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro"],
    icon: "🌿",
  },
  "succulents-cacti": {
    name: "Succulents & Cacti",
    description: "Low-maintenance desert beauties",
    keywords: ["succulent", "cactus", "cacti", "xerophyte", "desert", "arid"],
    icon: "🌵",
  },
  "herbs-edibles": {
    name: "Herbs & Edibles",
    description: "Fresh culinary herbs and kitchen garden staples",
    keywords: ["herb", "culinary", "aromatic", "spice", "edible", "vegetable", "kitchen", "cooking"],
    excludeKeywords: ["diatomaceous earth", "diatomaceous"],
    icon: "🌱",
  },
  "lighting": {
    name: "Lighting",
    description: "Professional grow lights for indoor cultivation",
    keywords: ["light", "lighting", "lamp", "led", "grow light", "fixture", "bulb", "spectrum"],
    icon: "💡",
  },
  "hydroponics": {
    name: "Hydroponics",
    description: "Advanced soil-free growing systems",
    keywords: ["hydroponic", "hydro", "dwc", "nft", "aeroponic", "water culture", "nutrient"],
    icon: "💧",
  },
  "soil-amendments": {
    name: "Soil & Amendments",
    description: "Premium potting mixes, composts, and soil conditioners",
    keywords: ["soil", "potting mix", "compost", "amendment", "fertilizer", "nutrient", "peat", "coco"],
    icon: "🪨",
  },
  "tools-supplies": {
    name: "Tools & Supplies",
    description: "Essential gardening tools and growing supplies",
    keywords: ["tool", "supply", "equipment", "pot", "planter", "tray", "container", "pruner", "scissors"],
    icon: "🛠️",
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
  const categoryProducts = filterProductsByCategory(
    allProducts, 
    category.keywords, 
    category.excludeKeywords
  );

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
          ) : (
            <ProductGrid products={categoryProducts} />
          )}
        </div>
      </section>
    </div>
  );
}
