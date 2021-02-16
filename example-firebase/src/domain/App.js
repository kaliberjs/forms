import { Firebase } from './Firebase'

export default function App({ config }) {
  return (
    <>
      <h2>Firebase example</h2>
      <Firebase {...{ config }} />
    </>
  )
}
