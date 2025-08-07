import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

// Custom plugin to move scripts to body
const moveScriptsToBody = () => {
  return {
    name: 'move-scripts-to-body',
    transformIndexHtml(html) {
      // Extract script tags from head
      const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
      const moduleScripts = scriptMatches.filter(script => script.includes('type="module"'))

      // Remove script tags from head
      let newHtml = html.replace(/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi, '')

      // Add scripts to body before closing tag
      if (moduleScripts.length > 0) {
        const scriptsToAdd = moduleScripts.map(script => `    ${script}`).join('\n')
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
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/multi-drag/' : '/',
  plugins: [
    checker({
      typescript: true,
      overlay: {
        initialIsOpen: false,
      },
    }),
    moveScriptsToBody(),
  ],
  server: {
    host: true, // 允许局域网访问
    port: 5173, // 可选：指定端口
  },
})
