import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, Leaf, Sprout, Truck } from "lucide-react";

import { formatMoney, getProductByHandle } from "@/lib/shopify";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const product = await getProductByHandle(params.handle);

  if (!product) {
    return {
      title: "Product not found | Adams Eden",
    };
  }

  const description = product.description
    ? product.description.slice(0, 155)
    : "Discover Adams Eden greenhouse favorites, delivered fresh to your space.";

  const images = product.featuredImage
    ? [{ url: product.featuredImage.url, alt: product.featuredImage.altText ?? product.title }]
    : [];

  return {
    title: `${product.title} | Adams Eden Shop`,
    description,
    openGraph: {
      title: `${product.title} | Adams Eden Shop`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Adams Eden Shop`,
      description,
      images,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProductByHandle(params.handle);

  if (!product) {
    notFound();
  }

  const primaryVariant = product.variants[0];
  const secondaryImages = product.images.filter(
    (image) => image.url !== product.featuredImage?.url
  );

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/shop" className="hover:text-primary-600">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{product.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100">
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 500px, 90vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary-50 text-primary-600">
                  <Sprout className="h-12 w-12" />
                </div>
              )}
            </div>

            {secondaryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {secondaryImages.map((image) => (
                  <div
                    key={image.url}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100"
                  >
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 160px, 30vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{product.title}</h1>
              <p className="mt-2 text-lg text-gray-600">
                {product.description || "Raised in the Adams Eden greenhouse for thriving Pacific Northwest gardens."}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-semibold text-gray-900">
                  {formatMoney(primaryVariant?.price ?? product.priceRange.minVariantPrice)}
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
                  <Leaf className="h-4 w-4" />
                  Fresh from the greenhouse
                </span>
              </div>

              {product.options.length > 1 && (
                <form className="mt-6 space-y-4">
                  {product.options.map((option) => (
                    <fieldset key={option.id} className="space-y-2">
                      <legend className="text-sm font-medium text-gray-700">
                        {option.name}
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => (
                          <label
                            key={`${option.id}-${value}`}
                            className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-400 hover:text-primary-600"
                          >
                            <input
                              type="radio"
                              name={option.name}
                              value={value}
                              className="sr-only"
                              defaultChecked={value === primaryVariant?.title}
                            />
                            {value}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </form>
              )}

              <div className="mt-6 space-y-4">
                <AddToCartButton
                  variantId={primaryVariant?.id}
                  disabled={!primaryVariant?.availableForSale}
                  className="w-full px-6 py-3 text-base"
                />

                <div className="flex flex-col gap-3 rounded-2xl bg-primary-50/60 p-4 text-sm text-primary-800">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Delivery and in-home planting available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Added purchases sync with your Adams Eden app for care tips</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-green max-w-none">
              <h2>Why gardeners love this pick</h2>
              <p dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />

              {product.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 px-8 py-12 text-white">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Pickup or delivery</h3>
              <p className="text-sm text-primary-50">
                Reserve online and pick up at the greenhouse, or schedule white-glove delivery and planting.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Care that follows home</h3>
              <p className="text-sm text-primary-50">
                Purchases sync with the Adams Eden app to unlock care guides, alerts, and workshop invites.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Grower hotline access</h3>
              <p className="text-sm text-primary-50">
                Chat with our team for planting questions, pairing advice, or seasonal refresh scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
