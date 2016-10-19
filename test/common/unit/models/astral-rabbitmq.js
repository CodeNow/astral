'use strict'
const Code = require('code')
const Lab = require('lab')
const loadenv = require('loadenv')
require('sinon-as-promised')(require('bluebird'))

const astralRequire = require('../../../../test/fixtures/astral-require')

const publisher = astralRequire('common/models/astral-rabbitmq')
const lab = exports.lab = Lab.script()
loadenv.restore()

const describe = lab.describe
const expect = Code.expect
const it = lab.it
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

describe('Astral publisher unit test ', function () {
  it('should provide event and task apis', (done) => {
    expect(publisher.publishTask).to.exist()
    expect(publisher.publishEvent).to.exist()
    expect(publisher.connect).to.exist()
    done()
  })
}) // end 'common'
