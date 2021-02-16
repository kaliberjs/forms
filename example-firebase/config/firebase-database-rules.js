const formProcessingService = 'form-processing-service'
const isFormProcessingService = `(auth.uid === '${formProcessingService}')`

module.exports = {
  rules: {
    '.read': false,
    '.write': false,
    services: {
      [formProcessingService]:{
        '.read': isFormProcessingService,
        '.write': isFormProcessingService,
        '.indexOn': ['_state', 'submitDate'],
        '$key': {
          '.write': `(${hasAuth()} && ${isCreate()})`,
          formValues: {
            email: isString(),
            name: optional(isString()),
            file: {
              uid: validate(`auth.uid == newData.val() || ${isFormProcessingService}`),
              name: isString(),
              '$other': validate(false)
            },
            '$other': validate(false)
          },
          formSubmitDate: isNumber(),
          '$other': validate(isFormProcessingService)
        }
      }
    },
    status: {
      '$serviceName': {
        '.read': true,
        '.write': `auth.uid === $serviceName`,
        '$hostName': isString(),
      }
    },
  }
}

function isString() { return validate('newData.isString()') }
function isNumber() { return validate('newData.isNumber()') }
function optional(x) { return validate(`(!newData.exists() || ${x['.validate']})`) }
function validate(x) { return { '.validate': x } }
function hasAuth() { return `auth != null` }
function isCreate() { return `newData.exists() && !data.exists()` }
