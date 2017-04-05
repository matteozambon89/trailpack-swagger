'use strict'

const _ = require('lodash')
const smokesignals = require('smokesignals')

const Api = require('./api')

const App = {
  pkg: {
    name: require('../package').name + '-test'
  },
  api: Api,
  config: {
    main: {
      packs: [
        //smokesignals.Trailpack,
        require('trailpack-express'),
        require('trailpack-waterline'),
        require('trailpack-router'),
        require('../')
      ]
    },
    database: {
      stores: {
        dev: {
          adapter: require('waterline-sqlite3'),
          migrate: 'drop'
        }
      },
      models: {
        defaultStore: 'dev',
        migrate: 'drop'
      }
    },
    web: {
      express: require('express')
    }
  }
}
_.defaultsDeep(App, smokesignals.FailsafeConfig)
module.exports = App
