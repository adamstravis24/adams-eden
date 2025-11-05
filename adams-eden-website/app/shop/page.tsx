import Link from "next/link";
import { Metadata } from "next";
import { ShoppingBag, Sprout } from "lucide-react";

import { getAllProducts } from "@/lib/shopify";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Shop the Greenhouse | Adams Eden",
  description:
    "Browse hand-raised plants, curated bundles, and gardening essentials from Adams Eden's greenhouse.",
};

export const revalidate = 0; // Always fetch fresh data

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-primary-50 to-green-50 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-center text-5xl">
            <Sprout className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Bring the greenhouse home
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Freshly acclimated perennials, annuals, houseplants, and curated companion
            bundles—ready for pickup, delivery, or white-glove planting.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Latest arrivals</h2>
              <p className="mt-2 text-gray-600">
                Each collection is raised on-site for Pacific Northwest gardens, refreshed weekly.
              </p>
            </div>
            <Link
              href="#products-grid"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-700"
            >
              <ShoppingBag className="h-4 w-4" />
              View featured sets
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-500">
              New collections are being prepped for the season. Check back soon!
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </section>
    </div>
  );
}
