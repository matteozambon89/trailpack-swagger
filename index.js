'use strict'

const Trailpack = require('trailpack')
const lib = require('./lib')
const _ = require('lodash')

module.exports = class SwaggerTrailpack extends Trailpack {

  /**
   * Check express4/5 is used, check waterline is used and verify swagger configuration
   */
  validate () {
    if (!_.includes(_.keys(this.app.packs), 'express')) {
      return Promise.reject(new Error('This Trailpack only works for express!'))
    }

    if (!_.includes(_.keys(this.app.packs), 'waterline')) {
      return Promise.reject(new Error('This Trailpack only works for waterline!'))
    }

    if (!this.app.config.swagger) {
      return Promise.reject(new Error('No configuration found at config.swagger!'))
    }

    return Promise.resolve()
  }

  /**
   * Initialize Swagger
   */
  configure () {
    lib.Swagger.init(this.app)
    lib.Swagger.addRoutes(this.app)

    return Promise.resolve()
  }

  constructor (app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

