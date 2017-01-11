/*
* @Author: Matteo Zambon
* @Date:   2017-01-10 23:13:18
* @Last Modified by:   Matteo Zambon
* @Last Modified time: 2017-01-11 01:27:33
*/

'use strict'

module.exports = [

  {
    method: ['GET'],
    path: '/api/docs',
    handler: 'SwaggerController.doc'
  },

  {
    method: ['GET'],
    path: '/api/explorer',
    handler: {
      directory: {
        path: 'views/docs'
      }
    }
  }

]
