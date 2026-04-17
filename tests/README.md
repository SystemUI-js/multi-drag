# E2E 测试说明

当前 E2E 以 workspace demo 为准，覆盖两条主线：

- `multi-touch.spec.ts`：验证页面结构与 Web 包拖拽能力
- `advanced-gestures.spec.ts`：验证单指拖拽与宿主扩展点兼容

## 运行方式

```bash
yarn test:e2e
```

Playwright 会自动启动 `apps/demo`。

## 覆盖范围

- Web 示例可见且可交互
- `@system-ui-js/multi-drag` Web 示例仍可拖拽
- `Mixin` 单指动作配置生效
- `setPoseOnEnd` 等宿主扩展点未回退
