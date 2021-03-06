'use strict'

'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var Code = require('code')
var expect = Code.expect

var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')
var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var WorkerStopError = require('error-cat/errors/worker-stop-error')

var AWSAlreadyExistsError = astralRequire('shiva/errors/aws-already-exists-error')

describe('shiva', function () {
  describe('errors', function () {
    describe('AWSAlreadyExistsError', function () {
      it('should extend WorkerStopError', function (done) {
        var err = new AWSAlreadyExistsError(new Error('WOW'))
        expect(err).to.be.an.instanceof(WorkerStopError)
        done()
      })

      it('should set the message of the given error', function (done) {
        var msg = 'This is an error message'
        var err = new AWSAlreadyExistsError(new Error(msg), {test: 'foo'})
        expect(err.message).to.equal(msg)
        done()
      })

      it('should set the data of the given error', function (done) {
        var msg = 'This is an error message'
        var err = new AWSAlreadyExistsError(new Error('foo'), {test: msg})
        expect(err.data.test).to.equal(msg)
        done()
      })
    }) // end 'AWSAlreadyExistsError'
  }) // end 'errors'
}) // end 'shiva'
