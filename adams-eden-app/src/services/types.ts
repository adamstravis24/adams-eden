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

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  productType: string | null;
  description: string;
  featuredImage: ShopifyImage | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  tags: string[];
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

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ShopifyCartLine[];
  cost: {
    subtotalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
    totalAmount: ShopifyMoney;
  };
};
