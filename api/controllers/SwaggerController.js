'use strict'

const Controller = require('trails-controller')

/**
 * @module SwaggerController
 * @description Generated Trails.js Controller.
 */
module.exports = class SwaggerController extends Controller {

  doc(req, res) {
    const swaggerDoc = this.app.services.SwaggerService.getSwaggerDoc()

    return res.json(swaggerDoc)
  }

}

