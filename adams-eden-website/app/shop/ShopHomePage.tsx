"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Sparkles, Tag, TrendingUp, ArrowRight } from "lucide-react";
import { formatMoney, ShopifyProduct } from "@/lib/shopify";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { usePathname } from "next/navigation";

type ShopHomePageProps = {
  products: ShopifyProduct[];
};

// Define shop categories
const SHOP_CATEGORIES = [
  {
    name: "Flowers",
    slug: "flowers",
    description: "Beautiful blooms for your garden",
    icon: "🌸",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    name: "Vegetables",
    slug: "vegetables",
    description: "Fresh vegetables for your kitchen garden",
    icon: "🥕",
    gradient: "from-orange-500 to-red-600",
  },
  {
    name: "Herbs",
    slug: "herbs",
    description: "Fresh culinary herbs and aromatic plants",
    icon: "🌿",
    gradient: "from-green-600 to-emerald-700",
  },
  {
    name: "Houseplants",
    slug: "houseplants",
    description: "Indoor greenery for every space",
    icon: "🪴",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "Succulents & Cacti",
    slug: "succulents-cacti",
    description: "Low-maintenance desert beauties",
    icon: "🌵",
    gradient: "from-lime-500 to-green-600",
  },
  {
    name: "Gardening Supplies",
    slug: "gardening-supplies",
    description: "Everything you need for successful gardening",
    icon: "🛠️",
    gradient: "from-slate-600 to-gray-700",
  },
];

export function ShopHomePage({ products }: ShopHomePageProps) {
  const pathname = usePathname();
  const isShopHome = pathname === "/shop";
  
  // Get newest products (featured items)
  const featuredProducts = products.slice(0, 8);
  
  // Get products on sale (those with "sale" tag or price variations)
  const saleProducts = products.filter(product => 
    product.tags?.some(tag => tag.toLowerCase().includes('sale')) ||
    Number(product.priceRange.maxVariantPrice.amount) > Number(product.priceRange.minVariantPrice.amount)
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
      {/* Category Sidebar - Only on shop home */}
      {isShopHome && (
        <div className="fixed left-0 top-0 z-10 h-screen w-64 border-r border-slate-200 bg-white pt-24">
          <div className="px-4 py-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Categories</h2>
            <nav className="space-y-2">
              {SHOP_CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop/category/${category.slug}`}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-700"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content - Offset if sidebar is shown */}
      <div className={isShopHome ? "ml-64" : ""}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-green-800 py-20 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-primary-200" />
            </div>
            <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
              Shop Adams Eden
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-primary-100">
              Discover hand-selected plants, professional growing equipment, and everything you need
              to cultivate your perfect garden.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shop/products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary-700 shadow-xl transition hover:bg-primary-50"
              >
                Browse All Products
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Current Sales Section */}
      {saleProducts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-3">
                  <Tag className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Current Sales</h2>
                  <p className="mt-1 text-slate-600">Limited time offers on select items</p>
                </div>
              </div>
              <Link
                href="/shop/products?filter=sale"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View all sales →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {saleProducts.map((product) => (
                <ProductCard key={product.id} product={product} badge="Sale" badgeColor="red" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Items (Newest) */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary-100 p-3">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Featured Items</h2>
                <p className="mt-1 text-slate-600">Our newest arrivals just for you</p>
              </div>
            </div>
            <Link
              href="/shop/products"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View all products →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} badge="New" badgeColor="primary" />
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900">Shop by Category</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              Find exactly what you need for your growing journey
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SHOP_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/shop/category/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 transition group-hover:opacity-10`} />
                <div className="relative">
                  <div className="mb-4 text-5xl">{category.icon}</div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-600">{category.description}</p>
                  <div className="mt-4 flex items-center text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                    Shop now
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

type ProductCardProps = {
  product: ShopifyProduct;
  badge?: string;
  badgeColor?: "red" | "primary";
};

function ProductCard({ product, badge, badgeColor = "primary" }: ProductCardProps) {
  const coverImage = product.featuredImage || product.images[0];
  const primaryVariant = product.variants[0];

  const badgeStyles = {
    red: "bg-red-500 text-white",
    primary: "bg-primary-600 text-white",
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      {badge && (
        <div className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badgeStyles[badgeColor]} shadow-lg`}>
          {badge}
        </div>
      )}
      {!primaryVariant?.availableForSale && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Out of Stock
        </div>
      )}

      <Link href={`/shop/${product.handle}`} className="block">
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
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-primary-600">
            {product.title}
          </h3>
          <p className="mb-4 text-xl font-bold text-slate-900">
            {formatMoney(product.priceRange.minVariantPrice)}
          </p>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <AddToCartButton
          variantId={primaryVariant?.id}
          disabled={!primaryVariant?.availableForSale}
          className="w-full px-4 py-2.5 text-sm font-semibold"
        />
      </div>
    </article>
  );
}
