const chalk = require('chalk')
const { console, process } = require('./src/globals')
const { addDashes, getProperty } = require('./src/helpers')

module.exports = function (argv, {options, parameters}) {
  try {
    argv = argv.slice(0)
    const args = {}

    options = options.reduce(function (options, definition) {
      definition = Object.assign({}, definition, {property: getProperty(definition)})

      options.push(definition)

      if (definition.aliases) {
        definition.aliases.forEach(function (alias) {
          options.push(Object.assign({}, definition, {key: alias, alias: true}))
        })
      }

      return options
    }, [])

    parameters = parameters.reduce(function (parameters, definition) {
      definition = Object.assign({}, definition, {property: getProperty(definition)})

      parameters.push(definition)

      return parameters
    }, [])

    let afterDashDash = []
    const indexOfDashDash = argv.indexOf('--')

    if (indexOfDashDash > -1) {
      afterDashDash = argv.slice(indexOfDashDash + 1)

      argv = argv.slice(0, indexOfDashDash)
    }

    argv = argv.reduce(function (argv, arg) {
      if (arg !== '-' && arg.startsWith('-') && !arg.startsWith('--')) {
        if (arg.indexOf('=') > -1) {
          argv.push('-' + arg.substr(arg.indexOf('=') - 1))

          arg = arg.substring(1, arg.indexOf('=') - 1)
        } else {
          arg = arg.substr(1)
        }

        argv = argv.concat(arg.split('').map((arg) => '-' + arg))
      } else {
        argv.push(arg)
      }

      return argv
    }, [])

    const toBeDeleted = []

    for (let i = 0; i < argv.length; i++) {
      options.forEach(function (definition) {
        const search = addDashes(definition.key)
        const property = definition.property
        let vals = []

        if (argv[i] === search) {
          if (definition.type !== Boolean) {
            if (argv[i + 1] != null && (!argv[i + 1].startsWith('-') || argv[i + 1].startsWith('---') || argv[i + 1] === '-')) {
              vals.push(argv[i + 1])

              toBeDeleted.push(i + 1)
            }
          } else {
            vals.push(true)
          }

          toBeDeleted.push(i)
        } else if (argv[i].startsWith(search + '=')) {
          if (definition.type !== Boolean) {
            vals.push(argv[i].substr(argv[i].indexOf('=') + 1))

            toBeDeleted.push(i)
          } else {
            throw new Error(addDashes(definition.key) + ' is a boolean and does not accept a value')
          }
        }

        if (vals != null && vals.length) {
          if (definition.type != null) {
            vals = vals.map((val) => definition.type(val))
          }

          if (definition.multiple === true) {
            args[property] = args[property] != null ? args[property].concat(vals) : vals
          } else if (args[property] != null) {
            throw new Error(addDashes(definition.key) + ' does not accept multiple values')
          } else {
            args[property] = vals.pop()
          }
        }
      })
    }

    options.filter((option) => options.alias !== true).forEach(function (definition) {
      const property = definition.property

      if (args[property] == null) {
        if (definition.default != null) {
          args[property] = definition.default.value
        }

        if (definition.required === true && args['help'] !== true) {
          throw new Error(addDashes(definition.key) + ' is required')
        }
      }
    })

    argv = argv.reduce(function (argv, arg, i) {
      if (!toBeDeleted.includes(i)) {
        argv.push(arg)
      }

      return argv
    }, [])

    argv.forEach(function (arg) {
      if (arg.startsWith('-') && !arg.startsWith('---')) {
        throw new Error('unknown option ' + arg.split('=')[0])
      }
    })

    const remainder = argv.concat(afterDashDash).filter((arg) => arg !== '')

    const hasMultiple = parameters.filter((definition) => definition.multiple).length > 0

    if (!hasMultiple && remainder.length > parameters.length) {
      throw new Error('too many arguments')
    }

    parameters.forEach(function (definition, key) {
      const property = definition.property
      const remainingKeys = parameters.length - 1 - key

      if (!remainder.length) {
        if (definition.default != null) {
          args[property] = definition.default.value
        }

        if (definition.required === true && args['help'] !== true) {
          throw new Error(definition.key + ' is required')
        }
      } else if (definition.multiple === true) {
        args[property] = remainder.splice(0, remainder.length - remainingKeys)

        if (definition.type) {
          args[property] = args[property].map((v) => definition.type(v))
        }
      } else if (definition.type) {
        args[property] = definition.type(remainder.shift())
      } else {
        args[property] = remainder.shift()
      }
    })

    return args
  } catch (error) {
    process.exitCode = 1

    console.error(chalk.red(error.message))
  }
}
