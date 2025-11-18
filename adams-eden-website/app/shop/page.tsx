import { Metadata } from "next";

import { getAllProducts } from "@/lib/shopify";
import { ShopHomePage } from "./ShopHomePage";

export const metadata: Metadata = {
  title: "Shop the Greenhouse | Adams Eden",
  description:
    "Browse hand-raised plants, curated bundles, and gardening essentials from Adams Eden's greenhouse.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fetch fresh data

export default async function ShopPage() {
  const products = await getAllProducts();

  return <ShopHomePage products={products} />;
}
