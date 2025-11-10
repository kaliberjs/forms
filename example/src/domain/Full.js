import { object, array, useForm, useFormFieldValue, snapshot } from '@kaliber/forms'
import { required, minLength, error, email, optionalT, requiredT } from '@kaliber/forms/validation'
import { FormFieldValue, FormFieldsValues, FormFieldValid } from '@kaliber/forms/components'
import { date, ifParentHasValue, ifFormHasValue } from './machinery/validation'
import { FormValues, FormTextInput, FormCheckbox, FormObjectField, FormArrayField, FormHeterogeneousArrayField, FormCheckboxGroupField } from './machinery/Form'
import { Code } from './machinery/Code'
/** @import { Field, Snapshot } from '@kaliber/forms/types' */

/**
 * When you study this example, don't forget to check the components in the machinery directory
 */

const fields = {
  naam: optionalT('string'),
  email: [required, email],
  geboortedatum: [required, date],
  kortingscode: optionalT('string'),
  betaalNu: requiredT('boolean'),
  betaalInfo: object(
    // custom validation
    x => x.andereNaam && !x.rekeninghouder && error('rekeninghouderIsVerplicht'),
    asConst({
      andereNaam: optionalT('boolean'),
      rekeninghouder: ifParentHasValue(x => x.andereNaam, required),
      rekeningnummer: [ifFormHasValue(x => x.betaalNu, required), minLength(9)],
    })
  ),
  extraKaartjes: array(
    // return a different validation error
    (x, { form }) => form.kortingscode && minLength(1)(x) && error('kortingMoetMetVrienden'),
    asConst({
      anoniem: requiredT('boolean'),
      naam: ifParentHasValue(x => !x.anoniem, required),
      email: [ifParentHasValue(x => !x.anoniem, required), ifParentHasValue(x => !x.anoniem, email)],
    })
  ),
  gevondenVia: [requiredT('string[]'), minLength(1)],
  specialeToevoeging: array(
    /** @arg {{ type: string }} x */
    x =>
      x.type === 'rood' ? asConst({ type: requiredT('rood'), roodInfo: requiredT('string') }) :
      x.type === 'groen' ? asConst({ type: requiredT('groen'), groenInfo: requiredT('string') }) :
      throwError('Only `rood` and `groen` are acceptable types')
  ),
  voorwaarden: [required, /** @arg {boolean} x */ x => !x && error('voorwaardenVerplicht')],
}

/** @typedef {Field.ObjectFromObjectInput<typeof fields>} FormType */

const gevondenViaOptions = [
  { label: 'Vrienden', value: 'vrienden' },
  { label: 'Google', value: 'google' },
  { label: 'Reclame', value: 'reclame' },
]

export function Full() {
  const [submitted, setSubmitted] = React.useState(
    /** @type {Snapshot.FromField<FormType>['value'] | null} */ (null))
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

  /** @arg {Snapshot.FromField<FormType>} snapshot */
  function handleSubmit(snapshot) {
    if (snapshot.invalid) return
    setSubmitted(snapshot.value)
  }

  function handleReset() {
    reset()
    setSubmitted(null)
  }
}

/**
 * @arg {{
 *   form: FormType,
 *   onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
 * }} props
 */
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
      <FormCheckboxGroupField
        field={fields.gevondenVia}
        options={gevondenViaOptions}
        label='Gevonden via'
      />
      <FormCheckbox label='Ik accepteer de voorwaarden' field={fields.voorwaarden} />
      <FormHeterogeneousArrayField
        field={fields.specialeToevoeging}
        types={[
          { name: 'rood', initialValue: asConst({ type: 'rood', roodInfo: '' }) },
          { name: 'groen', initialValue: asConst({ type: 'groen', groenInfo: '' }) },
        ]}
        render={({ fields }) =>
          'roodInfo' in fields ? <FormTextInput label='Rood info' field={fields.roodInfo} /> :
          'groenInfo' in fields ? <FormTextInput label='Groen info' field={fields.groenInfo} /> :
          null
        }
      />
      <FormFieldValid field={form} render={valid =>
        <button type='submit' style={{ cursor: valid ? '' : 'not-allowed' }} disabled={!valid}><b>| Aanmelden |</b></button>
      } />
    </form>
  )
}

/** @arg {{ submitted: Snapshot.FromField<FormType>['value'], onReset: () => void }} props */
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

/** @arg {{ field: Field.Basic<boolean>, children: React.ReactNode, reverse?: boolean }} props */
function Conditional({ field, children, reverse = false }) {
  const value = useFormFieldValue(field)
  return (reverse ? !value : value) && children
}

/**
 * @arg {FormType} form
 * @arg {() => void} f
 */
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

/**
 * @arg {Field} field
 * @returns {boolean}
 */
function getIsVisited(field) {
  return {
    'object': getIsVisitedForObject,
    'array': getIsVisitedForArray,
    'basic': getIsVisitedForBasic,
  // @ts-expect-error
  }[field.type](field)
}

/**
 * @arg {Field.Object} field
 */
function getIsVisitedForObject(field) {
  const { isVisited } = field.state.get()
  return isVisited || Object.values(field.fields).reduce(
    /** @arg {boolean} childrenVisited @arg {Field} child */
    (childrenVisited, child) => childrenVisited || getIsVisited(child),
    false
  )
}

/**
 * @arg {Field.Array} field
 */
function getIsVisitedForArray(field) {
  const { children, isVisited } = field.state.get()
  return isVisited || children.reduce(
    /** @arg {boolean} childrenVisited @arg {Field} child */
    (childrenVisited, child) => childrenVisited || getIsVisited(child),
    false
  )
}

/**
 * @arg {Field.Basic} field
 */
function getIsVisitedForBasic(field) {
  const { isVisited } = field.state.get()
  return isVisited
}

/** @template const T @arg {T} x */
function asConst(x) { return x }

/** @arg {string} message @returns {never} */
function throwError(message) { throw new Error(message) }
