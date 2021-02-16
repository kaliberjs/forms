const fs = require('fs')
const admin = require('firebase-admin')

let firebaseCredentials
try {
  firebaseCredentials = require('./dev-firebase-credentials.json')
} catch (e) {
  throw new Error(`
    ====================================================================
    You need to obtain credentials in order to run the firebase examples

    Store these credentials (private key) in the following location:
      /config/dev-firebase-credentials.json

    @kaliber: content in our password manager
    ====================================================================
  `)
}

let firebaseInfo
try {
  firebaseInfo = require('./dev-firebase-info')
} catch (e) {
  throw new Error(`
    ======================================================================
    You need to supply firebase info in order to run the firebase examples

    Store the following information at the following location:
      /config/dev-firebase-info.js

    module.exports = {
      apiKey: '...',
      databaseURL: '...',
      storageBucket: '...',
    }

    @kaliber: content in our password manager
    ======================================================================
  `)
}

let transportOptions
try {
  transportOptions = require('./dev-mail-transport')
} catch (e) {
  throw new Error(`
    ======================================================================
    You need to supply transport options info in order to send mail

    Store the following information at the following location:
      /config/dev-transport-options.js

    See https://nodemailer.com/smtp/ for details

    @kaliber: content in our password manager
    ======================================================================
  `)
}

module.exports = {
  client: {
    firebase: firebaseInfo,
  },
  server: {
    firebase: {
      config: {
        ...firebaseInfo,
        credential: admin.credential.cert(firebaseCredentials),
      },
      rules: {
        database: JSON.stringify(require('./firebase-database-rules'), null, 2),
        storage: fs.readFileSync(require.resolve('./firebase-storage.rules'), 'utf8'),
      }
    },
    email: {
      to: 'hello@kaliber.net',
      transportOptions,
    }
  }
}
