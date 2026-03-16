import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCoverageMap } from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";
import reports from "istanbul-reports";
import v8toIstanbul from "v8-to-istanbul";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const coverageDir = path.join(repoRoot, "coverage");
const testResultsDir = path.join(repoRoot, "test-results");
const coverageFileName = "playwright-js-coverage.json";

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resolvedPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(resolvedPath)));
      continue;
    }

    if (entry.isFile() && entry.name === coverageFileName) {
      files.push(resolvedPath);
    }
  }

  return files;
}

function toBundlePath(urlValue) {
  let parsedUrl;

  try {
    parsedUrl = new URL(urlValue);
  } catch {
    return null;
  }

  if (
    !parsedUrl.pathname.startsWith("/_next/") ||
    !parsedUrl.pathname.endsWith(".js")
  ) {
    return null;
  }

  return path.join(
    repoRoot,
    ".next",
    parsedUrl.pathname.replace(/^\/_next\//, ""),
  );
}

function normalizeSourcePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const prefixes = [
    "webpack://_N_E/",
    "webpack://",
    "webpack-internal:///",
    "file://",
  ];

  let stripped = normalized;
  for (const prefix of prefixes) {
    if (stripped.startsWith(prefix)) {
      stripped = stripped.slice(prefix.length);
    }
  }

  stripped = stripped.replace(/^\.?\//, "");

  // Normalize path to app/ or lib/ directory by checking path segments
  const segments = stripped.split("/");
  let appOrLibIndex = segments.indexOf("app");
  if (appOrLibIndex === -1) {
    appOrLibIndex = segments.indexOf("lib");
  }

  if (appOrLibIndex !== -1) {
    const relevantPath = segments.slice(appOrLibIndex).join("/");
    return path.join(repoRoot, relevantPath);
  }

  const appIndex = stripped.indexOf("app/");
  if (appIndex >= 0) {
    return path.join(repoRoot, stripped.slice(appIndex));
  }

  const libIndex = stripped.indexOf("lib/");
  if (libIndex >= 0) {
    return path.join(repoRoot, stripped.slice(libIndex));
  }

  const resolved = path.isAbsolute(stripped)
    ? stripped
    : path.join(repoRoot, stripped);

  return resolved;
}

function shouldKeepSource(normalizedPath) {
  const repoRelative = path.relative(repoRoot, normalizedPath);
  if (repoRelative.startsWith("..")) {
    return false;
  }

  if (
    !(
      repoRelative.startsWith(`app${path.sep}`) ||
      repoRelative.startsWith(`lib${path.sep}`)
    )
  ) {
    return false;
  }

  if (
    repoRelative.includes(`${path.sep}node_modules${path.sep}`) ||
    repoRelative.includes(`${path.sep}.next${path.sep}`) ||
    repoRelative.includes(`${path.sep}tests${path.sep}`)
  ) {
    return false;
  }

  return /\.(tsx?|jsx?)$/.test(repoRelative);
}

async function main() {
  let coverageFiles = [];

  try {
    coverageFiles = await walk(testResultsDir);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(
        "No Playwright test results directory found. Run the Playwright coverage suite first.",
      );
    }
    throw error;
  }

  if (coverageFiles.length === 0) {
    console.log(`[Merge] No coverage files found in: ${testResultsDir}`);
    throw new Error("No Playwright browser coverage files were found.");
  }

  console.log(
    `[Merge] Found ${coverageFiles.length} coverage files to process`,
  );
  const rawCoverageMap = createCoverageMap({});
  let processedEntries = 0;

  for (const coverageFile of coverageFiles) {
    console.log(`[Merge] Processing: ${coverageFile}`);
    const payload = JSON.parse(await fs.readFile(coverageFile, "utf8"));
    const entries = Array.isArray(payload) ? payload : payload.coverage || [];
    console.log(`[Merge]   Found ${entries.length} entries in ${coverageFile}`);

    for (const entry of entries) {
      const bundlePath = toBundlePath(entry.url);
      if (!bundlePath) {
        continue;
      }

      try {
        await fs.access(bundlePath);
      } catch {
        continue;
      }

      const converter = v8toIstanbul(bundlePath, 0, {
        source: entry.source,
      });

      await converter.load();
      converter.applyCoverage(entry.functions);
      rawCoverageMap.merge(converter.toIstanbul());
      processedEntries += 1;
    }
  }

  if (processedEntries === 0) {
    console.log(
      `[Merge] WARNING: Processed ${processedEntries} coverage entries`,
    );
    throw new Error(
      "Playwright browser coverage did not produce any mergeable Next.js bundle entries.",
    );
  }

  console.log(
    `[Merge] Successfully processed ${processedEntries} coverage entries`,
  );

  const normalizedCoverageMap = createCoverageMap({});

  for (const sourcePath of rawCoverageMap.files()) {
    const normalizedPath = normalizeSourcePath(sourcePath);
    if (!shouldKeepSource(normalizedPath)) {
      continue;
    }

    const fileCoverage = rawCoverageMap.fileCoverageFor(sourcePath).toJSON();
    fileCoverage.path = normalizedPath;
    normalizedCoverageMap.merge({
      [normalizedPath]: fileCoverage,
    });
  }

  if (normalizedCoverageMap.files().length === 0) {
    throw new Error(
      "Playwright browser coverage did not map cleanly to app/ or lib/ source files.",
    );
  }

  await fs.mkdir(coverageDir, { recursive: true });

  const reportContext = libReport.createContext({
    dir: coverageDir,
    coverageMap: normalizedCoverageMap,
  });

  reports
    .create("json", { file: "coverage-final.json" })
    .execute(reportContext);
  reports
    .create("json-summary", { file: "coverage-summary.json" })
    .execute(reportContext);
  reports.create("lcovonly", { file: "lcov.info" }).execute(reportContext);

  const lcovPath = path.join(coverageDir, "lcov.info");
  console.log(`[Merge] ✓ Generated coverage report at ${lcovPath}`);
  console.log(
    `[Merge] ✓ Coverage includes ${normalizedCoverageMap.files().length} source files`,
  );

  console.log(
    JSON.stringify(
      {
        coverageFiles: coverageFiles.length,
        processedEntries,
        mappedSources: normalizedCoverageMap.files().length,
        outputDir: path.relative(repoRoot, coverageDir),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
