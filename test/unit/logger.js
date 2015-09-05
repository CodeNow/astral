'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

require('loadenv')('shiva:test');

var bunyan = require('bunyan');
var logger = require('logger');
var Bunyan2Loggly = require('bunyan-loggly').Bunyan2Loggly;

describe('logger', function() {
  describe('getStreams', function() {
    it('should include loggly when `LOGGLY_TOKEN` exists', function(done) {
      var oldLogglyToken = process.env.LOGGLY_TOKEN;
      delete process.env.LOGGLY_TOKEN;
      var streams = logger.getStreams();
      expect(streams.length).to.equal(1);
      expect(streams[0].stream).to.equal(process.stdout);
      process.env.LOGGLY_TOKEN = oldLogglyToken;
      done();
    });

    it('should not include loggly without `LOGGLY_TOKEN`', function(done) {
      var oldLogglyToken = process.env.LOGGLY_TOKEN;
      process.env.LOGGLY_TOKEN = 'abcdefg';
      var streams = logger.getStreams();
      expect(streams.length).to.equal(2);
      expect(streams[1].stream).to.be.an.instanceof(Bunyan2Loggly);
      process.env.LOGGLY_TOKEN = oldLogglyToken;
      done();
    });
  });

  describe('serializers', function() {
    describe('err', function() {
      beforeEach(function (done) {
        sinon.spy(bunyan.stdSerializers, 'err');
        done();
      });

      afterEach(function (done) {
        bunyan.stdSerializers.err.restore();
        done();
      });

      it('should report data', function(done) {
        var data = { foo: 'bar' };
        var error = new Error('some error');
        error.data = data;
        var result = logger.serializers.err(error);
        expect(result.data).to.deep.equal(data);
        done();
      });

      it('should report all default fields', function(done) {
        var error = new Error('error without data');
        var result = logger.serializers.err(error);
        expect(bunyan.stdSerializers.err.calledWith(error)).to.be.true();
        expect(result).to.deep.equal(bunyan.stdSerializers.err.returnValues[0]);
        done();
      });
    }); // end 'err'

    describe('job', function() {
      it('should serialize non-instance fields', function(done) {
        var job = { a: 'a', b: 'b', c: 'foo' };
        expect(logger.serializers.job(job)).to.deep.equal(job);
        done();
      });

      it('should limit `instances` to specific fields', function(done) {
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
        };

        var expectedFields = [
          'ImageId', 'InstanceId', 'InstanceType', 'KeyName',
          'PrivateIpAddress', 'SubnetId', 'VpcId'
        ];
        var unexpectedFields = [
          'NotThere', 'TotesNotThere'
        ];

        var result = logger.serializers.job(job);
        expectedFields.forEach(function (field) {
          expect(result.instance[field], field)
            .to.equal(job.instance[field]);
        });
        unexpectedFields.forEach(function (field) {
          expect(result.instance[field]).to.not.exist();
        });

        done();
      });

      it('should serialize non-array `instances` directly', function(done) {
        var job = { instances: 'not-an-array' };
        expect(logger.serializers.job(job).instances).to.equal(job.instances);
        done();
      });
    }); // end 'job'
  }); // end 'serializers'
}); // end 'logger'
