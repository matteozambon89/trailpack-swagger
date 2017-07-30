/**
 * @Author: Matteo Zambon <Matteo>
 * @Date:   2017-05-24 06:10:23
 * @Last modified by:   Matteo
 * @Last modified time: 2017-07-29 02:40:36
 */

'use strict'

const {expect} = require('chai')

describe('Trails App', () => {
  it('should boot', () => {
    expect(global.app.started).to.exist
    expect(global.app.started).to.be.true
    expect(global.app.stopped).to.exist
    expect(global.app.stopped).to.be.false
  })
})
