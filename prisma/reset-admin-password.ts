/**
 * Reset (or create) an admin login directly in the database.
 *   npm run admin:reset-password                          → admin from SEED_ADMIN_EMAIL
 *   npm run admin:reset-password -- --email you@x.com
 * Prompts for the new password with hidden input. For non-interactive use,
 * set NEW_ADMIN_PASSWORD instead (avoid putting it on the command line).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const MIN_LENGTH = 8;

function argValue(flag: string) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Reads a line from the terminal without echoing it. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      return reject(
        new Error("No interactive terminal — run this in a regular PowerShell/terminal window (or set NEW_ADMIN_PASSWORD)."),
      );
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") {
          // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function readPassword() {
  if (process.env.NEW_ADMIN_PASSWORD) return process.env.NEW_ADMIN_PASSWORD;
  const first = await promptHidden("New password: ");
  const second = await promptHidden("Repeat password: ");
  if (first !== second) throw new Error("Passwords don't match.");
  return first;
}

async function main() {
  const email = (argValue("--email") ?? process.env.SEED_ADMIN_EMAIL)?.trim().toLowerCase();
  if (!email) throw new Error("Pass --email or set SEED_ADMIN_EMAIL in .env.");

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    console.log(`Resetting password for ${email}`);
    const password = await readPassword();
    if (password.length < MIN_LENGTH) throw new Error(`Password must be at least ${MIN_LENGTH} characters.`);

    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    // Also re-activates the account and ensures it can reach /admin.
    await db.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN", isActive: true },
      create: { email, name: "Ribat Admin", passwordHash, role: "ADMIN" },
    });
    console.log(existing ? `✔ Password updated for ${email}` : `✔ Created admin ${email}`);
    console.log("  Works immediately on every deployment using this database (e.g. Vercel).");
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(`✖ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
