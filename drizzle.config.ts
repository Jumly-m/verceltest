import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if(!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
}

export default defineConfig({
  out: './drizzle',
  // 👇 Include both schema files
  schema: [ "./src/db/schema.ts"], // 👇 Include both migrations
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? '',
    authToken: process.env.TURSO_AUTH_TOKEN ?? '',
  },
});
