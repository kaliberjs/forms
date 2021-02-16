const config = require('@kaliber/config')
const admin = require('firebase-admin')
const { run } = require('./machinery/run')

run(async () => {
  const app = admin.initializeApp(config.server.firebase.config, 'deploy-storage-rules')
  const rules = app.securityRules()
  const rulesFile = await rules.createRulesFileFromSource('rules', config.server.firebase.rules.storage)
  const ruleset = await rules.createRuleset(rulesFile)
  await rules.releaseStorageRuleset(ruleset)

  console.log('Stored storage ruleset')
})
