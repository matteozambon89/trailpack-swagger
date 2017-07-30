/*
* @Author: Matteo Zambon
* @Date:   2017-01-10 17:09:27
* @Last Modified by:   Matteo Zambon
* @Last Modified time: 2017-01-10 23:13:13
*/

'use strict'

module.exports = {

  /**
   * The title of the application.
   * @type {String}
   */
//   title: 'Project API',
  /**
   * A short description of the application. GFM syntax can be used for rich text representation.
   * @type {String}
   */
//   description: 'My APIs',
  /**
   * The Terms of Service for the API.
   * @type {String}
   */
//   termsOfService: 'My ToS',
  /**
   * The contact information for the exposed API.
   * @type {Object}
   */
//   contact: {
  /**
     * The identifying name of the contact person/organization.
     * @type {String}
     */
//     name: '',
  /**
     * The URL pointing to the contact information. MUST be in the format of a URL.
     * @type {String}
     */
//     url: '',
  /**
     * The email address of the contact person/organization. MUST be in the format of an email address.
     * @type {String}
     */
//     email: ''
//   },
  /**
   * The license information for the exposed API.
   * @type {Object}
   */
//   license: {
  /**
     * The license name used for the API.
     * @type {String}
     */
//     name: '',
  /**
     * A URL to the license used for the API. MUST be in the format of a URL.
     * @type {String}
     */
//     url: ''
//   },
  /**
   * Provides the version of the application API (not to be confused with the specification version).
   * @type {String}
   */
//   version: '',
  /**
   * The base path on which the API is served, which is relative to the host. If it is not included, the API is served directly under the host. The value MUST start with a leading slash (/). The basePath does not support path templating.
   * @type {String}
   */
//   basePath: '',
  /**
   * The transfer protocol of the API. Values MUST be from the list: "http", "https", "ws", "wss". If the schemes is not included, the default scheme to be used is the one used to access the Swagger definition itself.
   * @type {Array}
   */
//   schemes: ['http'],
  /**
   * A list of MIME types the APIs can consume. This is global to all APIs but can be overridden on specific API calls. Value MUST be as described under Mime Types.
   * @type {Array}
   */
//   consumes: ['application/json'],
  /**
   * A list of MIME types the APIs can produce. This is global to all APIs but can be overridden on specific API calls. Value MUST be as described under Mime Types.
   * @type {Array}
   */
//   produces: ['application/json'],
  /**
   * The host (name or ip) serving the API. This MUST be the host only and does not include the scheme nor sub-paths. It MAY include a port. If the host is not included, the host serving the documentation is to be used (including the port). The host does not support path templating.
   * @type {String}
   */
//   host: '0.0.0.0',
  /**
   * The host port serving the API. This MUST be the port only.
   * @type {Number}
   */
//   port: 3000,
  /**
   * Security scheme definitions that can be used across the specification.
   * @type {Object}
   */
//   securityDefinitions: {
//     apiKey: {
//       type: 'apiKey',
//       name: 'api_key',
//       in: 'header'
//     },
//     basic: {
//       type: 'basic'
//     },
//     oauth: {
//       type: 'oauth2',
//       authorizationUrl: 'http://swagger.io/api/oauth/dialog',
//       flow: 'implicit',
//       scopes: {
//         'write:pets': 'modify pets in your account',
//         'read:pets': 'read your pets'
//       }
//     }
//   },
  /**
   * A declaration of which security schemes are applied for the API as a whole. The list of values describes alternative security schemes that can be used (that is, there is a logical OR between the security requirements). Individual operations can override this definition.
   * @type {Object}
   */
//   security: {
//     api_key: [],
//     oauth: [
//       'write:pets',
//       'read:pets'
//     ]
//   }
}
