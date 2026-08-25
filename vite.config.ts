import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const MAPLIBRE_DIST = path.resolve(__dirname, 'node_modules/maplibre-gl/dist')
const MAPLIBRE_WORKER_FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-worker-dev.mjs'] as const

function copyMaplibreWorkers(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true })
  for (const fileName of MAPLIBRE_WORKER_FILES) {
    const from = path.join(MAPLIBRE_DIST, fileName)
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(targetDir, fileName))
    }
  }
}

function maplibreWorkerPlugin(): Plugin {
  return {
    name: 'copy-maplibre-worker',
    configResolved(config) {
      copyMaplibreWorkers(path.resolve(config.cacheDir, 'deps'))
    },
    configureServer(server) {
      copyMaplibreWorkers(path.resolve(server.config.cacheDir, 'deps'))
    },
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      copyMaplibreWorkers(dist)
      copyMaplibreWorkers(path.join(dist, 'assets'))
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), vue(), vueDevTools({ launchEditor: 'webstorm' }), maplibreWorkerPlugin()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: /^maplibre-gl$/,
        replacement: path.join(MAPLIBRE_DIST, 'maplibre-gl.mjs'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  worker: {
    format: 'es',
  },
})
