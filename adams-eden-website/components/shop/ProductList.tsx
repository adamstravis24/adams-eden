"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMoney, ShopifyProduct } from "@/lib/shopify";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

type ProductListProps = {
  products: ShopifyProduct[];
};

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const coverImage = product.featuredImage || product.images[0];
        const primaryVariant = product.variants[0];

        return (
          <article
            key={product.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg"
          >
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
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl">🌿</div>
              )}
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
      })}
    </div>
  );
}

