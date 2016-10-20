'use strict'
const astralRequire = require('../../../../test/fixtures/astral-require')
const Code = require('code')
const Lab = require('lab')
const loadenv = require('loadenv')
require('sinon-as-promised')(require('bluebird'))

const AWSAlreadyExistsError = astralRequire('shiva/errors/aws-already-exists-error')
const AWSAlreadyPartOfASGError = require('shiva/errors/aws-already-part-of-asg-error')
const AWSInvalidParameterTypeError = astralRequire('shiva/errors/aws-invalid-parameter-type-error')
const AWSRateLimitError = astralRequire('shiva/errors/aws-rate-limit-error')
const AWSValidationError = astralRequire('shiva/errors/aws-validation-error')
const lab = exports.lab = Lab.script()
const Util = astralRequire('shiva/models/util')
loadenv.restore()

const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

describe('shiva/models/utils unit test', function () {
  describe('castAWSError', function () {
    it('should cast AWSAlreadyExistsError', function (done) {
      const awsError = new Error()
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
      const awsError = new Error()
      awsError.code = 'ValidationError'
      try {
        Util.castAWSError(awsError)
      } catch (err) {
        expect(err).to.be.an.instanceof(AWSValidationError)
        expect(err.data.originalError).to.equal(awsError)
        done()
      }
    })

    it('should cast AWSRateLimitError', function (done) {
      const awsError = new Error('EC2 Request limit exceeded.')
      awsError.code = 'ValidationError'
      try {
        Util.castAWSError(awsError)
      } catch (err) {
        expect(err).to.be.an.instanceof(AWSRateLimitError)
        expect(err.data.originalError).to.equal(awsError)
        done()
      }
    })

    it('should cast AWSInvalidParameterTypeError', function (done) {
      const awsError = new Error()
      awsError.code = 'InvalidParameterType'
      try {
        Util.castAWSError(awsError)
      } catch (err) {
        expect(err).to.be.an.instanceof(AWSInvalidParameterTypeError)
        expect(err.data.originalError).to.equal(awsError)
        done()
      }
    })

    it('should cast AWSAlreadyPartOfASGError', function (done) {
      const awsError = new Error('The Instance: i-79600761 is already part of AutoScalingGroup:gamma-dock-pool')
      awsError.code = 'ValidationError'
      try {
        Util.castAWSError(awsError)
      } catch (err) {
        expect(err).to.be.an.instanceof(AWSAlreadyPartOfASGError)
        expect(err.data.originalError).to.equal(awsError)
        done()
      }
    })
  }) // end'castAWSError
}) // end 'shiva'
