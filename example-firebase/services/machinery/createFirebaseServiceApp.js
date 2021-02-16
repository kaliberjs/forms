const firebase = require('firebase-admin')
const os = require('os')
const config = require('@kaliber/config')

module.exports = { createFirebaseServiceApp }

function createFirebaseServiceApp(name) {
  const app = firebase.initializeApp(
    {
      ...config.server.firebase.config,
      databaseAuthVariableOverride: { uid: name },
    },
    name,
  )

  const rootRef = app.database().ref()

  setupMonitoring(rootRef, name)

  return app
}

function setupMonitoring(rootRef, name) {
  const statusRef = rootRef.child('status').child(name)
  const hostRef = statusRef.child(os.hostname().replace(/\./g, '_'))
  console.log(`[${name}] Status can be monitored at ${hostRef.toString()}.json`)

  hostRef.root.child('.info/connected').on('value', snap => {
    const online = snap.val()
    const status = online ? 'online' : 'offline'
    console.log(`[${name}] Firebase status: ${status}`)
    if (online) {
      hostRef.onDisconnect().set('offline')
      hostRef.set('online')
    }
  })
}
