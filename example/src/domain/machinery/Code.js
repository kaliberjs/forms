export function Code({ value, indent = false }) {
  return <pre><code>{JSON.stringify(value, null, indent ? 2 : 0)}</code></pre>
}
