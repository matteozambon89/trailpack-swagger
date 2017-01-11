/*
* @Author: Matteo Zambon
* @Date:   2017-01-11 00:31:57
* @Last Modified by:   Matteo Zambon
* @Last Modified time: 2017-01-11 00:39:42
*/

'use strict'

const routes = require('./routes')

module.exports = {
  init: (app) => {
    // const swagger = app.services.SwaggerService.stripe
  },

  addRoutes: app => {
    const routerUtil = app.packs.router.util

    app.config.routes = routerUtil.mergeRoutes(routes, app.config.routes)
  }
}
