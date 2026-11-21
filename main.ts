// VICE HEAT — make.fun entry point.
//
// Copies the web app (app/) and the screenshots (screenshots/) into the
// output directory and writes the submission dossier (dossier.json) using
// the vendored make.fun library. The dossier bytes returned by
// buildDossier() are canonical JSON and are written to disk untouched.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// Resolve this program's own directory so relative paths work no matter
// where the process is launched from.
const programDirectory = dirname(fileURLToPath(import.meta.url));
const appSourceDirectory = join(programDirectory, "app");
const screenshotsSourceDirectory = join(programDirectory, "screenshots");

// The make.fun runner mounts the output directory; fall back to /output.
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Guard: the entry must ship 3–4 screenshot images (JPEG or PNG). Fail
// loudly before copying anything if the screenshots are missing, so a
// broken entry is never packaged.
function assertScreenshotsPresent(directory: string): string[] {
  if (!existsSync(directory)) {
    throw new Error(`screenshots directory not found: ${directory}`);
  }
  const imageFiles = readdirSync(directory).filter((name) =>
    /\.(jpe?g|png)$/i.test(name),
  );
  if (imageFiles.length < 3 || imageFiles.length > 4) {
    throw new Error(
      `expected 3-4 screenshot images in ${directory}, found ${imageFiles.length}`,
    );
  }
  return imageFiles;
}

// Guard: the app source must contain its entry page before we package
// anything — a dossier built from a hollow app directory is worthless.
function assertAppSourcePresent(directory: string): void {
  const entryPage = join(directory, "index.html");
  if (!existsSync(entryPage)) {
    throw new Error(`app entry page not found: ${entryPage}`);
  }
}

function copyTreeIntoOutput(sourceDirectory: string, targetName: string): void {
  const targetDirectory = join(outputDirectory, targetName);
  cpSync(sourceDirectory, targetDirectory, { recursive: true });
  console.log(`copied ${sourceDirectory} -> ${targetDirectory}`);
}

function main(): void {
  assertAppSourcePresent(appSourceDirectory);
  console.log(`app guard passed: ${appSourceDirectory} contains index.html`);
  const screenshotFiles = assertScreenshotsPresent(screenshotsSourceDirectory);
  console.log(`screenshots guard passed: ${screenshotFiles.length} image(s) present`);
  for (const name of screenshotFiles) console.log(`  - screenshots/${name}`);

  mkdirSync(outputDirectory, { recursive: true });
  copyTreeIntoOutput(appSourceDirectory, "app");
  copyTreeIntoOutput(screenshotsSourceDirectory, "screenshots");

  // buildDossier returns the canonical dossier JSON as raw bytes; write
  // them directly without re-serialising.
  const dossierBytes = buildDossier(outputDirectory, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  const dossierPath = join(outputDirectory, "dossier.json");
  writeFileSync(dossierPath, dossierBytes);

  console.log("VICE HEAT dossier build complete:");
  console.log(`  output directory : ${outputDirectory}`);
  console.log(`  dossier          : ${dossierPath} (${dossierBytes.length} bytes)`);
  console.log(`  app              : copied from ${appSourceDirectory}`);
  console.log(`  screenshots      : ${screenshotFiles.length} file(s) copied`);
}

main();
