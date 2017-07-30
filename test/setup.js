/**
 * @Author: Matteo Zambon <Matteo>
 * @Date:   2017-07-30 01:31:17
 * @Last modified by:   Matteo
 * @Last modified time: 2017-07-30 01:31:35
 */

'use strict'

const TrailsApp = require('trails')

before(() => {
  global.app = new TrailsApp(require('./app'))
  return global.app.start().catch(global.app.stop)
})

after(() => {
  return global.app.stop()
})
