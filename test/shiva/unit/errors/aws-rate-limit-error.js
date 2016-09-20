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

var WorkerError = require('error-cat/errors/worker-error')

var AWSRateLimitError = astralRequire('shiva/errors/aws-already-exists-error')

describe('shiva', function () {
  describe('errors', function () {
    describe('AWSRateLimitError', function () {
      it('should extend WorkerError', function (done) {
        var err = new AWSRateLimitError(new Error('WOW'))
        expect(err).to.be.an.instanceof(WorkerError)
        done()
      })

      it('should set the message of the given error', function (done) {
        var msg = 'This is an error message'
        var err = new AWSRateLimitError(new Error(msg))
        expect(err.message).to.equal(msg)
        done()
      })
    }) // end 'AWSRateLimitError'
  }) // end 'errors'
}) // end 'shiva'
