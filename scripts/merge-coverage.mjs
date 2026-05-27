#!/usr/bin/env node
/**
 * Merge coverage from multiple sources into a single Istanbul report.
 *
 * Inputs (any subset can be missing; the script gracefully skips):
 *   coverage/coverage-final.json         ← from vitest unit + storybook
 *   coverage-e2e/raw/*.json              ← from Playwright window.__coverage__ dumps
 *
 * Output:
 *   coverage-merged/coverage-final.json    (raw merged map, istanbul JSON)
 *   coverage-merged/coverage-summary.json  (per-file + totals, the shape
 *                                           davelosert/vitest-coverage-report-action reads)
 *   coverage-merged/lcov.info              (codecov/sonar interop)
 *   coverage-merged/lcov-report/           (browseable HTML)
 *
 * The vitest-coverage-report-action expects `coverage-summary.json` and
 * `coverage-final.json` to live in the same directory — that's why we write
 * both into coverage-merged/ regardless of which source they came from.
 */
import { existsSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import libCoverage from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";
import reports from "istanbul-reports";

const ROOT = process.cwd();
const UNIT_FINAL = join(ROOT, "coverage", "coverage-final.json");
const E2E_RAW_DIR = join(ROOT, "coverage-e2e", "raw");
const OUT_DIR = join(ROOT, "coverage-merged");

mkdirSync(OUT_DIR, { recursive: true });

const map = libCoverage.createCoverageMap({});

let unitFiles = 0;
if (existsSync(UNIT_FINAL)) {
  const data = JSON.parse(readFileSync(UNIT_FINAL, "utf8"));
  map.merge(data);
  unitFiles = Object.keys(data).length;
  console.log(`[merge-coverage] unit: merged ${unitFiles} file(s) from ${UNIT_FINAL}`);
} else {
  console.log(`[merge-coverage] unit: ${UNIT_FINAL} not found, skipping`);
}

let e2eRawFiles = 0;
let e2eFiles = 0;
if (existsSync(E2E_RAW_DIR)) {
  for (const fname of readdirSync(E2E_RAW_DIR)) {
    if (!fname.endsWith(".json")) continue;
    const data = JSON.parse(readFileSync(join(E2E_RAW_DIR, fname), "utf8"));
    map.merge(data);
    e2eRawFiles++;
    e2eFiles = Object.keys(map.data).length;
  }
  console.log(
    `[merge-coverage] e2e: merged ${e2eRawFiles} raw dump(s); covered files now: ${e2eFiles}`,
  );
} else {
  console.log(`[merge-coverage] e2e: ${E2E_RAW_DIR} not found, skipping`);
}

if (unitFiles === 0 && e2eRawFiles === 0) {
  console.error("[merge-coverage] No coverage sources found — nothing to merge.");
  process.exit(1);
}

// Generate the reports. `dir` is the output root for every reporter.
const context = libReport.createContext({
  dir: OUT_DIR,
  defaultSummarizer: "nested",
  coverageMap: map,
});

// json-summary: per-file totals + grand total. This is what the PR comment
// action reads.
reports.create("json-summary").execute(context);
// json: raw coverage map, identical shape to vitest's coverage-final.json,
// so the PR comment can do per-file diffing.
reports.create("json", { file: "coverage-final.json" }).execute(context);
// lcov: standard interop format (codecov, sonar, etc.) + browseable HTML.
reports.create("lcov").execute(context);

console.log(`[merge-coverage] Wrote merged report to ${OUT_DIR}/`);
