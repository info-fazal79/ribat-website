import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt imports).
 * Shared by `src/proxy.ts` for optimistic route checks and by the
 * full config in `./index.ts`.
 */
export const authConfig = {
  // Required outside Vercel (VPS / behind nginx / `next start`).
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  // Credentials provider requires JWT sessions.
  session: { strategy: "jwt" },
  providers: [], // added in ./index.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        const role = auth?.user?.role;
        return role === "ADMIN" || role === "STAFF";
      }
      if (pathname.startsWith("/account")) {
        return !!auth?.user;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
