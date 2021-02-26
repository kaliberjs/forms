const config = require('@kaliber/config')
const admin = require('firebase-admin')
const { run } = require('./machinery/run')

run(async () => {
  const app = admin.initializeApp(config.server.firebase.config, 'deploy-database-rules')
  await app.database().setRules(config.server.firebase.rules.database)

  console.log('Stored database rules')
})
