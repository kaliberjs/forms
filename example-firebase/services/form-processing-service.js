const { serviceApplication } = require('./machinery/serviceApplication')
const { createFirebaseServiceApp } = require('./machinery/createFirebaseServiceApp')
const { sendEmail } = require('./machinery/sendEmail')
const config = require('@kaliber/config')
const Queue = require('@kaliber/firebase-queue')

serviceApplication(
  'form-processing-service',
  ({ name, log, reportError }) => {

    const app = createFirebaseServiceApp(name)
    const database = app.database()
    const tasksRef = database.ref(`services/${name}`)

    log(`Picking up tasks from ${tasksRef}`)

    const options = {
      spec: {
        finishedState: process.env.CONFIG_ENV === 'prd' ? undefined : 'finished'
      }
    }
    const queue = new Queue({ tasksRef, processTask, reportError, options })

    return { shutdown: queue.shutdown }

    async function processTask({ formValues, formSubmitDate }) {
      try {
        const { uid, name } = formValues.file
        const fileRef = app.storage().bucket().file(`uploads/${uid}/${name}`)

        const [file] = await fileRef.get()
        const { metadata: { name: filename }, contentType } = file.metadata
        const [content] = await fileRef.download()

        await sendEmail({
          to: config.server.email.to,
          from: formValues.email,
          subject: `New form submission from ${formValues.name || '-'}`,
          text: `${new Date(formSubmitDate).toString()}`,
          attachments: [{ filename, content, contentType }]
        })
      } catch (e) {
        reportError(e)
        throw e
      }
    }
  }
)
