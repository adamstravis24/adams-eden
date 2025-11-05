"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Eye, SlidersHorizontal } from "lucide-react";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatMoney, ShopifyProduct } from "@/lib/shopify";

const CATEGORY_FILTERS = [
  { label: "All Products", value: "all" },
  { label: "Houseplants", value: "houseplant" },
  { label: "Outdoor Plants", value: "outdoor" },
  { label: "Succulents & Cacti", value: "succulent" },
  { label: "Herbs & Edibles", value: "herb" },
  { label: "Flowering Plants", value: "flowering" },
  { label: "Gardening Supplies", value: "supplies" },
] as const;

const CARE_LEVEL_FILTERS = [
  { label: "Easy Care", value: "beginner" },
  { label: "Moderate Care", value: "intermediate" },
  { label: "Expert Care", value: "advanced" },
] as const;

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name A-Z", value: "name-asc" },
] as const;

type CategoryValue = (typeof CATEGORY_FILTERS)[number]["value"];
type CareLevelValue = (typeof CARE_LEVEL_FILTERS)[number]["value"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const CATEGORY_KEYWORDS: Record<CategoryValue, string[]> = {
  all: [],
  houseplant: ["houseplant", "indoor", "interior", "home"],
  outdoor: ["outdoor", "garden", "exterior", "perennial", "annual"],
  succulent: ["succulent", "cactus", "cacti", "xerophyte", "desert"],
  herb: ["herb", "culinary", "aromatic", "spice", "edible", "vegetable"],
  flowering: ["flower", "bloom", "blooming", "floral", "blossom"],
  supplies: ["pot", "soil", "fertilizer", "tool", "supply", "equipment", "planter"],
};

const CARE_KEYWORDS: Record<CareLevelValue, string[]> = {
  beginner: ["easy", "beginner", "low-maintenance", "hardy", "simple"],
  intermediate: ["moderate", "intermediate", "some-care", "medium"],
  advanced: ["difficult", "advanced", "high-maintenance", "expert", "challenging"],
};

function matchesSearch(product: ShopifyProduct, searchTerm: string) {
  if (!searchTerm) return true;
  const haystack = [
    product.title,
    product.description,
    product.productType,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

function matchesCategory(product: ShopifyProduct, category: CategoryValue) {
  if (category === "all") return true;
  const haystack = [
    product.productType,
    product.title,
    product.description,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return CATEGORY_KEYWORDS[category].some((keyword) =>
    haystack.includes(keyword)
  );
}

function matchesCareLevel(product: ShopifyProduct, careLevels: CareLevelValue[]) {
  if (careLevels.length === 0) return true;
  const haystack = [product.description, ...(product.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return careLevels.some((level) =>
    CARE_KEYWORDS[level].some((keyword) => haystack.includes(keyword))
  );
}

function matchesPriceRange(product: ShopifyProduct, min: number, max: number) {
  const price = Number(product.priceRange.minVariantPrice.amount);
  return price >= min && price <= max;
}

function sortProducts(products: ShopifyProduct[], sortBy: SortValue) {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount);
      case "price-desc":
        return Number(b.priceRange.minVariantPrice.amount) - Number(a.priceRange.minVariantPrice.amount);
      case "name-asc":
        return a.title.localeCompare(b.title);
      case "relevance":
      case "newest":
      default:
        return 0;
    }
  });
}

type QuickViewModalProps = {
  product: ShopifyProduct | null;
  isOpen: boolean;
  onClose: () => void;
};

function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  if (!product || !isOpen) return null;

  const coverImage = product.featuredImage || product.images[0];
  const primaryVariant = product.variants[0];

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-4 z-50 flex items-center justify-center p-4">
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-lg transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="grid md:grid-cols-2">
            <div className="p-6">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                {coverImage ? (
                  <Image
                    src={coverImage.url}
                    alt={coverImage.altText ?? product.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 400px, 90vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary-600">
                    <span className="text-6xl">🌿</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col p-6">
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{product.title}</h2>
                  <p className="mt-2 text-3xl font-bold text-primary-600">
                    {formatMoney(product.priceRange.minVariantPrice)}
                  </p>
                </div>
                {product.description && (
                  <p className="text-slate-600">
                    {product.description.replace(/<[^>]*>/g, "").slice(0, 200)}...
                  </p>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3 border-t border-slate-200 pt-6">
                <AddToCartButton
                  variantId={primaryVariant?.id}
                  disabled={!primaryVariant?.availableForSale}
                  className="w-full px-6 py-3 text-base font-semibold"
                />
                <Link
                  href={`/shop/${product.handle}`}
                  onClick={onClose}
                  className="block w-full rounded-lg border-2 border-primary-600 px-6 py-3 text-center text-base font-semibold text-primary-600 transition hover:bg-primary-50"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

type ProductGridProps = {
  products: ShopifyProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("all");
  const [activeCareLevels, setActiveCareLevels] = useState<CareLevelValue[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<SortValue>("relevance");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ShopifyProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const toggleCareLevel = (level: CareLevelValue) => {
    setActiveCareLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      return (
        matchesSearch(product, searchTerm) &&
        matchesCategory(product, activeCategory) &&
        matchesCareLevel(product, activeCareLevels) &&
        matchesPriceRange(product, priceRange[0], priceRange[1])
      );
    });
    return sortProducts(filtered, sortBy);
  }, [products, searchTerm, activeCategory, activeCareLevels, priceRange, sortBy]);

  const activeFiltersCount =
    (activeCategory !== "all" ? 1 : 0) +
    activeCareLevels.length +
    (priceRange[0] !== 0 || priceRange[1] !== 500 ? 1 : 0);

  const resetFilters = () => {
    setActiveCategory("all");
    setActiveCareLevels([]);
    setPriceRange([0, 500]);
    setSearchTerm("");
  };

  return (
    <div className="flex gap-8">
      {/* Sidebar Filters - Desktop */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <div className="sticky top-24 space-y-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Categories</h4>
            <div className="space-y-2">
              {CATEGORY_FILTERS.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeCategory === category.value
                      ? "bg-primary-600 font-semibold text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Care Level */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Care Level</h4>
            <div className="space-y-2">
              {CARE_LEVEL_FILTERS.map((level) => (
                <label
                  key={level.value}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={activeCareLevels.includes(level.value)}
                    onChange={() => toggleCareLevel(level.value)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  {level.label}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Price Range</h4>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}{priceRange[1] >= 500 ? "+" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - Search, Sort, and Product Grid */}
      <div className="flex-1">
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for products, plants and more..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Mobile Filter Button & Sort */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-slate-600">
            Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Product Grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <p className="mb-2 text-lg font-semibold text-slate-900">No products found</p>
            <p className="text-sm text-slate-600">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={() => {
                  setQuickViewProduct(product);
                  setIsQuickViewOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />

          {/* Filter Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-8">
                  {/* Categories */}
                  <div>
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                      Categories
                    </h4>
                    <div className="space-y-2">
                      {CATEGORY_FILTERS.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setActiveCategory(category.value)}
                          className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                            activeCategory === category.value
                              ? "bg-primary-100 text-primary-900"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Care Level */}
                  <div>
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                      Care Level
                    </h4>
                    <div className="space-y-3">
                      {CARE_LEVEL_FILTERS.map((level) => (
                        <label
                          key={level.value}
                          className="flex cursor-pointer items-center gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={activeCareLevels.includes(level.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setActiveCareLevels([...activeCareLevels, level.value]);
                              } else {
                                setActiveCareLevels(
                                  activeCareLevels.filter((l) => l !== level.value)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                          />
                          <span className="text-sm text-slate-700">{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                      Price Range
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([priceRange[0], parseInt(e.target.value)])
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-slate-200 px-6 py-4">
                <div className="flex gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />
    </div>
  );
}

type ProductCardProps = {
  product: ShopifyProduct;
  onQuickView: () => void;
};

function ProductCard({ product, onQuickView }: ProductCardProps) {
  const coverImage = product.featuredImage || product.images[0];
  const primaryVariant = product.variants[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg">
      {!primaryVariant?.availableForSale && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Out of Stock
        </div>
      )}

      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={coverImage.altText ?? product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🌿</div>
        )}

        <button
          onClick={onQuickView}
          className="absolute inset-x-4 bottom-4 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100"
        >
          <Eye className="mr-2 inline h-4 w-4" />
          Quick View
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-slate-900">
          <Link href={`/shop/${product.handle}`} className="hover:text-primary-600">
            {product.title}
          </Link>
        </h3>
        <p className="mb-4 text-lg font-bold text-slate-900">
          {formatMoney(product.priceRange.minVariantPrice)}
        </p>

        <div className="mt-auto">
          <AddToCartButton
            variantId={primaryVariant?.id}
            disabled={!primaryVariant?.availableForSale}
            className="w-full px-4 py-2 text-sm font-semibold"
          />
        </div>
      </div>
    </article>
  );
}
