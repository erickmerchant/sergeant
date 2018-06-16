const chalk = require('chalk')
const { console, process } = require('./src/globals')
const { addDashes, longest, spaces } = require('./src/helpers')

module.exports = function (name, description, {options, parameters, commands}) {
  process.exitCode = 1

  if (description) {
    console.error('')

    console.error(description)
  }

  if (parameters.length || options.length) {
    const usages = getUsages(name, {options, parameters, commands})

    console.error('')

    if (usages.length > 1) {
      console.error(chalk.green('Usage:'))

      console.error('')

      for (const usage of usages) {
        console.error(usage)
      }
    } else {
      console.error(chalk.green('Usage:') + ' ' + usages[0])
    }
  }

  parameters = getNested('parameters', {parameters, commands})

  if (parameters.length) {
    console.error('')

    console.error(chalk.green('Parameters:'))

    console.error('')

    const longestParameter = longest(parameters.map(function (definition) {
      return definition.key
    }))

    for (const definition of parameters) {
      const description = [spaces(longestParameter - definition.key.length) + definition.key]

      if (definition.description) {
        description.push(chalk.gray(definition.description))
      }

      if (definition.type != null) {
        const _default = definition.type()

        if (_default != null) {
          description.push('[default: ' + JSON.stringify(_default) + ']')
        }
      }

      console.error(description.join('  '))
    }
  }

  options = getNested('options', {options, commands})

  if (options.length) {
    console.error('')

    console.error(chalk.green('Options:'))

    console.error('')

    const longestOption = longest(options.map(function (definition) {
      return getOptionWithDashesAndAliases(definition)
    }))

    for (const definition of options) {
      const signature = getOptionWithDashesAndAliases(definition)
      const description = [spaces(longestOption - signature.length) + signature]

      if (definition.description) {
        description.push(chalk.gray(definition.description))
      }

      if (definition.type != null) {
        const _default = definition.type()

        if (_default != null) {
          description.push('[default: ' + JSON.stringify(_default) + ']')
        }
      }

      console.error(description.join('  '))
    }
  }

  console.error('')
}

function getUsages (name, {options, parameters, commands}) {
  let usage = [name]

  if (options && options.length) {
    usage = usage.concat(options.map(function (definition) {
      const valPart = definition.type != null
        ? ' <' + definition.type.name + '>'
        : ''

      return getWithBracketsParensAndEllipsis(addDashes(definition.key) + valPart, definition)
    }))
  }

  if (parameters && parameters.length) {
    usage = usage.concat(parameters.map(function (definition) {
      return getWithBracketsParensAndEllipsis('<' + definition.key + '>', definition)
    }))
  }

  let usages = [usage.join(' ')]

  if (commands) {
    for (const command of commands) {
      usages = usages.concat(getUsages(name + ' ' + command.name, command.action))
    }
  }

  return usages
}

function getNested (id, obj) {
  if (obj.commands) {
    for (const command of obj.commands) {
      obj[id] = obj[id].concat(getNested(id, command.action).filter((a) => obj[id].find((b) => b.key !== a.key)))
    }
  }

  return obj[id]
}

function getWithBracketsParensAndEllipsis (usage, {required, multiple}) {
  const opt = usage.startsWith('-')

  return (required !== true ? '[' : (opt ? '(' : '')) + usage + (required !== true ? ']' : (opt ? ')' : '')) + (multiple === true ? '...' : '')
}

function getOptionWithDashesAndAliases (definition) {
  let signature = addDashes(definition.key)

  if (definition.aliases != null && definition.aliases.length) {
    signature = definition.aliases.map((k) => addDashes(k)).join(', ') + ', ' + signature
  }

  return signature
}
