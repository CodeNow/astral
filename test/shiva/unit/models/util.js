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

var Util = astralRequire('shiva/models/util')
var AWSAlreadyExistsError = astralRequire('shiva/errors/aws-already-exists-error')
var AWSInvalidParameterTypeError = astralRequire('shiva/errors/aws-invalid-parameter-type-error')
var AWSValidationError = astralRequire('shiva/errors/aws-validation-error')

describe('shiva', function () {
  describe('models', function () {
    describe('Util', function () {
      describe('castAWSError', function () {
        it('should cast AWSAlreadyExistsError', function (done) {
          var awsError = new Error()
          awsError.code = 'AlreadyExists'
          try {
            Util.castAWSError(awsError)
          } catch (err) {
            expect(err).to.be.an.instanceof(AWSAlreadyExistsError)
            expect(err.data.originalError).to.equal(awsError)
            done()
          }
        })

        it('should cast AWSValidationError', function (done) {
          var awsError = new Error()
          awsError.code = 'ValidationError'
          try {
            Util.castAWSError(awsError)
          } catch (err) {
            expect(err).to.be.an.instanceof(AWSValidationError)
            expect(err.data.originalError).to.equal(awsError)
            done()
          }
        })

        it('should cast AWSInvalidParameterTypeError', function (done) {
          var awsError = new Error()
          awsError.code = 'InvalidParameterType'
          try {
            Util.castAWSError(awsError)
          } catch (err) {
            expect(err).to.be.an.instanceof(AWSInvalidParameterTypeError)
            expect(err.data.originalError).to.equal(awsError)
            done()
          }
        })
      }) // end'castAWSError
    }) // end 'Util'
  }) // end 'models'
}) // end 'shiva'
