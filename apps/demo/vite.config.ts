import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig({
    root: __dirname,
    plugins: [
        checker({
            typescript: { tsconfigPath: resolve(__dirname, 'tsconfig.json') },
            overlay: {
                initialIsOpen: false
            }
        })
    ],
    server: {
        host: true,
        port: 5173
    },
    preview: {
        host: true,
        port: 5173
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@system-ui-js/multi-drag': resolve(
                __dirname,
                '../../packages/multi-drag/src/index.ts'
            ),
            '@system-ui-js/multi-drag-core': resolve(
                __dirname,
                '../../packages/multi-drag-core/src/index.ts'
            )
        }
    }
})
