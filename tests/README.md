# 多点触摸自动化测试

本项目使用 Playwright 进行端到端（E2E）自动化测试，专门测试多点触摸手势操作。

## 🎯 测试覆盖

### 基础功能测试 (`multi-touch.spec.ts`)
- ✅ 页面基础元素显示
- ✅ Item1 双指缩放功能（模拟）
- ✅ Item2 单指拖拽功能
- ✅ Item3 双指旋转+缩放功能（模拟）
- ✅ 多元素同时操作
- ✅ 控制台日志验证

### 高级手势测试 (`advanced-gestures.spec.ts`)
- ✅ Item1 - 纯缩放功能（使用 TouchGestureHelper）
- ✅ Item1 - 缩小手势测试
- ✅ Item2 - 拖拽功能测试
- ✅ Item3 - 旋转手势测试
- ✅ Item3 - 复合手势测试（旋转+缩放）
- ✅ 多元素并发操作测试
- ✅ 边界条件测试
- ✅ 性能测试 - 快速连续手势

## 🚀 运行测试

### 安装依赖
```bash
yarn install
npx playwright install
```

### 运行所有测试
```bash
yarn test:e2e
```

### 运行基础测试
```bash
yarn test:e2e:basic
```

### 运行带界面的测试（可视化）
```bash
yarn test:e2e:headed
```

### 运行交互式测试界面
```bash
yarn test:e2e:ui
```

### 查看测试报告
```bash
yarn test:e2e:report
```

## 🛠️ 测试工具

### TouchGestureHelper
位于 `tests/e2e/helpers/touch-gestures.ts`，提供了便捷的多点触摸手势模拟：

- `pinchToZoom(element, scaleFactor)` - 双指缩放手势
- `rotateGesture(element, angleDegrees)` - 双指旋转手势
- `dragGesture(element, deltaX, deltaY)` - 单指拖拽手势

### 使用示例
```typescript
import { TouchGestureHelper } from './helpers/touch-gestures'

test('缩放测试', async ({ page }) => {
  const touchHelper = new TouchGestureHelper(page)
  const element = page.locator('#item1')

  // 放大2倍
  await touchHelper.pinchToZoom(element, 2.0)
  await touchHelper.waitForGestureComplete()
})
```

## 🎯 测试场景

### Item1 - 纯缩放（不旋转）
- 使用 `keepTouchesRelative` 方法
- 双指操作只影响缩放，保持旋转角度不变
- 触点相对位置保持固定

### Item2 - 单指拖拽
- 使用 `drag` 方法
- 只响应单指拖拽操作
- 不支持多指手势

### Item3 - 旋转+缩放
- 使用 `keepTouchesRelative` 方法
- 双指操作同时支持旋转和缩放
- 触点相对位置保持固定

## 📊 测试结果

运行测试后会生成：
- HTML 报告：包含详细的测试结果和截图
- 视频录制：失败测试的回放视频
- 截图：失败时的页面状态

## 🔧 配置

测试配置位于 `playwright.config.ts`：
- 支持多浏览器测试（Chromium、Firefox、WebKit）
- 启用触摸事件支持
- 自动启动开发服务器
- 失败时自动截图和录制视频

## 📱 移动设备测试

配置中包含移动设备模拟：
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

可以单独运行移动设备测试：
```bash
yarn playwright test --project="Mobile Chrome"
```

## 🐛 调试

### 调试失败的测试
1. 查看生成的截图和视频
2. 使用 `--headed` 模式观察测试过程
3. 使用 `--debug` 模式进行断点调试

### 常见问题
- **变换格式问题**：浏览器可能将 CSS transform 转换为 matrix 格式
- **时间问题**：增加 `waitForGestureComplete()` 延迟
- **触摸事件**：确保测试环境支持触摸事件

## 📈 扩展测试

要添加新的测试用例：
1. 在相应的 `.spec.ts` 文件中添加测试
2. 使用 `TouchGestureHelper` 进行手势模拟
3. 验证元素状态变化
4. 添加适当的断言
