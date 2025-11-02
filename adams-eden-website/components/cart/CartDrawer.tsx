"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import { useCart } from "@/contexts/cart/CartContext";
import { formatMoney, ShopifyCartLine } from "@/lib/shopify";

export default function CartDrawer() {
  const {
    cart,
    loading,
    error,
    clearError,
    isCartOpen,
    closeCart,
    removeLine,
    updateLine,
  } = useCart();

  const [pendingLineId, setPendingLineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loading) {
      setPendingLineId(null);
    }
  }, [loading]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => clearError(), 4000);
    return () => window.clearTimeout(timeout);
  }, [error, clearError]);

  const lines = useMemo<ShopifyCartLine[]>(() => cart?.lines ?? [], [cart]);
  const isBusy = loading || isPending;

  const handleClose = () => {
    if (isBusy) return;
    closeCart();
  };

  const handleQuantityChange = (line: ShopifyCartLine, delta: number) => {
    const nextQuantity = line.quantity + delta;
    setPendingLineId(line.id);

    startTransition(() => {
      const action =
        nextQuantity <= 0
          ? removeLine(line.id)
          : updateLine(line.id, { quantity: nextQuantity });

      action.finally(() => setPendingLineId(null));
    });
  };

  const handleRemove = (lineId: string) => {
    setPendingLineId(lineId);
    startTransition(() => {
      removeLine(lineId).finally(() => setPendingLineId(null));
    });
  };

  const drawerVisible = isCartOpen;

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={handleClose}
      />
      <aside
        aria-label="Shopping cart"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ${drawerVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-500">Your cart</p>
              <h2 className="text-xl font-semibold text-slate-900">
                {cart?.totalQuantity ? `${cart.totalQuantity} item${cart.totalQuantity > 1 ? "s" : ""}` : "Cart is empty"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {error && (
            <div className="bg-red-50 px-6 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {lines.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <ShoppingBag className="mb-4 h-10 w-10 text-primary-500" />
                <p className="text-lg font-semibold">Your cart is empty</p>
                <p className="mt-2 text-sm">Browse the greenhouse to add plants you love.</p>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Shop plants
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex gap-4 rounded-2xl border border-slate-100 p-3 shadow-sm"
                  >
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                      {line.merchandise.product.featuredImage ? (
                        <Image
                          src={line.merchandise.product.featuredImage.url}
                          alt={
                            line.merchandise.product.featuredImage.altText ??
                            line.merchandise.product.title
                          }
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary-600">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {line.merchandise.product.title}
                          </p>
                          <p className="text-xs text-slate-500">{line.merchandise.title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(line.id)}
                          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                          aria-label="Remove item"
                          disabled={pendingLineId === line.id && isBusy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                          <button
                            type="button"
                            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                            onClick={() => handleQuantityChange(line, -1)}
                            disabled={pendingLineId === line.id && isBusy}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-medium text-slate-700">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                            onClick={() => handleQuantityChange(line, 1)}
                            disabled={pendingLineId === line.id && isBusy}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-sm font-semibold text-slate-900">
                          {formatMoney(line.cost.subtotalAmount)}
                        </div>
                      </div>

                      {pendingLineId === line.id && isBusy && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-primary-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="border-t border-slate-200 p-6">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="text-lg font-semibold text-slate-900">
                {cart ? formatMoney(cart.cost.subtotalAmount) : "$0.00"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Taxes and delivery calculated at checkout.
            </p>
            <Link
              href={cart?.checkoutUrl ?? "/shop"}
              onClick={closeCart}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingBag className="h-5 w-5" />
              )}
              {cart?.totalQuantity ? "Checkout" : "Browse plants"}
            </Link>
          </footer>
        </div>
      </aside>
    </>
  );
}
