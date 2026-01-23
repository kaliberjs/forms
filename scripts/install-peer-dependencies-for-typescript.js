import path from 'node:path'
import config from '../package.json' with { type: 'json' }
import childProcess from 'node:child_process'
import fs from 'node:fs'

console.log('Installing peer dependencies for typescript')

const targetDir = path.join(process.cwd(), 'typescript')
if (!fs.existsSync(targetDir))
  fs.mkdirSync(targetDir)

const packages = Object.entries(config.peerDependencies ?? {})
  .map(([packageName, version]) => `${packageName}@${version}`)

const packageJson = path.join(targetDir, 'package.json')
if (!fs.existsSync(packageJson))
  fs.writeFileSync(packageJson, '{}')

const pnpm = childProcess.spawn(
  'pnpm',
  'add --lockfile=false'.split(' ').concat(packages),
  { env: { ...process.env, PREVENT_LOOP: 'true' }, cwd: targetDir }
)
pnpm.stdout.on('data', data => process.stdout.write(data))
pnpm.stderr.on('data', data => process.stderr.write(data))
pnpm.on('error', e => { throw e })
pnpm.on('close', code => process.exit(code))
