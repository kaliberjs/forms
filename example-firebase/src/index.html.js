import '/reset.css'
import '/index.css'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'
import polyfill from '@kaliber/build/lib/polyfill'
import App from '/domain/App?universal'
import config from '@kaliber/config'

export default (
  <html lang='nl'>
    <head>
      <meta charSet='utf-8' />
      <title>@kaliber/build</title>
      <meta name='description' content='' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      {stylesheet}
      {polyfill(['default', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019'])}
      {javascript}
    </head>
    <body>
      <App config={config.client} />
    </body>
  </html>
)
