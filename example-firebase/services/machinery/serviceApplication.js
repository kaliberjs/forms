module.exports = { serviceApplication }

/** @typedef {{ shutdown: () => Promise<void> }} Service */
/**
 * @param {string} name
 * @param {
    (x: {
      name: string,
      log: (message: string) => void,
      reportError: (error: Error) => void
    }) => Service
  } createService
 */
function serviceApplication(name, createService) {
  const logPrefix = `[${name}]`
  const service = createService({ name, log, reportError })
  onShutdown(service.shutdown)

  function reportError(error) {
    console.error(logPrefix, error)
  }

  function log(...args) {
    console.log(logPrefix, ...args)
  }

  function onShutdown(onShutdownCallback) {
    const state = { shuttingDown: false }
    process.on('SIGINT', startShutdown)
    process.on('SIGTERM', startShutdown)

    function startShutdown() {
      if (state.shuttingDown) return

      state.shuttingDown = true

      console.log('')
      log(`Shutdown signal received, shutting down...`)

      onShutdownCallback()
        .then(_ => {
          log(`Shutdown successful`)
          process.exit(0)
        })
        .catch(err => {
          console.error(logPrefix, `Shutdown unsuccessful`)
          reportError(err)
          process.exit(1)
        })
    }
  }
}
