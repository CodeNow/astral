'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var Code = require('code')
var expect = Code.expect
var sinon = require('sinon')
var astralRequire = require(process.env.ASTRAL_ROOT + '../test/fixtures/astral-require')

require('loadenv')({ debugName: 'astral:test' })

var DatabaseError = astralRequire('common/errors/database-error')
var UniqueError = astralRequire('common/errors/unique-error')

describe('common', function () {
  describe('errors', function () {
    describe('UniqueError', function () {
      beforeEach(function (done) {
        sinon.spy(DatabaseError.prototype, '_setPropertiesFromKnexError')
        done()
      })

      afterEach(function (done) {
        DatabaseError.prototype._setPropertiesFromKnexError.restore()
        done()
      })

      it('should pass the error to its super constructor', function (done) {
        var knexError = { detail: 'unique violation' }
        var newError = new UniqueError(knexError)
        expect(newError).to.exist()
        expect(DatabaseError.prototype._setPropertiesFromKnexError.calledWith(knexError))
          .to.be.true()
        done()
      })
    }) // end 'UniqueError'
  }) // end 'errors'
}) // end 'common'
