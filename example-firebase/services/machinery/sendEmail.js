const nodemailer = require('nodemailer')
const config = require('@kaliber/config')

module.exports = {
  sendEmail: async mail => {
    const transporter = nodemailer.createTransport(config.server.email.transportOptions)
    await transporter.sendMail(mail)
  }
}
