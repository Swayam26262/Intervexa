// Copies Excalidraw's fonts into public/ so the whiteboard doesn't depend on a CDN.
// Runs on `npm install` (postinstall). The output directory is git-ignored.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/@excalidraw/excalidraw/dist/prod/fonts");
const dest = join(root, "public/excalidraw-assets/fonts");
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("Copied Excalidraw fonts to public/excalidraw-assets/fonts");
}
