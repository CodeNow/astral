'use strict'

var RabbitMQ = require('ponos/lib/rabbitmq')
var Promise = require('bluebird')

module.exports = {
  getClient: function getClient () {
    return Promise.try(() => {
      var rabbit = new RabbitMQ({})
      return rabbit.connect()
        .return(rabbit)
    })
      .disposer((rabbit) => {
        return rabbit.disconnect()
      })
  }
}
