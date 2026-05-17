import * as dotenv from "dotenv";
import path from "path";

// 1. Resolve absolute physical root disk path to safeguard against shell navigation issues
const rootEnvPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: rootEnvPath });

import { defineConfig } from "prisma/config";

// 2. Extracted with a reliable inline fallback to prevent parsing crashes
const finalDatabaseUrl = process.env.DATABASE_URL;

if (!finalDatabaseUrl) {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: DATABASE_URL could not be resolved.\nTarget Path Scanned: ${rootEnvPath}`
  );
}

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  datasource: {
    url: finalDatabaseUrl,
  },
  migrations: {
    seed: 'pnpm ts-node -r dotenv/config --compiler-options {"module":"CommonJS"} src/prisma/seed.ts',
  },
});
