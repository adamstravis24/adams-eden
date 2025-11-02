"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tag, Sparkles } from "lucide-react";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatMoney, ShopifyProduct } from "@/lib/shopify";

const CATEGORY_FILTERS = [
  { label: "All", value: "all" },
  { label: "Lighting", value: "lighting" },
  { label: "Hydroponics", value: "hydroponics" },
] as const;

type CategoryValue = (typeof CATEGORY_FILTERS)[number]["value"];

const CATEGORY_KEYWORDS: Record<CategoryValue, string[]> = {
  all: [],
  lighting: ["light", "grow"],
  hydroponics: ["hydro", "aeroponic", "aquaponic"],
};

function matchesCategory(product: ShopifyProduct, category: CategoryValue) {
  if (category === "all") return true;

  const haystack = [
    product.productType,
    product.title,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return CATEGORY_KEYWORDS[category].some((keyword) =>
    haystack.includes(keyword)
  );
}

type ProductGridProps = {
  products: ShopifyProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryValue>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => matchesCategory(product, activeCategory));
  }, [products, activeCategory]);

  const activeCount = filteredProducts.length;

  return (
    <div id="products-grid" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-primary-50/60 p-4 shadow-inner">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-700">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>
            Showing {activeCount} {activeCategory === "all" ? "products" : `${activeCategory} picks`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((category) => {
            const isActive = category.value === activeCategory;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white text-primary-700 shadow hover:bg-primary-100"
                }`}
              >
                <Tag className="h-4 w-4" aria-hidden />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-500">
          No products match this category yet. Check back soon!
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

type ProductCardProps = {
  product: ShopifyProduct;
};

function ProductCard({ product }: ProductCardProps) {
  const coverImage = product.featuredImage || product.images[0];
  const primaryVariant = product.variants[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={coverImage.altText ?? product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary-50 text-primary-600">
            <Sparkles className="h-10 w-10" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            <Link href={`/shop/${product.handle}`} className="hover:text-primary-600">
              {product.title}
            </Link>
          </h3>
          <p className="text-base font-semibold text-primary-700">
            {formatMoney(product.priceRange.minVariantPrice)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <Link
            href={`/shop/${product.handle}`}
            className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
          >
            View details
          </Link>
          <AddToCartButton
            variantId={primaryVariant?.id}
            disabled={!primaryVariant?.availableForSale}
            className="px-4 py-2 text-xs sm:text-sm"
          />
        </div>
      </div>
    </article>
  );
}
