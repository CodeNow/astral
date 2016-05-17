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

var AstralError = astralRequire('common/errors/astral-error')
var DatabaseError = astralRequire('common/errors/database-error')

describe('common', function () {
  describe('errors', function () {
    describe('DatabaseError', function () {
      describe('class', function () {
        it('should extend AstralError', function (done) {
          expect(DatabaseError.prototype).to.be.an.instanceof(AstralError)
          done()
        })
      }) // end 'class'

      describe('constructor', function () {
        beforeEach(function (done) {
          sinon.spy(DatabaseError.prototype, '_setPropertiesFromKnexError')
          done()
        })

        afterEach(function (done) {
          DatabaseError.prototype._setPropertiesFromKnexError.restore()
          done()
        })

        it('should call `_setPropertiesFromKnexError`', function (done) {
          var knexError = { neat: 'wow' }
          var newError = new DatabaseError(knexError)
          expect(newError).to.exist()
          expect(DatabaseError.prototype._setPropertiesFromKnexError.calledWith(knexError))
            .to.be.true()
          done()
        })
      }) // end 'constructor'

      describe('_setPropertiesFromKnexError', function () {
        it('should accept no arguments', function (done) {
          var err = new DatabaseError()
          expect(err.message).to.equal('Database Error')
          done()
        })

        it('should set all properties from the knex error', function (done) {
          var knexError = { foo: 'bar', hoo: 'rar' }
          var err = new DatabaseError(knexError)
          expect(err.foo).to.equal(knexError.foo)
          expect(err.hoo).to.equal(knexError.hoo)
          expect(err.message).to.equal('Database Error')
          done()
        })

        it('should use knex-error message', function (done) {
          var knexError = { message: 'neatoz' }
          var err = new DatabaseError(knexError)
          expect(err.message).to.equal(knexError.message)
          done()
        })

        it('should use knex-error detail without a message', function (done) {
          var knexError = { detail: 'whoooooboy' }
          var err = new DatabaseError(knexError)
          expect(err.message).to.equal(knexError.detail)
          done()
        })
      }) // end '_setPropertiesFromKnexError'
    }) // end 'DatabaseError'
  }) // end 'errors'
}) // end 'common'
