/**
 * @Author: Matteo Zambon <Matteo>
 * @Date:   2017-05-24 06:10:23
 * @Last modified by:   Matteo
 * @Last modified time: 2017-07-30 02:38:24
 */

'use strict'

const expect = require('chai').expect

describe('Trails App', () => {
  it('should boot', () => {
    expect(global.app.started).to.exist
    expect(global.app.started).to.be.true
    expect(global.app.stopped).to.exist
    expect(global.app.stopped).to.be.false
  })
})
