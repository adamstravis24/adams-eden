import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envFilePath = path.join(projectRoot, ".env.local");

const parsedEnv = { ...process.env };

if (fs.existsSync(envFilePath)) {
  const raw = fs.readFileSync(envFilePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsedEnv[key] = value;
  }
}

const storeDomain = parsedEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storeToken = parsedEnv.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const storefrontId = parsedEnv.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID;
const apiVersion = parsedEnv.SHOPIFY_STOREFRONT_API_VERSION || "2024-07";

const missing = [];
if (!storeDomain) missing.push("NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
if (!storeToken) missing.push("NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN");

if (missing.length > 0) {
  console.error(
    `Missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`
  );
  console.error(
    "Ensure they are defined in .env.local or the current shell session before running this script."
  );
  process.exit(1);
}

if (!storefrontId) {
  console.warn(
    "Warning: NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID is not set. Tokens issued from Shopify's custom storefront channel require this header. If you receive a Not Found error, retrieve the Storefront ID from Shopify admin and add it to .env.local."
  );
}

const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;
console.log(`Testing Shopify Storefront API via ${endpoint}`);

const query = `#graphql
  query TestProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

try {
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": storeToken,
  };
  if (storefrontId) {
    headers["Shopify-Storefront-Id"] = storefrontId;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: { first: 5 } }),
  });

  const rawBody = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.errors) {
    console.error("Request failed:");
    console.error(
      JSON.stringify(
        {
          status: response.status,
          statusText: response.statusText,
          body: payload ?? rawBody,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const edges = payload.data?.products?.edges ?? [];

  if (edges.length === 0) {
    console.warn("Request succeeded, but no products were returned.");
  } else {
    console.log(`Fetched ${edges.length} product(s):`);
    for (const { node } of edges) {
      const price = node.priceRange?.minVariantPrice;
      const priceLabel = price ? `${price.amount} ${price.currencyCode}` : "N/A";
      console.log(` • ${node.title} (handle: ${node.handle}) — ${priceLabel}`);
    }
  }

  console.log("Shopify Storefront API access looks good!\n");
} catch (error) {
  console.error("Unexpected error while testing Shopify connection:");
  console.error(error);
  process.exit(1);
}
