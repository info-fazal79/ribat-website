import { NextResponse } from "next/server";
import { searchProducts } from "@/server/services/catalog";

/** Live product search for the storefront header: GET /api/search?q=panjabi */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: await searchProducts(q) });
}
