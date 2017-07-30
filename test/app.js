/**
 * @Author: Matteo Zambon <Matteo>
 * @Date:   2017-04-13 06:55:18
 * @Last modified by:   Matteo
 * @Last modified time: 2017-07-30 02:22:24
 */

'use strict'

const _ = require('lodash')
const smokesignals = require('smokesignals')

const App = {
  pkg: {
    name: require('../package').name + '-test'
  },
  api: require('./api'),
  config: {
    main: {
      packs: [
        // smokesignals.Trailpack,
        // require('trailpack-core'),
        require('trailpack-router'),
        require('trailpack-express'),
        require('trailpack-waterline'),
        require('../')
      ]
    },
    database: {
      stores: {
        db: {
          adapter: require('sails-memory'),
          migrate: 'alter'
        }
      },
      models: {
        defaultStore: 'db',
        migrate: 'alter'
      }
    },
    web: {
      express: require('express')
    }
  }
}
_.defaultsDeep(App, smokesignals.FailsafeConfig)
module.exports = App
