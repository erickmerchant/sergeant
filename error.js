const chalk = require('chalk')
const { process, console } = require('./src/globals')

module.exports = function (error) {
  process.exitCode = 1

  if (typeof error === 'object' && error instanceof Error) {
    if (error.stack != null) {
      const stack = error.stack.split('\n')

      console.error(chalk.red(stack.shift()))

      for (const parts of stack.map((line) => line.match(/^(.*?)(\(.*\))?$/))) {
        console.error(chalk.gray(parts[1]) + (parts[2] != null ? parts[2] : ''))
      }
    } else {
      console.error(chalk.red(error.toString()))
    }
  }
}
