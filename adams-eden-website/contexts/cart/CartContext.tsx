"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  ShopifyCart,
  ShopifyCartLineInput,
  updateCartLines,
} from "@/lib/shopify";

type CartState = {
  cart: ShopifyCart | null;
  loading: boolean;
  error: string | null;
  isCartOpen: boolean;
};

type CartContextValue = CartState & {
  initializeCart: () => Promise<void>;
  addToCart: (lines: ShopifyCartLineInput[]) => Promise<void>;
  updateLine: (
    lineId: string,
    payload: { quantity?: number; merchandiseId?: string }
  ) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  clearError: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "adams-eden-cart-id";
const isBrowser = typeof window !== "undefined";

const getStoredCartId = () => (isBrowser ? window.localStorage.getItem(CART_STORAGE_KEY) : null);
const setStoredCartId = (id: string) => {
  if (isBrowser) {
    window.localStorage.setItem(CART_STORAGE_KEY, id);
  }
};

async function bootstrapCart(cartId: string | null): Promise<ShopifyCart> {
  if (!cartId) {
    return createCart();
  }

  const cart = await getCart(cartId);
  if (cart) {
    return cart;
  }

  console.warn("Stored cart not found, creating a new cart");
  return createCart();
}

export function CartProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<CartState>({
    cart: null,
    loading: true,
    error: null,
    isCartOpen: false,
  });

  const setError = useCallback((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Something went wrong with the cart.";
    setState((prev) => ({ ...prev, error: message }));
  }, []);

  const initializeCart = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const storedId = getStoredCartId();
      const cart = await bootstrapCart(storedId);
      setStoredCartId(cart.id);
      setState((prev) => ({ ...prev, cart, loading: false, error: null }));
    } catch (error) {
      setError(error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [setError]);

  useEffect(() => {
    void initializeCart();
  }, [initializeCart]);

  const handleMutation = useCallback(
    async (callback: (cartId: string) => Promise<ShopifyCart>) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        let cartId = state.cart?.id ?? getStoredCartId();

        if (!cartId) {
          const newCart = await createCart();
          cartId = newCart.id;
          setStoredCartId(cartId);
          setState((prev) => ({ ...prev, cart: newCart }));
        }

        const updatedCart = await callback(cartId);
        setStoredCartId(updatedCart.id);
        setState((prev) => ({
          ...prev,
          cart: updatedCart,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setError(error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [setError, state.cart?.id]
  );

  const addToCart = useCallback(
    async (lines: ShopifyCartLineInput[]) => {
      await handleMutation((cartId) => addCartLines(cartId, lines));
      setState((prev) => ({ ...prev, isCartOpen: true }));
    },
    [handleMutation]
  );

  const updateLine = useCallback(
    async (lineId: string, payload: { quantity?: number; merchandiseId?: string }) => {
      await handleMutation((cartId) =>
        updateCartLines(cartId, [
          {
            id: lineId,
            ...payload,
          },
        ])
      );
    },
    [handleMutation]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      await handleMutation((cartId) => removeCartLines(cartId, [lineId]));
    },
    [handleMutation]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const openCart = useCallback(() => {
    setState((prev) => ({ ...prev, isCartOpen: true }));
  }, []);

  const closeCart = useCallback(() => {
    setState((prev) => ({ ...prev, isCartOpen: false }));
  }, []);

  const toggleCart = useCallback(() => {
    setState((prev) => ({ ...prev, isCartOpen: !prev.isCartOpen }));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      initializeCart,
      addToCart,
      updateLine,
      removeLine,
      clearError,
      openCart,
      closeCart,
      toggleCart,
    }),
    [state, initializeCart, addToCart, updateLine, removeLine, clearError, openCart, closeCart, toggleCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
