import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const i18nDirRelative = "data/i18n";
const runtimeScanRoots = ["js"];
const referenceScanRoots = ["js", "data"];
const referenceRootFiles = ["index.html"];
const supportedExtensions = new Set([".js", ".mjs", ".cjs", ".html"]);
const tCallPattern = /(?<![\w$.])(?:state\.)?t\(\s*(["'])([^"']+)\1/g;
const tTermCallPattern = /(?<![\w$.])(?:state\.)?tTerm\(\s*(["'])([^"']+)\1\s*,\s*(["'])([^"']+)\3/g;
const placementPrefix = "terms.";
const missingCandidateNote =
  "unusedI18nKeys are warning-only candidates based on static references; dynamic runtime lookups may still exist.";

const sortObject = (value) => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObject(value[key])])
  );
};

const cliVerboseArg = "--verbose";
const describePlacements = (placements) => (Array.isArray(placements) && placements.length ? placements.join(" | ") : "(missing)");
const describeLocaleIssues = (locales) =>
  (Array.isArray(locales) ? locales : []).map(({ locale, actualPlacements }) =>
    `${locale}: ${describePlacements(actualPlacements)}`
  );
const describeStringIssue = (issue) => ({
  key: issue.key,
  locales: describeLocaleIssues(issue.locales),
  occurrences: Array.isArray(issue.occurrences) ? issue.occurrences : [],
});
const describeTermIssue = (issue) => ({
  key: `${issue.category}:${issue.value}`,
  locales: describeLocaleIssues(issue.locales),
  occurrences: Array.isArray(issue.occurrences) ? issue.occurrences : [],
});
const describeDivergentIssue = (issue) => ({
  key: issue.key,
  placementsByLocale: Object.fromEntries(
    Object.entries(issue.placementsByLocale || {}).map(([locale, placements]) => [locale, describePlacements(placements)])
  ),
});
const describeDuplicateIssue = (issue) => ({
  key: `${issue.locale}: ${issue.key}`,
  placements: describePlacements(issue.placements),
  preferredPlacementsByUsage: describePlacements(issue.preferredPlacementsByUsage),
});
const describeUnusedTerm = (issue) => `${issue.category}:${issue.key}`;
const hasProblemEntries = (value) => Array.isArray(value) && value.length > 0;
const omitEmptyGroups = (groups) =>
  Object.fromEntries(Object.entries(groups).filter(([, value]) => hasProblemEntries(value)));

function buildCliSummary(result) {
  const errors = omitEmptyGroups({
    missingStringKeys: result.missingStringKeys.map(describeStringIssue),
    misplacedUiKeys: result.misplacedUiKeys.map(describeStringIssue),
    missingTermKeys: result.missingTermKeys.map(describeTermIssue),
    misplacedTermKeys: result.misplacedTermKeys.map(describeTermIssue),
    divergentPlacements: result.divergentPlacements.map(describeDivergentIssue),
  });
  const warnings = omitEmptyGroups({
    duplicatePlacements: result.duplicatePlacements.map(describeDuplicateIssue),
    unusedStrings: result.unusedI18nKeys?.strings?.map((issue) => issue.key) || [],
    unusedTerms: result.unusedI18nKeys?.terms?.map(describeUnusedTerm) || [],
  });

  const summary = { status: result.status };
  if (Object.keys(errors).length) summary.errors = errors;
  if (Object.keys(warnings).length) summary.warnings = warnings;
  if (!Object.keys(errors).length && !Object.keys(warnings).length) {
    summary.message = "No i18n placement issues or warning keys.";
  }
  return summary;
}

const toPosix = (value) => String(value || "").replace(/\\/g, "/");
const primitiveString = (value) => typeof value === "string";

function lineNumberFromIndex(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

async function walkFiles(dirPath, options = {}) {
  const { skipDirs = [] } = options;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.some((skipDir) => path.resolve(skipDir) === path.resolve(fullPath))) continue;
      files.push(...(await walkFiles(fullPath, options)));
      continue;
    }
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function collectFilesFromRoots(rootDir, relativeRoots, options = {}) {
  const files = [];
  for (const relativeRoot of relativeRoots) {
    const targetPath = path.join(rootDir, relativeRoot);
    const discovered = await walkFiles(targetPath, options);
    for (const filePath of discovered) {
      if (!supportedExtensions.has(path.extname(filePath))) continue;
      files.push(filePath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function buildPlacementMap(strings, terms) {
  const placements = new Map();
  const addPlacement = (key, placement) => {
    const normalizedKey = String(key || "");
    if (!normalizedKey) return;
    if (!placements.has(normalizedKey)) placements.set(normalizedKey, new Set());
    placements.get(normalizedKey).add(placement);
  };

  Object.keys(strings || {}).forEach((key) => addPlacement(key, "strings"));

  const walkTerms = (node, placement) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    Object.entries(node).forEach(([key, value]) => {
      if (primitiveString(value)) {
        addPlacement(key, placement);
        return;
      }
      if (value && typeof value === "object") {
        walkTerms(value, `${placement}.${key}`);
      }
    });
  };

  walkTerms(terms, "terms");
  return placements;
}

function collectTermEntries(node, placement = "terms", entries = []) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return entries;
  Object.entries(node).forEach(([key, value]) => {
    const nextPlacement = `${placement}.${key}`;
    if (primitiveString(value)) {
      entries.push({
        key,
        placement,
        category: placement.startsWith(placementPrefix) ? placement.slice(placementPrefix.length) : placement,
      });
      return;
    }
    if (value && typeof value === "object") {
      collectTermEntries(value, nextPlacement, entries);
    }
  });
  return entries;
}

function normalizePlacementList(set) {
  return Array.from(set || []).sort();
}

function pushUsage(map, compositeKey, usage) {
  if (!map.has(compositeKey)) map.set(compositeKey, []);
  map.get(compositeKey).push(usage);
}

function buildTermUsageByValue(termUsages) {
  const usageByValue = new Map();
  for (const [compositeKey, occurrences] of termUsages.entries()) {
    const [category, value] = compositeKey.split("\u0000");
    if (!usageByValue.has(value)) usageByValue.set(value, new Set());
    usageByValue.get(value).add(category);
    if (!usageByValue.has(`${value}\u0000occurrences`)) {
      usageByValue.set(`${value}\u0000occurrences`, []);
    }
    usageByValue.get(`${value}\u0000occurrences`).push(...occurrences);
  }
  return usageByValue;
}

async function collectRuntimeUsages(rootDir) {
  const files = await collectFilesFromRoots(rootDir, runtimeScanRoots);
  const stringUsages = new Map();
  const termUsages = new Map();

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const relativePath = toPosix(path.relative(rootDir, filePath));

    for (const match of source.matchAll(tCallPattern)) {
      const key = match[2];
      if (!key) continue;
      pushUsage(stringUsages, key, {
        file: relativePath,
        line: lineNumberFromIndex(source, match.index || 0),
        call: `t(${match[1]}${key}${match[1]})`,
        kind: "t",
      });
    }

    for (const match of source.matchAll(tTermCallPattern)) {
      const category = match[2];
      const value = match[4];
      if (!category || !value) continue;
      pushUsage(termUsages, `${category}\u0000${value}`, {
        file: relativePath,
        line: lineNumberFromIndex(source, match.index || 0),
        call: `tTerm(${match[1]}${category}${match[1]}, ${match[3]}${value}${match[3]})`,
        kind: "tTerm",
        category,
        value,
      });
    }
  }

  return { files, stringUsages, termUsages };
}

async function loadLocaleData(rootDir, fileName) {
  const locale = path.basename(fileName, ".js");
  const filePath = path.join(rootDir, i18nDirRelative, fileName);
  const source = await fs.readFile(filePath, "utf8");
  const sandbox = { window: { I18N: {} } };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: filePath });
  const localeTable = sandbox.window?.I18N?.[locale];
  if (!localeTable || typeof localeTable !== "object") {
    throw new Error(
      `Locale file did not register window.I18N[${locale}]: ${toPosix(path.relative(rootDir, filePath))}`
    );
  }

  const strings = localeTable.strings && typeof localeTable.strings === "object" ? localeTable.strings : {};
  const terms = localeTable.terms && typeof localeTable.terms === "object" ? localeTable.terms : {};
  return {
    locale,
    filePath,
    strings,
    terms,
    termEntries: collectTermEntries(terms),
    placements: buildPlacementMap(strings, terms),
  };
}

function buildPlacementsByLocale(localeDataList, key) {
  return Object.fromEntries(
    localeDataList.map((localeData) => [localeData.locale, normalizePlacementList(localeData.placements.get(key))])
  );
}

function summarizeOccurrences(occurrences) {
  return (occurrences || []).map((item) => `${item.file}:${item.line}`);
}

function findRawReferenceFilesFactory(referenceSources) {
  const cache = new Map();
  return (key, maxResults = 12) => {
    const normalizedKey = String(key || "");
    if (!normalizedKey) return [];
    const cacheKey = `${normalizedKey}\u0000${maxResults}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const matches = [];
    for (const entry of referenceSources) {
      if (!entry.source.includes(normalizedKey)) continue;
      matches.push(entry.file);
      if (matches.length >= maxResults) break;
    }
    cache.set(cacheKey, matches);
    return matches;
  };
}

async function collectReferenceSources(rootDir) {
  const skipI18nDir = path.join(rootDir, i18nDirRelative);
  const files = await collectFilesFromRoots(rootDir, referenceScanRoots, { skipDirs: [skipI18nDir] });
  const rootFiles = referenceRootFiles
    .map((relativePath) => path.join(rootDir, relativePath))
    .filter((filePath) => supportedExtensions.has(path.extname(filePath)));
  const allFiles = Array.from(new Set([...files, ...rootFiles])).sort((left, right) => left.localeCompare(right));
  const sources = [];
  for (const filePath of allFiles) {
    const source = await fs.readFile(filePath, "utf8");
    sources.push({ file: toPosix(path.relative(rootDir, filePath)), source });
  }
  return sources;
}

function buildStringIssue(key, occurrences, localeDataList, kind) {
  const placementsByLocale = buildPlacementsByLocale(localeDataList, key);
  const locales = localeDataList
    .filter((localeData) => {
      const placements = placementsByLocale[localeData.locale] || [];
      return kind === "missing"
        ? placements.length === 0
        : placements.length > 0 && !placements.includes("strings");
    })
    .map((localeData) => ({
      locale: localeData.locale,
      actualPlacements: placementsByLocale[localeData.locale] || [],
    }));

  return {
    key,
    expectedPlacement: "strings",
    occurrences: summarizeOccurrences(occurrences),
    usageKinds: Array.from(new Set((occurrences || []).map((item) => item.kind))).sort(),
    placementsByLocale: sortObject(placementsByLocale),
    locales,
  };
}

function buildTermIssue(category, value, occurrences, localeDataList, kind) {
  const expectedPlacement = `terms.${category}`;
  const placementsByLocale = buildPlacementsByLocale(localeDataList, value);
  const locales = localeDataList
    .filter((localeData) => {
      const placements = placementsByLocale[localeData.locale] || [];
      return kind === "missing" ? placements.length === 0 : !placements.includes(expectedPlacement);
    })
    .map((localeData) => ({
      locale: localeData.locale,
      actualPlacements: placementsByLocale[localeData.locale] || [],
    }));

  return {
    category,
    value,
    expectedPlacement,
    occurrences: summarizeOccurrences(occurrences),
    placementsByLocale: sortObject(placementsByLocale),
    locales,
  };
}

function collectDivergentPlacements(localeDataList) {
  const allKeys = new Set();
  localeDataList.forEach((localeData) => {
    localeData.placements.forEach((_, key) => allKeys.add(key));
  });

  const issues = [];
  Array.from(allKeys)
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      const placementsByLocale = buildPlacementsByLocale(localeDataList, key);
      const nonEmptySignatures = localeDataList
        .map((localeData) => (placementsByLocale[localeData.locale] || []).join("|"))
        .filter(Boolean);
      if (nonEmptySignatures.length <= 1) return;
      const uniqueNonEmptySignatures = new Set(nonEmptySignatures);
      if (uniqueNonEmptySignatures.size <= 1) return;
      issues.push({
        key,
        placementsByLocale: sortObject(placementsByLocale),
      });
    });

  return issues;
}

function collectDuplicatePlacements(localeDataList, stringUsages, termUsageByValue, findRawReferenceFiles) {
  const issues = [];
  localeDataList.forEach((localeData) => {
    Array.from(localeData.placements.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([key, placementSet]) => {
        const placements = normalizePlacementList(placementSet);
        if (placements.length <= 1) return;
        const stringOccurrences = stringUsages.get(key) || [];
        const termCategories = Array.from(termUsageByValue.get(key) || []).sort();
        const preferredPlacements = [];
        if (stringOccurrences.length) preferredPlacements.push("strings");
        termCategories.forEach((category) => preferredPlacements.push(`terms.${category}`));
        issues.push({
          locale: localeData.locale,
          key,
          placements,
          localeFile: toPosix(path.relative(root, localeData.filePath)),
          preferredPlacementsByUsage: Array.from(new Set(preferredPlacements)).sort(),
          usageOccurrences: summarizeOccurrences(stringOccurrences),
          termUsageCategories: termCategories,
          rawReferenceFiles: findRawReferenceFiles(key),
        });
      });
  });
  return issues;
}

function collectUnusedI18nKeys(localeDataList, stringUsages, termUsages, findRawReferenceFiles) {
  const unusedStrings = [];
  const unusedTerms = [];

  const allStringKeys = new Set();
  const allTermCompositeKeys = new Set();

  localeDataList.forEach((localeData) => {
    Object.keys(localeData.strings || {}).forEach((key) => allStringKeys.add(key));
    (localeData.termEntries || []).forEach(({ category, key }) => {
      allTermCompositeKeys.add(`${category}\u0000${key}`);
    });
  });

  Array.from(allStringKeys)
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      const stringOccurrences = stringUsages.get(key) || [];
      const rawReferenceFiles = findRawReferenceFiles(key);
      if (stringOccurrences.length > 0 || rawReferenceFiles.length > 0) return;
      unusedStrings.push({
        key,
        placementsByLocale: sortObject(buildPlacementsByLocale(localeDataList, key)),
        rawReferenceFiles,
      });
    });

  Array.from(allTermCompositeKeys)
    .sort((left, right) => left.localeCompare(right))
    .forEach((compositeKey) => {
      const [category, key] = compositeKey.split("\u0000");
      const termOccurrences = termUsages.get(compositeKey) || [];
      const rawReferenceFiles = findRawReferenceFiles(key);
      if (termOccurrences.length > 0 || rawReferenceFiles.length > 0) return;
      unusedTerms.push({
        category,
        key,
        expectedPlacement: `terms.${category}`,
        placementsByLocale: sortObject(buildPlacementsByLocale(localeDataList, key)),
        rawReferenceFiles,
      });
    });

  return {
    note: missingCandidateNote,
    strings: unusedStrings,
    terms: unusedTerms,
  };
}

export async function verifyI18nKeyPlacement({ rootDir = root } = {}) {
  const i18nDir = path.join(rootDir, i18nDirRelative);
  const localeFiles = (await fs.readdir(i18nDir))
    .filter((fileName) => fileName.endsWith(".js"))
    .sort((left, right) => left.localeCompare(right));

  const localeDataList = [];
  for (const fileName of localeFiles) {
    localeDataList.push(await loadLocaleData(rootDir, fileName));
  }

  const { files: runtimeFiles, stringUsages, termUsages } = await collectRuntimeUsages(rootDir);
  const referenceSources = await collectReferenceSources(rootDir);
  const findRawReferenceFiles = findRawReferenceFilesFactory(referenceSources);
  const termUsageByValue = buildTermUsageByValue(termUsages);

  const missingStringKeys = [];
  const misplacedUiKeys = [];
  const missingTermKeys = [];
  const misplacedTermKeys = [];

  Array.from(stringUsages.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, occurrences]) => {
      const placementsByLocale = buildPlacementsByLocale(localeDataList, key);
      const hasMissing = localeDataList.some((localeData) => (placementsByLocale[localeData.locale] || []).length === 0);
      const hasMisplaced = localeDataList.some((localeData) => {
        const placements = placementsByLocale[localeData.locale] || [];
        return placements.length > 0 && !placements.includes("strings");
      });
      if (hasMissing) missingStringKeys.push(buildStringIssue(key, occurrences, localeDataList, "missing"));
      if (hasMisplaced) misplacedUiKeys.push(buildStringIssue(key, occurrences, localeDataList, "misplaced"));
    });

  Array.from(termUsages.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([compositeKey, occurrences]) => {
      const [category, value] = compositeKey.split("\u0000");
      const expectedPlacement = `terms.${category}`;
      const placementsByLocale = buildPlacementsByLocale(localeDataList, value);
      const hasMissing = localeDataList.some((localeData) => (placementsByLocale[localeData.locale] || []).length === 0);
      const hasMisplaced = localeDataList.some((localeData) => {
        const placements = placementsByLocale[localeData.locale] || [];
        return placements.length > 0 && !placements.includes(expectedPlacement);
      });
      if (hasMissing) missingTermKeys.push(buildTermIssue(category, value, occurrences, localeDataList, "missing"));
      if (hasMisplaced) misplacedTermKeys.push(buildTermIssue(category, value, occurrences, localeDataList, "misplaced"));
    });

  const divergentPlacements = collectDivergentPlacements(localeDataList);
  const duplicatePlacements = collectDuplicatePlacements(
    localeDataList,
    stringUsages,
    termUsageByValue,
    findRawReferenceFiles
  );
  const unusedI18nKeys = collectUnusedI18nKeys(localeDataList, stringUsages, termUsages, findRawReferenceFiles);

  const hasIssues =
    missingStringKeys.length > 0 ||
    misplacedUiKeys.length > 0 ||
    missingTermKeys.length > 0 ||
    misplacedTermKeys.length > 0 ||
    divergentPlacements.length > 0;

  return {
    status: hasIssues ? "mismatch" : "ok",
    checkedLocales: localeDataList.map((localeData) => localeData.locale),
    checkedRuntimeFiles: runtimeFiles.map((filePath) => toPosix(path.relative(rootDir, filePath))),
    checkedReferenceFiles: referenceSources.map((entry) => entry.file),
    stats: {
      localeCount: localeDataList.length,
      runtimeFileCount: runtimeFiles.length,
      referenceFileCount: referenceSources.length,
      literalStringKeyCount: stringUsages.size,
      literalTermKeyCount: termUsages.size,
      duplicatePlacementWarningCount: duplicatePlacements.length,
      unusedStringWarningCount: unusedI18nKeys.strings.length,
      unusedTermWarningCount: unusedI18nKeys.terms.length,
    },
    missingStringKeys,
    misplacedUiKeys,
    missingTermKeys,
    misplacedTermKeys,
    divergentPlacements,
    duplicatePlacements,
    unusedI18nKeys,
  };
}

const run = async () => {
  const result = await verifyI18nKeyPlacement();
  const verbose = process.env.I18N_VERBOSE === "1" || process.argv.includes(cliVerboseArg);
  const payload = verbose ? sortObject(result) : buildCliSummary(result);
  const output = JSON.stringify(payload, null, 2);

  if (result.status === "ok") {
    console.log(output);
    return;
  }

  console.error(output);
  process.exitCode = 1;
};

if (path.resolve(process.argv[1] || "") === __filename) {
  run().catch((error) => {
    console.error(
      JSON.stringify(
        {
          status: "error",
          error: error?.message || String(error),
          stack: error?.stack || null,
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  });
}
