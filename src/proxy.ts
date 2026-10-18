import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";

// Optimistic auth gate using the edge-safe config (no DB access).
// Real authorization happens in src/server/auth/guards.ts.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
