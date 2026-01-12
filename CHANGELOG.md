# 更新日志 (CHANGELOG)

所有项目的版本更新记录都将记录在此文件中。

版本号格式遵循 [语义化版本控制规范](https://semver.org/lang/zh-CN/)。

---

## [current]

### 新增功能 ✨
- **惯性拖动重构**
  - 优化惯性实现架构，将惯性逻辑从 finger 迁移到 DragBase
  - 删除 make 函数体系，全面采用类实现方式
  - 优化结构，提升代码可维护性

### 修复问题 🐛
- 修复 options 的惯性设置不生效的问题
- 修复 scale 和 rotate 的 End 时触发 type 错误
- 修复 rotate 和 scale 的 handleEnd 没有响应事件的问题
- 修复 global.PointerEvent 类型安全问题，使用 'as never' 进行类型转换
- 修复 CI 报错问题

### 代码重构 🔄
- 简化代码结构，删除不必要的 make 函数
- 改用类实现旋转缩放功能，提升代码质量
- 优化惯性拖动功能的实现方式

### 开发工具 🔧
- **CI/CD 优化**
  - 优化 CI 脚本，拆分 PR 和发布流程
  - **发布流程升级**：采用 version/* 分支触发方式
    - 正式版：在 `version/X.Y.Z` 分支推送，package.json 版本为 `X.Y.Z`
    - dev 预发布：在 `version/X.Y.Z` 分支推送，package.json 版本为 `X.Y.Z-dev.N`
    - beta 预发布：在 `version/X.Y.Z` 分支推送，package.json 版本为 `X.Y.Z-beta.N`
  - 新增 CI PR 工作流和发布工作流
  - 新增同步 master 到 dev 的工作流
  - 添加 .editorconfig 统一编辑器配置

- **TypeScript 配置**
  - 更新 TypeScript 配置为 ES2022
  - 优化 TypeScript 编译配置

- **代码质量工具**
  - 更新 @system-ui-js/development-base 到版本 0.0.8
  - 增强 ESLint 配置，添加 sonarjs 插件
  - 优化代码风格和规范
  - 新增 Codex Agents 文档

- **其他优化**
  - 更新 jest.config.cjs 配置
  - 更新 playwright.config.ts 配置
  - 优化 prettier.config.cjs 配置

### 文档更新 📚
- 新增 CHANGELOG current 部分，用于记录待发布内容
- 更新 ISSUE_TEMPLATE，使用 YAML 格式
- 添加 CodeRabbit 徽章到 README
- 更新 README.md，增加 demo2.gif 演示
- 新增 AGENTS.md 文档，定义编辑器默认值和可用的代理

---

## [0.1.0] - 2025-08-19

### 初始版本 ✨

#### 新增功能
- **核心拖拽功能**
  - 基础拖拽支持 (makeDraggable)
  - 魔法拖拽模式 (makeMagicDrag)
  - 拖拽管理器 (DragManager)
  - 拖拽方法集合 (dragMethods)

- **手势操作**
  - 双指缩放功能 (makeScalable)
  - 双指旋转功能 (makeRotatable)
  - 多指手势识别

- **数学工具**
  - 矩阵变换工具 (matrixTransforms)
  - 数学计算工具 (mathUtils)

- **开发工具**
  - TypeScript 完整类型支持
  - ESLint 代码规范检查
  - Jest 单元测试框架
  - Playwright E2E 测试
  - Vite 构建工具

#### 技术特性
- 支持触摸和鼠标事件
- 响应式设计
- 高性能矩阵计算
- 模块化架构
- 完整TypeScript支持

#### 开发环境
- Node.js 18+
- TypeScript 5.0+
- Vite 5.0+
- 完整测试覆盖

#### 文档
- 完整README文档
- API使用示例
- 开发指南

## [0.2.0] - 2025-10-19

### 新增功能
- **多指混合拖拽重构**
  - 使用新的混合方式

- **增加惯性拖动**
  - 增加惯性拖动


## [0.2.1] - 2025-10-20

### 新增功能
- **DragBase增加passive模式的外部设置**
  - 新增setPassive方法，用于外部设置是否为passive模式

- **DragBase增加enabled模式的外部设置**
  - 新增setEnabled和setDisabled方法，用于外部设置是否为enabled模式


## [0.2.2] - 2025-11-07

### 新增功能 ✨
- **测试覆盖增强**
  - 增加缩放与旋转功能的单元测试用例
  - 优化触控点匹配逻辑
  - 清理过时的单元测试

### 修复问题 🐛
- 修复单测报错

## [0.2.4] - 2025-11-15

### 新增功能 ✨
- **替换底层事件监听**
  - MouseEvent和 TouchEvent都改为 PointerEvent

### 修复问题 🐛
- 修复多指触控时抬起手指导致所有事件全都触发 END 的问题


## [0.2.5] - 2025-11-17

### 新增功能 ✨

### 修复问题 🐛
- 修复options.inertial设置对惯性不管用的问题

## [0.2.6] - 2025-11-17

### 新增功能 ✨

### 修复问题 🐛
- 修复 options.setPoseOnEnd 在 rotate 和 scale 不生效的问题（#31）

### 开发工具 🔧
- 添加编辑器配置和项目规则（.editorconfig）

## 版本说明

### 版本号规则
- **主版本号 (MAJOR)**：不兼容的API修改
- **次版本号 (MINOR)**：向下兼容的功能性新增
- **修订号 (PATCH)**：向下兼容的问题修正

### 标签说明
- ✨ 新增功能 (Added)
- 🔄 功能变更 (Changed)
- 🐛 问题修复 (Fixed)
- ⚡ 性能优化 (Performance)
- 🔧 开发工具 (Dev Tools)
- 📚 文档更新 (Documentation)

