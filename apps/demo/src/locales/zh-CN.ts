// 简体中文语言资源：作为资源结构基准，其他语言通过 TranslationKey 校验完整性
const zhCN = {
  'hero.title': 'Multi Drag Workspace Demo',
  'hero.subtitle':
    '展示 Web 封装 @system-ui-js/multi-drag 的常用手势组合与宿主扩展点。',
  'demo.title': 'Web 封装示例',
  'demo.description': '保持 Drag / Mixin 核心用法，并支持配置单指动作。',
  'demo.item1': 'Item 1 (Drag + Scale，单指仅 Drag)',
  'demo.item2': 'Item 2 (Drag)',
  'demo.item3': 'Item 3 (Drag + Rotate + Scale，单指 Scale + Rotate)',
  'host.title': '宿主扩展点兼容',
  'host.description': '继续支持 getPose / setPose / setPoseOnEnd。',
  'pressure.title': '压力敏感拖拽演示',
  'pressure.description':
    '使用触摸笔或 Force Touch 触摸板拖拽，观察压力对视觉效果的影响。',
  'pressure.label': '压力敏感拖拽',
  'languageSwitcher.label': '切换语言'
}

// 资源键联合类型：英文资源通过 Record<TranslationKey, string> 在编译期校验完整对应
export type TranslationKey = keyof typeof zhCN

export default zhCN
