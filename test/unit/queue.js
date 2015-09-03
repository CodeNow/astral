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
var queue = require('queue');

describe('queue', function() {
  it('should include `cluster-provision`', function(done) {
    var queueName = 'cluster-provision';
    expect(queue.queues).to.contain(queueName);
    done();
  });

  it('should include `cluster-instance-provision`', function(done) {
    var queueName = 'cluster-instance-provision';
    expect(queue.queues).to.contain(queueName);
    done();
  });

  it('should include `cluster-instance-wait`', function(done) {
    var queueName = 'cluster-instance-wait';
    expect(queue.queues).to.contain(queueName);
    done();
  });

  it('should include `cluster-instance-tag`', function(done) {
    var queueName = 'cluster-instance-tag';
    expect(queue.queues).to.contain(queueName);
    done();
  });

  it('should include `cluster-instance-write`', function(done) {
    var queueName = 'cluster-instance-write';
    expect(queue.queues).to.contain(queueName);
    done();
  });

  it('should include `cluster-instance-terminate`', function(done) {
    var queueName = 'cluster-instance-terminate';
    expect(queue.queues).to.contain(queueName);
    done();
  });
}); // end 'queue'
