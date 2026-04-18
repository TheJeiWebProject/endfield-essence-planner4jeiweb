import i18nMessages from '@/data/i18n.json';
import type { PlannerState } from './types';

type PlannerLocale = PlannerState['lang'];

type I18nCatalog = Record<
  PlannerLocale,
  {
    strings?: Record<string, string>;
    terms?: Record<string, unknown>;
  }
>;

const catalog = i18nMessages as unknown as I18nCatalog;
const fallbackLocale: PlannerLocale = 'zh-CN';
const supportedLocales: PlannerLocale[] = ['zh-CN', 'zh-TW', 'en', 'ja'];
const langStorageKey = 'modern-planner-lang:v1';

export function getPlannerLangStorageKey(): string {
  return langStorageKey;
}

export function normalizePlannerLocale(value: string | null | undefined): PlannerLocale {
  if (value === 'zh-TW' || value === 'en' || value === 'ja' || value === 'zh-CN') {
    return value;
  }
  return fallbackLocale;
}

export function detectPlannerLocale(): PlannerLocale {
  try {
    const stored = window.localStorage.getItem(langStorageKey);
    if (stored && supportedLocales.includes(stored as PlannerLocale)) {
      return normalizePlannerLocale(stored);
    }
  } catch {
    // Ignore storage failures and fall back to browser locale.
  }

  const raw = (navigator.language || '').toLowerCase();
  if (raw.startsWith('zh')) {
    if (raw.includes('tw') || raw.includes('hk') || raw.includes('mo') || raw.includes('hant')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }
  if (raw.startsWith('ja')) {
    return 'ja';
  }
  return 'en';
}

function interpolateText(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (Object.prototype.hasOwnProperty.call(params, name)) {
      return String(params[name]);
    }
    return match;
  });
}

function lookupText(locale: PlannerLocale, key: string): string | undefined {
  const localeCatalog = catalog[locale];
  const stringValue = localeCatalog?.strings?.[key];
  if (typeof stringValue === 'string') {
    return stringValue;
  }
  const termValue = localeCatalog?.terms?.[key];
  return typeof termValue === 'string' ? termValue : undefined;
}

export function translatePlannerText(
  locale: PlannerLocale,
  key: string,
  fallback = key,
  params?: Record<string, string | number>,
): string {
  const normalizedLocale = normalizePlannerLocale(locale);
  const resolved = lookupText(normalizedLocale, key) || lookupText(fallbackLocale, key) || fallback;
  return interpolateText(resolved, params);
}