import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getAllProducts } from "@/lib/shopify";
import { ProductList } from "@/components/shop/ProductList";

export const metadata: Metadata = {
  title: "All Products | Adams Eden Shop",
  description: "Browse our complete collection of plants, growing equipment, and garden supplies.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AllProductsPage() {
  const products = await getAllProducts();

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
            <span className="font-semibold text-slate-900">All Products</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900">All Products</h1>
          <p className="mt-2 text-lg text-slate-600">
            Explore our complete collection of {products.length} items
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-lg font-semibold text-slate-900">No products available</p>
              <p className="mt-2 text-sm text-slate-600">
                New collections are being prepped. Check back soon!
              </p>
            </div>
          ) : (
            <ProductList products={products} />
          )}
        </div>
      </section>
    </div>
  );
}
