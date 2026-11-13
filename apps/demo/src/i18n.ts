import zhCN, { type TranslationKey } from './locales/zh-CN'
import enUS from './locales/en-US'

// 受支持语言列表与联合类型
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

// 首次加载固定使用简体中文，不做持久化与浏览器语言探测
export const DEFAULT_LOCALE: Locale = 'zh-CN'

const resources: Record<Locale, Record<TranslationKey, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 模块内语言状态，仅由 setLocale 修改
let currentLocale: Locale = DEFAULT_LOCALE

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function t(key: TranslationKey): string {
  const text = resources[currentLocale][key]
  if (!text) {
    throw new Error(
      `Missing translation for "${key}" in locale "${currentLocale}"`
    )
  }
  return text
}
