import '/reset.css'
import '/index.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'
import App from '/domain/App?universal'

export default (
  <html lang='nl'>
    <head>
      <title>@kaliber/build</title>
      {stylesheet}
      {javascript}
    </head>
    <body>
      <App />
    </body>
  </html>
)
