'use strict'
/* global describe, it */
const assert = require('assert')

describe('SwaggerController', () => {
  it('should exist', () => {
    assert(global.app.api.controllers['SwaggerController'])
  })
})
