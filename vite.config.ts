import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import { resolve } from 'node:path'

// Custom plugin to move scripts to body
const moveScriptsToBody = () => {
  return {
    name: 'move-scripts-to-body',
    transformIndexHtml(html) {
      // Extract script tags from head
      const scriptMatches =
        html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
      const moduleScripts = scriptMatches.filter((script) =>
        script.includes('type="module"')
      )

      // Remove script tags from head
      let newHtml = html.replaceAll(
        /<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi,
        ''
      )

      // Add scripts to body before closing tag
      if (moduleScripts.length > 0) {
        const scriptsToAdd = moduleScripts
          .map((script) => `    ${script}`)
          .join('\n')
        newHtml = newHtml.replace(
          /(\s*)<\/body>/,
          `\n${scriptsToAdd}\n$1</body>`
        )
      }

      return newHtml
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  const isDemo = mode === 'demo'

  const baseConfig = {
    plugins: [
      checker({
        // 使用构建专用的 tsconfig，避免检查测试与 demo 文件
        typescript: { tsconfigPath: resolve(__dirname, 'tsconfig.build.json') },
        overlay: {
          initialIsOpen: false
        }
      })
    ],
    server: {
      host: true, // 允许局域网访问
      port: 5173 // 可选：指定端口
    }
  }

  if (isLib) {
    // 库模式配置 - 用于打包API接口
    return {
      ...baseConfig,
      build: {
        outDir: 'dist', // API接口放在dist目录下
        lib: {
          // 入口文件路径
          entry: resolve(__dirname, 'src/index.ts'),
          // 库名称，在UMD模式下会作为全局变量名
          name: 'MultiDrag',
          // 输出文件名
          fileName: (format) => `index.${format === 'es' ? 'esm.' : ''}js`
        },
        rollupOptions: {
          // 确保外部化处理不想打包进库的依赖
          external: ['mathjs'],
          output: {
            // 在 UMD 构建模式下为外部化的依赖提供全局变量
            globals: {
              mathjs: 'mathjs'
            }
          }
        },
        sourcemap: true,
        // 生成单独的CSS文件
        cssCodeSplit: false
      }
    }
  }

  if (isDemo) {
    // Demo模式配置 - 用于打包demo
    return {
      ...baseConfig,
      build: {
        outDir: 'dist/demo', // demo的js放在demo目录下
        rollupOptions: {
          input: {
            demo: resolve(__dirname, 'index.html')
          },
          output: {
            entryFileNames: 'demo-[hash].js',
            chunkFileNames: 'chunks/demo-[hash].js',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'demo-[hash].[ext]'
              }
              return '[name]-[hash].[ext]'
            }
          }
        }
      },
      base: '/multi-drag/demo/'
    }
  }

  // 开发模式配置
  return {
    ...baseConfig,
    base: '/',
    plugins: [...baseConfig.plugins, moveScriptsToBody()]
  }
})
