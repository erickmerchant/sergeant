var assert = require('assert')
var describe = require('mocha').describe
var it = require('mocha').it
var main = require('../code/main.js')
var Application = require('../code/application.js')
var parse = require('../code/parse.js')

describe('main', function () {
  it('should make applications', function (done) {
    assert.deepEqual(main({}), new Application({}, parse(process.argv.slice(2))))

    done()
  })

  it('should parse', function (done) {
    assert.deepEqual(main.parse(), parse(process.argv.slice(2)))

    done()
  })
})
