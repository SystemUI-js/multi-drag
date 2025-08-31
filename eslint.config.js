// 启用 ESLint Flat Config，并集成 SonarJS 检查以及 TypeScript 支持
// 参考 sonarjs 文档：`eslint-plugin-sonarjs` 的 recommended 配置（ESLint 9）
// https://www.npmjs.com/package/eslint-plugin-sonarjs

import tseslint from 'typescript-eslint'
import sonarjs from 'eslint-plugin-sonarjs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default [
  // 忽略产物与报告目录
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
      'wiki/**',
      'wiki-repo/**',
      'assets/**',
      '.history/**',
      'eslint.config.js',
      // 忽略测试与演示代码（不纳入质量门槛）
      'src/**/__tests__/**',
      'test/**',
      'tests/**',
      'src/demo/**',
      // 忽略构建与工具配置
      'playwright.config.ts',
      'vite.config.ts',
      'jest.config.cjs'
    ]
  },

  // SonarJS 推荐配置（会开大多数规则并以 error 级别报告）
  sonarjs.configs.recommended,

  // 统一为本仓库的语言、解析与环境设置
  // 追加全局变量设置（应用到 TS/JS）
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      globals: {
        // 浏览器
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // Jest/Playwright 测试全局
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    }
  },

  // 为 TS 文件启用类型化解析与规则（仅作用于 TS/TSX）
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // 引入 typescript-eslint 推荐（带类型）与风格化（带类型）规则集
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.stylisticTypeChecked.rules
    }
  }
]
