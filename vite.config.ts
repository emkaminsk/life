import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { formatVersion, resolveCommitHash } from './src/version'

// Version label "1.0.<short hash>" (src/version.ts). Falls back to "1.0.dev"
// when neither APP_COMMIT / GITHUB_SHA nor a git checkout is available.
const commitHash = resolveCommitHash(process.env, () =>
  execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString(),
)

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(formatVersion(commitHash)),
  },
  server: {
    port: 3000
  }
})
