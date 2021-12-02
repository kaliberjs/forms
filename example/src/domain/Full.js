import { object, array, useForm, useFormFieldValue, snapshot } from '@kaliber/forms'
import { optional, required, minLength, error, email } from '@kaliber/forms/validation'
import { FormFieldValue, FormFieldsValues, FormFieldValid } from '@kaliber/forms/components'
import { date, ifParentHasValue, ifFormHasValue } from './machinery/validation'
import { FormValues, FormTextInput, FormCheckbox, FormObjectField, FormArrayField, FormHeterogeneousArrayField } from './machinery/Form'
import { Code } from './machinery/Code'

/**
 * When you study this example, don't forget to check the components in the machinery directory
 */

const fields = {
  naam: optional,
  email: [required, email],
  geboortedatum: [required, date],
  kortingscode: optional,
  betaalNu: required,
  betaalInfo: object(
    // custom validation
    x => x.andereNaam && !x.rekeninghouder && error('rekeninghouderIsVerplicht'),
    {
      andereNaam: optional,
      rekeninghouder: ifParentHasValue(x => x.andereNaam, required),
      rekeningnummer: [ifFormHasValue(x => x.betaalNu, required), minLength(9)],
    }
  ),
  extraKaartjes: array(
    // return a different validation error
    (x, { form }) => form.kortingscode && minLength(1)(x) && error('kortingMoetMetVrienden'),
    {
      anoniem: required,
      naam: ifParentHasValue(x => !x.anoniem, required),
      email: [ifParentHasValue(x => !x.anoniem, required), ifParentHasValue(x => !x.anoniem, email)],
    }
  ),
  specialeToevoeging: array(
    x => (
      'roodInfo' in x ? { roodInfo: required } :
      'groenInfo' in x ? { groenInfo: required } :
      {}
    )
  ),
  voorwaarden: [required, x => !x && error('voorwaardenVerplicht')],
}

export function Full() {
  const [submitted, setSubmitted] = React.useState(null)
  const { form, submit, reset } = useForm({
    initialValues: { betaalNu: false, betaalInfo: { andereNaam: false } },
    fields,
    onSubmit: handleSubmit,
    validate: x => { /* you could validate the whole form as well if you wanted */ },
    formId: 'my-form',
  })

  useSendSignalWhenIsVisited(form, () => { console.log('Form was visited') })

  return (
    <>
      {submitted
        ? <Bedankt onReset={handleReset} {...{ submitted }} />
        : <Formulier onSubmit={submit} {...{ form }} />
      }
      <button type='button' onClick={handleReset}>Reset form</button>
      <h3>Current form state:</h3>
      <FormValues {...{ form }} />
    </>
  )

  function handleSubmit(snapshot) {
    if (snapshot.invalid) return
    setSubmitted(snapshot.value)
  }

  function handleReset() {
    reset()
    setSubmitted(null)
  }
}

function Formulier({ form, onSubmit }) {
  const { fields } = form
  return (
    <form {...{ onSubmit }}>
      <FormTextInput label='Naam' field={fields.naam} />
      <FormTextInput label='Email' field={fields.email} />
      <button type='button' onClick={() => fields.geboortedatum.reset()}>Reset geboortedatum</button>
      <FormTextInput label='Geboortedatum' field={fields.geboortedatum} />
      <FormTextInput label='Kortingscode' field={fields.kortingscode} />
      <button type='button' onClick={() => fields.betaalNu.reset()}>Reset nu betalen</button>
      <FormCheckbox label='Nu betalen?' field={fields.betaalNu} />
      <FormFieldValue field={fields.betaalNu} render={value =>
        value && (
          <FormObjectField field={fields.betaalInfo} render={({ fields }) => (
            <>
              <button type='button' onClick={() => form.fields.betaalInfo.reset()}>Reset betaalInfo</button>
              <FormCheckbox label='Andere naam' field={fields.andereNaam} />
              <Conditional field={fields.andereNaam}>
                <button type='button' onClick={() => fields.rekeninghouder.reset()}>Reset rekeninghouder</button>
                <FormTextInput label='Rekeninghouder' field={fields.rekeninghouder} />
              </Conditional>
              <FormTextInput label='Rekeningnummer' field={fields.rekeningnummer} />
            </>
          )} />
        )}
      />
      <button type='button' onClick={() => fields.extraKaartjes.reset()}>Reset extra kaartjes</button>
      <FormArrayField
        field={fields.extraKaartjes}
        initialValue={{ anoniem: false }}
        render={({ fields }) =>
          <>
            <Conditional reverse field={fields.anoniem}>
              <FormFieldsValues fields={[fields.naam, fields.email]} render={([naam, email]) =>
                naam && email && `${naam} (${email})`
              } />
              <FormTextInput label='Naam' field={fields.naam} />
              <button type='button' onClick={() => fields.email.reset()}>Reset email</button>
              <FormTextInput label='Email' field={fields.email} />
            </Conditional>
            <FormCheckbox label='Anoniem' field={fields.anoniem} />
          </>
        }
      />
      <FormCheckbox label='Ik accepteer de voorwaarden' field={fields.voorwaarden} />
      <FormHeterogeneousArrayField
        field={fields.specialeToevoeging}
        types={[
          { name: 'rood', initialValue: { roodInfo: '' } },
          { name: 'groen', initialValue: { groenInfo: '' } }
        ]}
        render={({ fields, value }) =>
          'roodInfo' in value ? <FormTextInput label='Rood info' field={fields.roodInfo} /> :
          'groenInfo' in value ? <FormTextInput label='Groen info' field={fields.groenInfo} /> :
          null
        }
      />
      <FormFieldValid field={form} render={valid =>
        <button type='submit' style={{ cursor: !valid && 'not-allowed' }} disabled={!valid}><b>| Aanmelden |</b></button>
      } />
    </form>
  )
}

function Bedankt({ submitted, onReset }) {
  return (
    <>
      <p>Bedankt!</p>
      <p><button type='button' onClick={onReset}><b>| Nog een keer|</b></button></p>
      Dit is wat je had ingevuld:
      <Code value={submitted} indent />
    </>
  )
}

function Conditional({ field, children, reverse = false }) {
  const value = useFormFieldValue(field)
  return (reverse ? !value : value) && children
}

function useSendSignalWhenIsVisited(form, f) {
  const callbackRef = React.useRef(f)
  React.useEffect(
    () => {
      const unsubscribe = snapshot.subscribeToFieldState(
        form,
        field => {
          if (getIsVisited(field)) {
            callbackRef.current()
            unsubscribe()
          }
        }
      )

      return unsubscribe
    },
    [form]
  )
}



function getIsVisited(field) {
  return {
    'object': getIsVisitedForObject,
    'array': getIsVisitedForArray,
    'basic': getIsVisitedForBasic,
  }[field.type](field)
}

function getIsVisitedForObject(field) {
  const { isVisited } = field.state.get()
  return isVisited || Object.values(field.fields).reduce(
    (childrenVisited, child) => childrenVisited || getIsVisited(child),
    false
  )
}

function getIsVisitedForArray(field) {
  const { children, isVisited } = field.state.get()
  return isVisited || children.reduce(
    (childrenVisited, child) => childrenVisited || getIsVisited(child),
    false
  )
}

function getIsVisitedForBasic(field) {
  const { isVisited } = field.state.get()
  return isVisited
}
