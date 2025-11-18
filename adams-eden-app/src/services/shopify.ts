import { optionalEnv } from '../utils/env';
import { ShopifyProduct, ShopifyMoney, ShopifyCartLineInput } from './types';

const storeDomainRaw = optionalEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');
const storeDomain = storeDomainRaw
  ? storeDomainRaw.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  : undefined;
const storeToken = optionalEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN');
const apiVersion = '2024-07';

let loggedMissingConfig = false;

const endpoint = storeDomain
  ? `https://${storeDomain}/api/${apiVersion}/graphql.json`
  : null;

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables
): Promise<TData | null> {
  if (!storeDomain || !storeToken || !endpoint) {
    if (__DEV__ && !loggedMissingConfig) {
      console.warn('[shopify] Storefront credentials missing. Set NEXT_PUBLIC_SHOPIFY_* env vars.');
      loggedMissingConfig = true;
    }
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

export async function getAllProducts(first = 250): Promise<ShopifyProduct[] | null> {
  const query = `#graphql
    query AllProducts($first: Int!) {
      products(first: $first, sortKey: UPDATED_AT, reverse: true) {
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

  if (!data) return null;

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

export async function createCartCheckoutUrl(
  lines: ShopifyCartLineInput[]
): Promise<string | null> {
  if (!lines.length) return null;
  if (!storeDomain || !storeToken || !endpoint) {
    if (__DEV__) {
      console.warn('[shopify] Cannot create cart because credentials are missing.');
    }
    throw new Error('Shopify credentials are not configured.');
  }

  const mutation = `#graphql
    mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart {
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    cartCreate: {
      cart: { checkoutUrl: string } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(mutation, { lines });

  const errors = data?.cartCreate?.userErrors ?? [];
  if (errors.length) {
    console.error('Shopify cartCreate errors:', errors);
    throw new Error(errors.map((error) => error.message).join('\n'));
  }

  const checkoutUrl = data?.cartCreate?.cart?.checkoutUrl ?? null;
  if (!checkoutUrl) {
    throw new Error('Shopify did not return a checkout URL.');
  }

  return checkoutUrl;
}

export function getProductUrl(handle: string): string | null {
  if (!storeDomain) return null;
  return `https://${storeDomain}/products/${handle}`;
}

export const isShopifyConfigured = Boolean(storeDomain && storeToken);
