const envStoreDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
if (!envStoreDomain) {
  throw new Error(
    "Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN environment variable. Set it to your Shopify store's domain (e.g. p7bx00-00.myshopify.com)."
  );
}

const envStoreToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
if (!envStoreToken) {
  throw new Error(
    "Missing NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variable. Generate a Storefront API token in Shopify and add it to your environment."
  );
}

const storeDomain: string = envStoreDomain;
const storeToken: string = envStoreToken;
const storefrontId = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2024-07";

const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;

type ShopifyFetchOptions = {
  cache?: RequestCache;
  tags?: string[];
};

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  options: ShopifyFetchOptions = {}
): Promise<TData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": storeToken,
  };

  if (storefrontId) {
    headers["Shopify-Storefront-Id"] = storefrontId;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: options.cache ?? "no-store",
    next: options.tags ? { tags: options.tags } : undefined,
  });

  const body = await response.json();

  if (!response.ok || body.errors) {
    const error = body.errors?.[0];
    throw new Error(
      error?.message ||
        `Shopify API request failed with status ${response.status}`
    );
  }

  return body.data as TData;
}

export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  altText: string | null;
  url: string;
  width: number;
  height: number;
};

export type ShopifyVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
};

export type ShopifyProductOption = {
  id: string;
  name: string;
  values: string[];
};

type ShopifyProductRaw = {
  id: string;
  handle: string;
  title: string;
  productType: string | null;
  description: string;
  descriptionHtml: string;
  featuredImage: ShopifyImage | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  tags: string[];
  options: ShopifyProductOption[];
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
};

export type ShopifyProduct = Omit<ShopifyProductRaw, "images" | "variants"> & {
  images: ShopifyImage[];
  variants: ShopifyVariant[];
};

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  merchandise: {
    id: string;
    title: string;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: ShopifyImage | null;
    };
  };
};

type ShopifyCartGraphQL = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
  cost: {
    subtotalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
    totalAmount: ShopifyMoney;
  };
};

export type ShopifyCart = Omit<ShopifyCartGraphQL, "lines"> & {
  lines: ShopifyCartLine[];
};

const PRODUCT_CARD_FIELDS = `
  id
  handle
  title
  productType
  description
  descriptionHtml
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
  options {
    id
    name
    values
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

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            product {
              id
              handle
              title
              featuredImage {
                altText
                url
                width
                height
              }
            }
          }
        }
      }
    }
  }
  cost {
    subtotalAmount {
      amount
      currencyCode
    }
    totalTaxAmount {
      amount
      currencyCode
    }
    totalAmount {
      amount
      currencyCode
    }
  }
`;

const CART_FRAGMENT = `
  cart {
    ${CART_FIELDS}
  }
`;

export function formatMoney(
  money: ShopifyMoney,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

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
      edges: Array<{ node: ShopifyProductRaw }>;
    };
  }>(query, { first }, { cache: "no-store", tags: ["shopify-products"] });

  return data.products.edges.map((edge) => normalizeProduct(edge.node));
}

export async function getProductByHandle(
  handle: string
): Promise<ShopifyProduct | null> {
  const query = `#graphql
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        ${PRODUCT_CARD_FIELDS}
      }
    }
  `;

  const data = await shopifyFetch<{
    product: ShopifyProductRaw | null;
  }>(query, { handle }, { tags: ["shopify-product", handle] });

  return data.product ? normalizeProduct(data.product) : null;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const query = `#graphql
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ${CART_FIELDS}
      }
    }
  `;

  const data = await shopifyFetch<{
    cart: ShopifyCartGraphQL | null;
  }>(query, { cartId }, { cache: "no-store", tags: ["shopify-cart", cartId] });

  return data.cart ? normalizeCart(data.cart) : null;
}

export async function createCart(
  lines: ShopifyCartLineInput[] = []
): Promise<ShopifyCart> {
  const mutation = `#graphql
    mutation CreateCart($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        ${CART_FRAGMENT}
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    cartCreate: {
      cart: ShopifyCartGraphQL;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, { lines });

  const { cart, userErrors } = data.cartCreate;

  if (userErrors?.length) {
    throw new Error(userErrors[0]?.message || "Failed to create cart");
  }

  return normalizeCart(cart);
}

export async function addCartLines(
  cartId: string,
  lines: ShopifyCartLineInput[]
): Promise<ShopifyCart> {
  const mutation = `#graphql
    mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        ${CART_FRAGMENT}
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: ShopifyCartGraphQL;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, { cartId, lines });

  const { cart, userErrors } = data.cartLinesAdd;

  if (userErrors?.length) {
    throw new Error(userErrors[0]?.message || "Failed to add cart lines");
  }

  return normalizeCart(cart);
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; merchandiseId?: string; quantity?: number }>
): Promise<ShopifyCart> {
  const mutation = `#graphql
    mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        ${CART_FRAGMENT}
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCartGraphQL;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, { cartId, lines });

  const { cart, userErrors } = data.cartLinesUpdate;

  if (userErrors?.length) {
    throw new Error(userErrors[0]?.message || "Failed to update cart lines");
  }

  return normalizeCart(cart);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  const mutation = `#graphql
    mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        ${CART_FRAGMENT}
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: ShopifyCartGraphQL;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(mutation, { cartId, lineIds });

  const { cart, userErrors } = data.cartLinesRemove;

  if (userErrors?.length) {
    throw new Error(userErrors[0]?.message || "Failed to remove cart lines");
  }

  return normalizeCart(cart);
}

function normalizeProduct(product: ShopifyProductRaw): ShopifyProduct {
  return {
    ...product,
    images: product.images?.edges.map(({ node }) => node) ?? [],
    variants: product.variants?.edges.map(({ node }) => node) ?? [],
  };
}

function normalizeCart(cart: ShopifyCartGraphQL): ShopifyCart {
  return {
    ...cart,
    lines: cart.lines.edges.map(({ node }) => node),
  };
}
