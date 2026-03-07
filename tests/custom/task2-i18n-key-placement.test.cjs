const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const SAMPLE_LIMIT = 3;

function takeSample(items, mapper, limit = SAMPLE_LIMIT) {
  return Array.isArray(items) ? items.slice(0, limit).map(mapper) : [];
}

function summarizeStringIssue(issue) {
  return {
    key: issue.key,
    expectedPlacement: issue.expectedPlacement,
    locales: issue.locales,
    occurrences: Array.isArray(issue.occurrences) ? issue.occurrences.slice(0, SAMPLE_LIMIT) : [],
  };
}

function summarizeTermIssue(issue) {
  return {
    category: issue.category,
    value: issue.value,
    expectedPlacement: issue.expectedPlacement,
    locales: issue.locales,
    occurrences: Array.isArray(issue.occurrences) ? issue.occurrences.slice(0, SAMPLE_LIMIT) : [],
  };
}

function summarizeDivergentIssue(issue) {
  return {
    key: issue.key,
    placementsByLocale: issue.placementsByLocale,
  };
}

function summarizeDuplicateIssue(issue) {
  return {
    locale: issue.locale,
    key: issue.key,
    placements: issue.placements,
    preferredPlacementsByUsage: issue.preferredPlacementsByUsage,
    usageOccurrences: Array.isArray(issue.usageOccurrences) ? issue.usageOccurrences.slice(0, SAMPLE_LIMIT) : [],
    termUsageCategories: Array.isArray(issue.termUsageCategories) ? issue.termUsageCategories.slice(0, SAMPLE_LIMIT) : [],
  };
}

function buildFailureSummary(result) {
  const summary = {
    status: result.status,
    checkedLocales: result.checkedLocales,
    blockingCounts: {
      missingStringKeys: result.missingStringKeys.length,
      misplacedUiKeys: result.misplacedUiKeys.length,
      missingTermKeys: result.missingTermKeys.length,
      misplacedTermKeys: result.misplacedTermKeys.length,
      divergentPlacements: result.divergentPlacements.length,
    },
    warningCounts: {
      duplicatePlacements: result.duplicatePlacements.length,
      unusedStrings: result.unusedI18nKeys?.strings?.length || 0,
      unusedTerms: result.unusedI18nKeys?.terms?.length || 0,
    },
    samples: {
      missingStringKeys: takeSample(result.missingStringKeys, summarizeStringIssue),
      misplacedUiKeys: takeSample(result.misplacedUiKeys, summarizeStringIssue),
      missingTermKeys: takeSample(result.missingTermKeys, summarizeTermIssue),
      misplacedTermKeys: takeSample(result.misplacedTermKeys, summarizeTermIssue),
      divergentPlacements: takeSample(result.divergentPlacements, summarizeDivergentIssue),
      duplicatePlacements: takeSample(result.duplicatePlacements, summarizeDuplicateIssue),
    },
    note:
      "设置 I18N_VERBOSE=1 可输出完整诊断 JSON；默认仅显示前 3 条样例与计数。",
  };

  if (process.env.I18N_VERBOSE === "1") {
    summary.fullResult = result;
  }

  return summary;
}

function buildWarningSummary(result) {
  const warningCounts = {
    duplicatePlacements: result.duplicatePlacements.length,
    unusedStrings: result.unusedI18nKeys?.strings?.length || 0,
    unusedTerms: result.unusedI18nKeys?.terms?.length || 0,
  };
  const hasWarnings = Object.values(warningCounts).some((count) => count > 0);
  if (!hasWarnings) return null;

  const summary = {
    warningCounts,
    samples: {
      duplicatePlacements: takeSample(result.duplicatePlacements, summarizeDuplicateIssue),
      unusedStrings: takeSample(result.unusedI18nKeys?.strings || [], (issue) => issue.key),
      unusedTerms: takeSample(result.unusedI18nKeys?.terms || [], (issue) => `${issue.category}:${issue.key}`),
    },
    note: "存在 warning，但不阻断测试；如需完整诊断可设置 I18N_VERBOSE=1。",
  };

  if (process.env.I18N_VERBOSE === "1") {
    summary.fullResult = result;
  }

  return summary;
}

(async () => {
  const root = path.resolve(__dirname, "../..");
  const scriptPath = path.join(root, "scripts/verify-i18n-key-placement.mjs");
  const { verifyI18nKeyPlacement } = await import(pathToFileURL(scriptPath).href);
  const result = await verifyI18nKeyPlacement({ rootDir: root });
  const failureSummary = buildFailureSummary(result);

  assert.equal(
    result.status,
    "ok",
    `i18n key placement should be ok:\n${JSON.stringify(failureSummary, null, 2)}`
  );

  const warningSummary = buildWarningSummary(result);
  if (warningSummary) {
    console.log(`task2-i18n-key-placement: ok (with warnings)\n${JSON.stringify(warningSummary, null, 2)}`);
    return;
  }

  console.log("task2-i18n-key-placement: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
