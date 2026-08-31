// Vendor the 3D dice engine's rendering assets into `public/` so the app serves
// them from its own origin (no third-party asset host, no runtime download).
//
// `@drdreo/dice-box-threejs` ships no postinstall copier, so this is run by hand
// when the package is added or upgraded; the copied files are committed. Sounds
// are intentionally skipped — the engine runs with `sounds: false`.
//
//   node scripts/vendor-dice-assets.mjs
import { cp, rm, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules/@drdreo/dice-box-threejs/dist/textures')
const dest = path.join(root, 'public/dice-box-threejs/textures')

if (!existsSync(src)) {
  console.error(`Source not found: ${src}\nRun "npm install" first.`)
  process.exit(1)
}

await rm(dest, { recursive: true, force: true })
await mkdir(path.dirname(dest), { recursive: true })
await cp(src, dest, { recursive: true })
console.log(`Vendored dice textures -> ${path.relative(root, dest)}`)
