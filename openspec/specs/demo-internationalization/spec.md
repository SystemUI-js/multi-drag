# demo-internationalization Specification

## Purpose
为 Demo 提供集中维护且无需第三方运行时依赖的中英文文案能力，使用户能够切换界面语言，同时保持现有拖拽演示行为不变。

## Requirements

### Requirement: Demo 提供完整的中英文文案资源
Demo SHALL 为全部用户可见文案提供 `zh-CN` 和 `en-US` 两套对应文本，且同一语义的文案 SHALL 使用相同的资源标识进行访问，而不是直接硬编码在页面模板中。

#### Scenario: 使用中文资源渲染
- **WHEN** Demo 当前语言为 `zh-CN`
- **THEN** 页面中所有受国际化管理的用户可见文案均显示对应的简体中文文本

#### Scenario: 使用英文资源渲染
- **WHEN** Demo 当前语言为 `en-US`
- **THEN** 页面中所有受国际化管理的用户可见文案均显示对应的英文文本

#### Scenario: 两套资源保持完整对应
- **WHEN** 检查 Demo 使用的任一用户可见文案资源标识
- **THEN** `zh-CN` 和 `en-US` 资源中均存在该标识对应的非空文本

### Requirement: Demo 提供语言文本访问能力
Demo SHALL 通过统一的国际化能力按当前语言获取文案，并 SHALL 支持读取当前语言；该能力不得要求新增第三方运行时依赖。

#### Scenario: 获取当前语言的文案
- **WHEN** 页面请求一个已定义的文案资源标识
- **THEN** 系统返回该标识在当前语言资源中的文本

#### Scenario: 读取当前语言
- **WHEN** 页面查询当前语言
- **THEN** 系统返回 `zh-CN` 或 `en-US` 中当前生效的语言标识

### Requirement: 用户可以在中文和英文之间切换
Demo SHALL 在页面顶部提供清晰可操作的“中 / EN”语言切换入口，并 SHALL 在用户选择语言后更新当前页面的国际化文案，无需重新加载页面。

#### Scenario: 从中文切换到英文
- **WHEN** 当前语言为 `zh-CN` 且用户选择 `EN`
- **THEN** 当前语言变为 `en-US`，页面中受国际化管理的文案更新为英文

#### Scenario: 从英文切换到中文
- **WHEN** 当前语言为 `en-US` 且用户选择 `中`
- **THEN** 当前语言变为 `zh-CN`，页面中受国际化管理的文案更新为简体中文

#### Scenario: 切换入口反映当前语言
- **WHEN** 任一支持的语言处于生效状态
- **THEN** 语言切换入口以可感知的方式标识当前语言

### Requirement: 国际化不得改变 Demo 的拖拽行为
语言资源加载、文案渲染和语言切换 MUST 保持现有多选及拖拽演示能力可用，并 SHALL 不改变拖拽库的公开 API 或交互语义。

#### Scenario: 切换语言后继续拖拽
- **WHEN** 用户切换页面语言后执行 Demo 支持的选择和拖拽操作
- **THEN** 选择、拖拽及放置行为与切换语言前一致并正常完成

#### Scenario: 不影响拖拽库公共接口
- **WHEN** Demo 引入国际化能力
- **THEN** `@system-ui-js/multi-drag-core` 和 `@system-ui-js/multi-drag` 的公开 API 保持不变
