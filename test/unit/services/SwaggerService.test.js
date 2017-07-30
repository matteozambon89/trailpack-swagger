/**
 * @Author: Matteo Zambon <Matteo>
 * @Date:   2017-01-11 05:21:35
 * @Last modified by:   Matteo
 * @Last modified time: 2017-07-30 02:26:08
 */

'use strict'
/* global describe, it */
const {expect} = require('chai')

describe('SwaggerService', () => {
  it('should exist', () => {
    expect(global.app).to.have.nested.property('api.services.SwaggerService')
  })
})
