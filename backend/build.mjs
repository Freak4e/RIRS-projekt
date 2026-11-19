import { build } from 'esbuild'

await build({
  entryPoints: { index: 'src/index.ts', 'seed-admin': 'prisma/seed-admin.ts' },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
})
