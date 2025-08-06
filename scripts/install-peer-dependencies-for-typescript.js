const path = require('node:path')
const config = require('../package.json')
const childProcess = require('node:child_process')
const fs = require('node:fs')

console.log('Installing peer dependencies for typescript')

const targetDir = path.join(process.cwd(), 'typescript')
if (!fs.existsSync(targetDir))
  fs.mkdirSync(targetDir)

const packages = Object.entries(config.peerDependencies ?? {})
  .map(([packageName, version]) => `${packageName}@${version}`)

const packageJson = path.join(targetDir, 'package.json')
if (!fs.existsSync(packageJson))
  fs.writeFileSync(packageJson, '{}')

const yarn = childProcess.spawn(
  'yarn',
  'add --pure-lockfile'.split(' ').concat(packages),
  { env: { ...process.env, PREVENT_LOOP: 'true' }, cwd: targetDir }
)
yarn.stdout.on('data', data => process.stdout.write(data))
yarn.stderr.on('data', data => process.stderr.write(data))
yarn.on('error', e => { throw e })
yarn.on('close', code => process.exit(code))
