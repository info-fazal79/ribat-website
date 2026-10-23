import type { HomeSection } from "@/lib/validations/homepage";

/** postMessage protocol between the Homepage Builder and its preview iframe (same origin only). */
export type ToPreview =
  | { type: "ribat:sections"; sections: HomeSection[]; selectedId: string | null }
  | { type: "ribat:scroll-to"; id: string };

export type FromPreview = { type: "ribat:ready" } | { type: "ribat:select"; id: string };

export const isMessage = <T extends { type: string }>(data: unknown, types: T["type"][]): data is T =>
  typeof data === "object" && data !== null && "type" in data && types.includes((data as { type: string }).type);
