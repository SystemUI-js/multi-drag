# 更新日志 (CHANGELOG)

所有项目的版本更新记录都将记录在此文件中。

版本号格式遵循 [语义化版本控制规范](https://semver.org/lang/zh-CN/)。

---

## [0.1.0] - 2024-12-19

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

---

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