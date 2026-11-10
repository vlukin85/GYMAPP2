import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { EN } from "./en";
import { RU } from "./ru";
import type { DictKey } from "./ru";
import { DEFAULT_LANG, normalizeLangValue } from "./types";
import type { Lang, TranslateVars } from "./types";

export { DEFAULT_LANG } from "./types";
export type { Lang, TranslateVars } from "./types";
export { defineDomain } from "./types";
export type { DictKey } from "./ru";
export { RU, EN };

/** Ключ AsyncStorage, в котором живёт выбор языка. */
export const APP_LANGUAGE_STORAGE_KEY = "ironrise.app-language.v1";

/** Переводимая строка: ключ словаря и значения плейсхолдеров {name}. */
export type TFunction = (key: DictKey, vars?: TranslateVars) => string;

/**
 * Приводит произвольное значение к поддерживаемому языку.
 * Всё, что не "en", считается русским — дефолт приложения.
 */
export function normalizeLang(value: unknown): Lang {
  return normalizeLangValue(value);
}

/**
 * Язык, который сейчас действует в приложении. Хранится на уровне модуля,
 * чтобы getT()/t() работали и вне React-компонентов (уведомления, сервисы).
 */
let currentLang: Lang = DEFAULT_LANG;

/** Текущий язык для кода вне компонентов. */
export function getAppLanguage(): Lang {
  return currentLang;
}

/** Подставляет значения в плейсхолдеры вида {name}; без vars — как есть. */
export function formatMessage(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = vars[name];
    return value === undefined ? placeholder : String(value);
  });
}

/** Перевод по языку: английский с откатом на русский при отсутствии ключа. */
export function translate(
  lang: Lang,
  key: DictKey,
  vars?: TranslateVars,
): string {
  const normalized = normalizeLang(lang);
  const template = (normalized === "en" ? EN[key] : RU[key]) ?? RU[key] ?? key;
  return formatMessage(template, vars);
}

/** Готовый переводчик для конкретного языка (вне React-компонентов). */
export function getT(lang: Lang): TFunction {
  return (key, vars) => translate(lang, key, vars);
}

/** Перевод на текущий язык приложения. */
export const t: TFunction = (key, vars) => translate(currentLang, key, vars);

/** Читает сохранённый выбор языка; ошибка хранилища — дефолт. */
export async function loadAppLanguage(): Promise<Lang> {
  try {
    const stored = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    return normalizeLang(stored);
  } catch {
    return DEFAULT_LANG;
  }
}

/**
 * Сохраняет выбор языка и сразу применяет его к модульному состоянию,
 * чтобы t() вне компонентов отвечал на новом языке.
 */
export async function saveAppLanguage(lang: Lang): Promise<Lang> {
  const normalized = normalizeLang(lang);
  currentLang = normalized;
  try {
    await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Выбор не сохранился — язык всё равно применён в текущей сессии.
  }
  return normalized;
}

export type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => undefined,
  t: getT(DEFAULT_LANG),
});

/**
 * Провайдер языка: при монтировании читает сохранённый выбор, а setLang
 * применяет его мгновенно ко всем экранам и сохраняет на устройстве.
 */
export function LanguageProvider({ children }: { children?: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  useEffect(() => {
    let cancelled = false;
    void loadAppLanguage().then((stored) => {
      if (cancelled) return;
      currentLang = stored;
      setLangState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    const normalized = normalizeLang(next);
    currentLang = normalized;
    setLangState(normalized);
    void saveAppLanguage(normalized);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: getT(lang) }),
    [lang, setLang],
  );

  return createElement(LanguageContext.Provider, { value }, children);
}

/** Доступ к текущему языку и переводу из компонентов. */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
