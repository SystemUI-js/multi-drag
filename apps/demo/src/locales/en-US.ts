import type { TranslationKey } from './zh-CN'

// 英文语言资源：使用 Record<TranslationKey, string> 约束，缺失键、多余键或非字符串值会在编译期报错
const enUS: Record<TranslationKey, string> = {
  'hero.title': 'Multi Drag Workspace Demo',
  'hero.subtitle':
    'Showcases common gesture combinations of the web wrapper @system-ui-js/multi-drag and its host extension points.',
  'demo.title': 'Web Wrapper Example',
  'demo.description':
    'Keeps the core Drag / Mixin usage and supports configuring single-finger actions.',
  'demo.item1': 'Item 1 (Drag + Scale, single-finger Drag only)',
  'demo.item2': 'Item 2 (Drag)',
  'demo.item3': 'Item 3 (Drag + Rotate + Scale, single-finger Scale + Rotate)',
  'host.title': 'Host Extension Points',
  'host.description': 'Continues to support getPose / setPose / setPoseOnEnd.',
  'pressure.title': 'Pressure-Sensitive Drag Demo',
  'pressure.description':
    'Drag with a stylus or a Force Touch trackpad and watch how pressure affects the visuals.',
  'pressure.label': 'Pressure-Sensitive Drag',
  'languageSwitcher.label': 'Switch language'
}

export default enUS
