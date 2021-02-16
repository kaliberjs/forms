import { useForm, useFormField } from '@kaliber/forms'
import { required, email, optional, error } from '@kaliber/forms/validation'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid email',
  fileSize: ({ maxSize }) => `File is larger than ${maxSize / 1024 / 1024}MB`,
}

export function Firebase({ config }) {
  const firebaseApp = useFirebase(config.firebase, 'forms-example-firebase')

  const { form: { fields }, submit } = useForm({
    // provide initial values to populate the form with
    initialValues: {
      name: '',
      email: '',
    },
    // create the form structure, fields are essentially their validation functions
    fields: {
      name: optional,
      email: [required, email],
      file: [required, file({ maxSize: 5 * 1024 * 1024 })]
    },
    // handle form submit
    onSubmit: handleSubmit,
  })

  return (
    <form onSubmit={submit}>
      <TextInput label='Name' field={fields.name} />
      <TextInput label='Email' field={fields.email} />
      <FileInput label='File' field={fields.file} />
      <button type='submit'>Submit</button>
    </form>
  )

  async function handleSubmit(snapshot) {
    if (snapshot.invalid) return
    try {
      const { user: { uid } } = await firebaseApp.auth().signInAnonymously()
      const submissionsRef = firebaseApp.database().ref('services/form-processing-service')

      const uniqueId = submissionsRef.push().key
      const { file, ...values } = snapshot.value

      const fileResult = await firebaseApp.storage()
        .ref('uploads').child(uid).child(uniqueId)
        .put(file, { customMetadata: { name: file.name } })

      await submissionsRef.push({
        formSubmitDate: firebase.database.ServerValue.TIMESTAMP,
        formValues: { ...values, file: { uid, name: fileResult.metadata.name } },
      })

      console.log('done')
    } catch (e) {
      console.error(e)
    }
  }
}

function file({ maxSize }) {
  return x => (x.size > maxSize) && error('fileSize', { maxSize })
}

function TextInput({ label, field }) {
  const { name, state, eventHandlers } = useFormField(field)
  const { value = '', error, showError } = state
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        <input id={name} type='text' {...{ name, value }} {...eventHandlers} />
      </div>
      {showError && <p>{validationErrors[error.id]}</p>}
    </>
  )
}

function FileInput({ label, field }) {
  const { name, state, eventHandlers: { onChange, ...eventHandlers } } = useFormField(field)
  const { value = null, error, invalid } = state
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        {
          value
            ? (
              <div>
                <span>{value.name}</span>
                <button type='button' onClick={_ => onChange(null)}>x</button>
                {invalid && <p>{asFunction(validationErrors[error.id])(...error.params)}</p>}
              </div>
            )
            : <input type='file' {...{ name }} {...eventHandlers} onChange={e => onChange(e.currentTarget.files[0])}  />
        }
      </div>
    </>
  )

  function asFunction(x) {
    return typeof x === 'function' ? x : _ => x
  }
}

/** @returns {firebase.app.App} */
function useFirebase(config, name) {
  const [firebaseApp, setFirebaseApp] = React.useState(null)
  React.useEffect(
    () => {
      let firebaseApp

      try {
        firebaseApp = firebase.app(name)
      } catch (err) {
        firebaseApp = firebase.initializeApp(config, name)
      }

      setFirebaseApp(firebaseApp)
    },
    [name, config]
  )

  return firebaseApp
}
