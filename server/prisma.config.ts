import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const rootEnvPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.env",
);

dotenv.config({ path: rootEnvPath });

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: env("MONGODB_URI"),
  },
});
