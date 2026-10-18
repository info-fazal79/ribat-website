import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import { authConfig } from "./config";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    // Admin / staff login. Customer phone-OTP login will be added separately.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Dev-only login that works before a database is set up.
        // Never active in production builds or when the env vars are unset.
        if (
          process.env.NODE_ENV !== "production" &&
          process.env.DEV_ADMIN_EMAIL &&
          process.env.DEV_ADMIN_PASSWORD &&
          parsed.data.email.toLowerCase() === process.env.DEV_ADMIN_EMAIL.toLowerCase() &&
          parsed.data.password === process.env.DEV_ADMIN_PASSWORD
        ) {
          return {
            id: "dev-admin",
            name: "Dev Admin",
            email: process.env.DEV_ADMIN_EMAIL,
            image: null,
            role: "ADMIN",
          };
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
