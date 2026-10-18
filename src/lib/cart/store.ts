"use client";

import { useSyncExternalStore } from "react";
import type { ArtKind } from "@/lib/catalog/types";

/**
 * Client-side cart persisted to localStorage. Prices here are for display only —
 * checkout recomputes totals on the server from variant IDs.
 */
export type CartLine = {
  key: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  art: ArtKind;
  color: { name: string; hex: string };
  size: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
};

type CartState = { lines: CartLine[]; open: boolean };

const STORAGE_KEY = "ribat:cart:v2"; // v2: lines carry variantId
const MAX_QTY = 20;
const EMPTY: CartState = { lines: [], open: false };

let state: CartState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { lines: JSON.parse(raw) as CartLine[], open: false };
  } catch {
    // Corrupt or blocked storage — start empty.
  }
}

function setState(next: CartState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.lines));
  } catch {
    // Storage unavailable (private mode) — cart still works for this tab.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const cart = {
  add(line: Omit<CartLine, "key" | "quantity">, quantity = 1, { open = true } = {}) {
    hydrate();
    const key = line.variantId;
    const existing = state.lines.find((l) => l.key === key);
    const lines = existing
      ? state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l))
      : [...state.lines, { ...line, key, quantity }];
    setState({ lines, open });
  },
  setQuantity(key: string, quantity: number) {
    const lines =
      quantity <= 0
        ? state.lines.filter((l) => l.key !== key)
        : state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l));
    setState({ ...state, lines });
  },
  remove(key: string) {
    setState({ ...state, lines: state.lines.filter((l) => l.key !== key) });
  },
  setOpen(open: boolean) {
    setState({ ...state, open });
  },
};

export function useCart() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
  const count = snapshot.lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = snapshot.lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const savings = snapshot.lines.reduce(
    (n, l) => n + (l.compareAtPrice ? (l.compareAtPrice - l.price) * l.quantity : 0),
    0,
  );
  return { ...snapshot, count, subtotal, savings };
}

/** Free delivery threshold shown across the storefront (BDT). */
export const FREE_DELIVERY_THRESHOLD = 3000;
