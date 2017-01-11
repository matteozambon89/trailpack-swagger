# trailpack-swagger

[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][codeclimate-image]][codeclimate-url]
[![Donate][donate-image]][donate-url]

Use Swagger UI in your Trails project.

## Dependencies and Compatibilities

- TrailsJS
- Waterline
- Express
- Footprint
- Passport (optional)
- Swagger UI (the `/dist` of the repository will do)
- Swagger 2.0

## Install

```sh
$ npm install --save trailpack-swagger
```

## Configure

### Main

```js
// config/main.js
module.exports = {
  packs: [
    // ... other trailpacks
    require('trailpack-swagger')
  ]
}
```

### Swagger Config

All these values are explained in the [Swagger Specification](http://swagger.io/specification/).

```js
// config/swagger.js
module.exports = {

  /**
   * The title of the application.
   * @type {String}
   */
  title: 'Project API',
  /**
   * A short description of the application. GFM syntax can be used for rich text representation.
   * @type {String}
   */
  description: 'My APIs',
  /**
   * The Terms of Service for the API.
   * @type {String}
   */
  termsOfService: 'My ToS',
  /**
   * The contact information for the exposed API.
   * @type {Object}
   */
  contact: {
    /**
     * The identifying name of the contact person/organization.
     * @type {String}
     */
    name: 'Matteo Zambon',
    /**
     * The URL pointing to the contact information. MUST be in the format of a URL.
     * @type {String}
     */
    url: 'https://github.com/matteozambon89',
    /**
     * The email address of the contact person/organization. MUST be in the format of an email address.
     * @type {String}
     */
    email: 'matteo@thetophat.org'
  },
  /**
   * The license information for the exposed API.
   * @type {Object}
   */
  license: {
    /**
     * The license name used for the API.
     * @type {String}
     */
    name: 'MIT',
    /**
     * A URL to the license used for the API. MUST be in the format of a URL.
     * @type {String}
     */
    url: 'https://opensource.org/licenses/MIT'
  },
  /**
   * Provides the version of the application API (not to be confused with the specification version).
   * @type {String}
   */
  version: '1.0.0',
  /**
   * The base path on which the API is served, which is relative to the host. If it is not included, the API is served directly under the host. The value MUST start with a leading slash (/). The basePath does not support path templating.
   * @type {String}
   */
  basePath: '/api/v1',
  /**
   * The transfer protocol of the API. Values MUST be from the list: "http", "https", "ws", "wss". If the schemes is not included, the default scheme to be used is the one used to access the Swagger definition itself.
   * @type {Array}
   */
  schemes: ['http'],
  /**
   * A list of MIME types the APIs can consume. This is global to all APIs but can be overridden on specific API calls. Value MUST be as described under Mime Types.
   * @type {Array}
   */
  consumes: ['application/json'],
  /**
   * A list of MIME types the APIs can produce. This is global to all APIs but can be overridden on specific API calls. Value MUST be as described under Mime Types.
   * @type {Array}
   */
  produces: ['application/json'],
  /**
   * The host (name or ip) serving the API. This MUST be the host only and does not include the scheme nor sub-paths. It MAY include a port. If the host is not included, the host serving the documentation is to be used (including the port). The host does not support path templating.
   * @type {String}
   */
  host: '0.0.0.0',
  /**
   * The host port serving the API. This MUST be the port only.
   * @type {Number}
   */
  port: 3000,
  /**
   * Security scheme definitions that can be used across the specification.
   * @type {Object}
   */
  securityDefinitions: {
    apiKey: {
      type: 'apiKey',
      name: 'api_key',
      in: 'header'
    },
    basic: {
      type: 'basic'
    },
    oauth: {
      type: 'oauth2',
      authorizationUrl: 'http://swagger.io/api/oauth/dialog',
      flow: 'implicit',
      scopes: {
        'write:pets': 'modify pets in your account',
        'read:pets': 'read your pets'
      }
    }
  },
  /**
   * A declaration of which security schemes are applied for the API as a whole. The list of values describes alternative security schemes that can be used (that is, there is a logical OR between the security requirements). Individual operations can override this definition.
   * @type {Object}
   */
  security: {
    api_key: [],
    basic: [],
    oauth: [
      'write:pets',
      'read:pets'
    ]
  }
}
```

All the config properties are optional so if you wish let trailpack-swagger parse these for you simply pass an empty config:

```
// config/swagger.js
module.exports = {
};
```

### Swagger UI

- Get the latest [Swagger UI](https://github.com/swagger-api/swagger-ui)
- Copy the content of `swagger-ui/dist` into `my-project/views/docs`
- Inside `my-project/views/docs` you should see a file `index.html`
- Open `my-project/views/index.html`
- Change line `:41` from `url = "http://petstore.swagger.io/v2/swagger.json";` to `url = "/api/docs";`

## Routes

- `/api/doc` will return the computed Swagger object as JSON
- `/api/explorer` will display the Swagger UI

## Credits

- Written based on [trailpack-swagger](https://github.com/trailsjs/trailpack-swagger)
- [Swagger](http://swagger.io) for both Specs and UI

## Please Contribute!

I'm happy to receive contributions of any kind!

### Contribute in what matters

- [ ] Compatibility with TrailsJS 2.x
- [ ] Test the support of hapi.js
- [ ] Test the support of Sequelize
- [ ] Swagger Editor to generate Models and Footprint APIs from a JSON

## Did you like my work?
Help me out with a little donation, press on the button below.
[![Donate][donate-image]][donate-url]

[npm-image]: https://img.shields.io/npm/v/trailpack-swagger.svg?style=flat-square
[npm-url]: https://npmjs.org/package/trailpack-swagger
[ci-image]: https://img.shields.io/travis/matteozambon89/trailpack-swagger/master.svg?style=flat-square
[ci-url]: https://travis-ci.org/matteozambon89/trailpack-swagger
[daviddm-image]: http://img.shields.io/david/matteozambon89/trailpack-swagger.svg?style=flat-square
[daviddm-url]: https://david-dm.org/matteozambon89/trailpack-swagger
[codeclimate-image]: https://img.shields.io/codeclimate/github/matteozambon89/trailpack-swagger.svg?style=flat-square
[codeclimate-url]: https://codeclimate.com/github/matteozambon89/trailpack-swagger
[donate-image]: https://img.shields.io/badge/Donate-PayPal-green.svg
[donate-url]: matteo.zambon.89@gmail.com
