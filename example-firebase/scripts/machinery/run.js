module.exports = { run }

async function run(f) {
  f()
    .then(_ => { console.log('Done'); process.exit(0) })
    .catch(e => { console.error(e); process.exit(1) })
}
