import { ShopifyProduct, ShopifyMoney } from './types';

const storeDomain = process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storeToken = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = '2024-07';

if (!storeDomain || !storeToken) {
  console.warn('Shopify credentials not configured. Shop will not work.');
}

const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables
): Promise<TData | null> {
  if (!storeDomain || !storeToken) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storeToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const body = await response.json();

    if (!response.ok || body.errors) {
      console.error('Shopify API Error:', body.errors);
      return null;
    }

    return body.data as TData;
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return null;
  }
}

const PRODUCT_CARD_FIELDS = `
  id
  handle
  title
  productType
  description
  tags
  featuredImage {
    altText
    url
    width
    height
  }
  images(first: 6) {
    edges {
      node {
        altText
        url
        width
        height
      }
    }
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 25) {
    edges {
      node {
        id
        title
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
  }
`;

export async function getAllProducts(first = 250): Promise<ShopifyProduct[]> {
  const query = `#graphql
    query AllProducts($first: Int!) {
      products(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            ${PRODUCT_CARD_FIELDS}
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    products: {
      edges: Array<{ node: any }>;
    };
  }>(query, { first });

  if (!data) return [];

  return data.products.edges.map((edge) => ({
    ...edge.node,
    images: edge.node.images?.edges.map(({ node }: any) => node) ?? [],
    variants: edge.node.variants?.edges.map(({ node }: any) => node) ?? [],
  }));
}

export function formatMoney(money: ShopifyMoney, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(Number(money.amount));
}
