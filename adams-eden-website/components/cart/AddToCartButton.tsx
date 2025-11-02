"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, ShoppingBag } from "lucide-react";

import { useCart } from "@/contexts/cart/CartContext";

interface AddToCartButtonProps {
  variantId?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  defaultLabel?: string;
  addedLabel?: string;
  soldOutLabel?: string;
}

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  className,
  defaultLabel,
  addedLabel,
  soldOutLabel,
}: AddToCartButtonProps) {
  const { addToCart, loading } = useCart();
  const [isPending, startTransition] = useTransition();
  const [hasAdded, setHasAdded] = useState(false);

  useEffect(() => {
    setHasAdded(false);
  }, [variantId, disabled]);

  const isDisabled = useMemo(() => {
    return disabled || !variantId || loading || isPending;
  }, [disabled, variantId, loading, isPending]);

  const handleClick = () => {
    if (!variantId || isDisabled) {
      return;
    }

    startTransition(() => {
      addToCart([
        {
          merchandiseId: variantId,
          quantity,
        },
      ])
        .then(() => setHasAdded(true))
        .catch(() => setHasAdded(false));
    });
  };

  const label = disabled
    ? soldOutLabel ?? "Sold out"
    : hasAdded
    ? addedLabel ?? "Added"
    : defaultLabel ?? "Add to cart";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {loading || isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingBag className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
