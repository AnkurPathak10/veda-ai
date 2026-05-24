import path from "node:path";
import { fileURLToPath } from "node:url";

/** Always resolve to `server/uploads`, regardless of where Node was started from. */
const SERVER_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(SERVER_ROOT, "uploads");

export function getUploadFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}
