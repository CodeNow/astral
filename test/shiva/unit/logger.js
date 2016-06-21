'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var Code = require('code')
var expect = Code.expect

var loadenv = require('loadenv')
loadenv.restore()
loadenv({ project: 'shiva', debugName: 'astral:shiva:test' })

var logger = require(process.env.ASTRAL_ROOT + 'shiva/logger')

describe('shiva', function () {
  describe('logger', function () {
    describe('serializers', function () {
      describe('job', function () {
        it('should serialize non-instance fields', function (done) {
          var job = { a: 'a', b: 'b', c: 'foo' }
          expect(logger.serializers.job(job)).to.deep.equal(job)
          done()
        })

        it('should limit `instances` to specific fields', function (done) {
          var job = {
            instance: {
              ImageId: 'image-id',
              InstanceId: 'instance-id',
              InstanceType: 'instance-type',
              KeyName: 'key-name',
              PrivateIpAddress: 'private-ip-address',
              SubnetId: 'subnet-id',
              VpcId: 'vpc-id',
              NotThere: 'woo',
              TotesNotThere: {
                Nope: 'hahaha'
              }
            }
          }

          var expectedFields = [
            'ImageId', 'InstanceId', 'InstanceType', 'KeyName',
            'PrivateIpAddress', 'SubnetId', 'VpcId'
          ]
          var unexpectedFields = [
            'NotThere', 'TotesNotThere'
          ]

          var result = logger.serializers.job(job)
          expectedFields.forEach(function (field) {
            expect(result.instance[field], field)
              .to.equal(job.instance[field])
          })
          unexpectedFields.forEach(function (field) {
            expect(result.instance[field]).to.not.exist()
          })

          done()
        })

        it('should serialize non-array `instances` directly', function (done) {
          var job = { instances: 'not-an-array' }
          expect(logger.serializers.job(job).instances).to.equal(job.instances)
          done()
        })
      }) // end 'job'
    }) // end 'serializers'
  }) // end 'logger'
}) // end 'shiva'
