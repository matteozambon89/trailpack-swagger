'use strict'

const faker = require('faker')
const objectPath = require('object-path')
const inflect = require('i')()

const Service = require('trails-service')

let modelMap = []
let modelRelations = {}
let modelPopulates = {}
let cachedModels = {}

/**
 * @module SwaggerService
 * @description Service to generate Swagger documentation
 */
module.exports = class SwaggerService extends Service {

// Example

  extractExampleDirective (propertyExample) {
    let directive = {}

    // Clean Example
    let propertyExampleClean = propertyExample.replace(/^{{|}}$/g, '')

    // Check if there's any after
    if (propertyExampleClean.match(/\|.*$/)) {
      directive.after = propertyExampleClean.split('|')
      directive.after.shift()

      propertyExampleClean = propertyExampleClean.replace(/\|.*$/, '')
    }
    // Check if it's a self
    if (propertyExampleClean.match(/^self\./)) {
      directive.self = propertyExampleClean.replace(/^self\./, '')
    }
    // Check if it's a model
    else if (propertyExampleClean.match(/^model\.[a-zA-Z]/)) {
      const modelName = propertyExampleClean.replace(/^model\./, '')

      directive.model = modelName
    }
    // Faker
    else {
      const directiveFaker = propertyExampleClean.split('.')

      if (directiveFaker.length === 2 && faker[directiveFaker[0]] && typeof faker[directiveFaker[0]][directiveFaker[1]] === 'function') {
        directive.faker = faker[directiveFaker[0]][directiveFaker[1]]()
      }
      else {
        directive.faker = faker.fake(propertyExample)
      }
    }

    return directive
  }

  genPropertyExample (propertyExample, modelExample, withRel) {
    let example = null

    if (typeof propertyExample === 'string') {
      const directive = this.extractExampleDirective(propertyExample)

      if (directive.faker) {
        example = directive.faker
      }
      else if (directive.self) {
        if (objectPath.has(modelExample, directive.self)) {
          example = objectPath.get(modelExample, directive.self)
        }
        else {
          return null
        }
      }
      else if (directive.model && !withRel) {
        return null
      }
      else if (directive.model && withRel) {
        if (!cachedModels[directive.model]) {

          cachedModels[directive.model] = this.getModelExample(this.app.api.models[directive.model], false)
        }

        example = cachedModels[directive.model]
      }

      if (directive.after) {
        for (const directiveAfterIndex in directive.after) {
          const directiveAfter = directive.after[directiveAfterIndex]

          switch (directiveAfter) {
          case 'int':
            example = parseInt(example)
            break
          }
        }
      }

      return example
    }
    else if (Array.isArray(propertyExample)) {
      example = []

      for (const itemIndex in propertyExample) {
        const item = propertyExample[itemIndex]

        example.push(this.genPropertyExample(item, modelExample, false))
      }
    }
  }

  getModelExample(model, withRel) {
    if (!model.example) {
      return undefined
    }

    const modelExampleMap = model.example()
    const modelExample = {}

    for (const propertyName in modelExampleMap) {
      const propertyExample = modelExampleMap[propertyName]

      modelExample[propertyName] = this.genPropertyExample(propertyExample, modelExample, withRel)
    }

    return modelExample
  }

// End Example

// Swagger Doc

  getInfoTitle(config) {
    if (config.swagger.title) {
      return config.swagger.title
    }
    else {
      return 'Project API'
    }
  }

  getInfoDescription(config) {
    if (config.swagger.description) {
      return config.swagger.description
    }
    else {
      return undefined
    }
  }

  getInfoTermsOfService(config) {
    if (config.swagger.termsOfService) {
      return config.swagger.termsOfService
    }
    else {
      return undefined
    }
  }

  getInfoContact(config) {
    if (config.swagger.contact) {
      return config.swagger.contact
    }
    else {
      return undefined
    }
  }

  getInfoLicense(config) {
    if (config.swagger.license) {
      return config.swagger.license
    }
    else {
      return undefined
    }
  }

  getInfoVersion(config) {
    if (config.swagger.version) {
      return config.swagger.version
    }
    else if (config.footprints && config.footprints.prefix) {
      const matches = config.footprints.prefix.match(/(^|\/)v[0-9\.]+($|\/)/)

      if (matches) {
        return matches[0].replace(/\//g, '')
      }
    }

    return 'v1'
  }

  getInfo(config) {
    const info = {}

    info.title = this.getInfoTitle(config)
    info.description = this.getInfoDescription(config)
    info.termsOfService = this.getInfoTermsOfService(config)
    info.contact = this.getInfoContact(config)
    info.license = this.getInfoLicense(config)
    info.version = this.getInfoVersion(config)

    return info
  }

  getBasePath(config) {
    if (config.swagger.basePath) {
      return config.swagger.basePath
    }
    else if (config.footprints && config.footprints.prefix) {
      return config.footprints.prefix
    }
    else {
      return '/api'
    }
  }

  getSchemes(config) {
    if (config.swagger.schemes) {
      return config.swagger.schemes
    }
    else if (config.web && config.web.ssl) {
      return [
        'http',
        'https'
      ]
    }
    else {
      return [
        'http'
      ]
    }
  }

  getConsumes(config) {
    return config.swagger.consumes || [
      'application/json'
    ]
  }

  getProduces(config) {
    return config.swagger.produces || [
      'application/json'
    ]
  }

  getHost(config) {
    if (config.swagger.host) {
      return config.swagger.host + ':' + this.getPort(config)
    }
    else if (config.web && config.web.host) {
      return config.web.host + ':' + this.getPort(config)
    }
    else {
      return '0.0.0.0' + ':' + this.getPort(config)
    }
  }

  getPort(config) {
    if (config.swagger.port) {
      return config.swagger.port
    }
    else if (config.web && config.web.port) {
      return config.web.port
    }
    else {
      return 3000
    }
  }

  getSecurityDefinitions(config) {
    if (config.swagger.securityDefinitions) {
      return config.swagger.securityDefinitions
    }
    else if (config.passport && config.passport.strategies && config.passport.strategies.jwt) {
      return {
        jwt: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization'
        }
      }
    }
    else {
      return {}
    }
  }

  getSecurity(config) {
    if (config.swagger.security) {
      return config.swagger.security
    }
    else {
      return undefined
    }
  }

  getTags(config, doc) {
    const tags = []

    if (config.passport && config.passport.strategies && config.passport.strategies.jwt) {
      tags.push({
        'name': 'Auth'
      })
      tags.push({
        'name': 'JWT'
      })
      tags.push({
        'name': 'Passport'
      })
    }

    for (const modelName in this.app.api.models) {
      tags.push({
        'name': modelName
      })
    }

    tags.sort((a, b) => {
      return (a.name > b.name)
    })

    return tags
  }

  getDefinitions(config, doc) {
    const definitions = {}

    definitions['x-any'] = {
      'properties': {}
    }

    const models = this.app.api.models

    for (const modelName in models) {
      modelRelations[modelName] = []
      modelPopulates[modelName] = []

      // Get Models
      const model = models[modelName]
      // Get Schema
      const modelProperties = model.schema(this.app)
      // Get Description
      const modelDescription = model.description ? model.description() : {}

      // Swagger Definition
      const swaggerDefinition = {
        type: 'object',
        required: [],
        description: modelDescription.model || (inflect.titleize(modelName) + ' object'),
        properties: null
      }

      for (const propertyName in modelProperties) {
        const property = modelProperties[propertyName]

        const prop = {}

        // Description
        prop.description = modelName + ' ' + inflect.titleize(propertyName)
        if (modelDescription.schema) {
          prop.description = modelDescription.schema[propertyName] || prop.description
        }

        // Required
        if (property.required) {
          swaggerDefinition.required.push(propertyName)
        }

        // Default
        if (property.defaultTo) {
          if (typeof property.defaultTo !== 'function') {
            prop.default = property.defaultTo
          }
        }

        // Has Many
        if (property.collection && !property.through) {
          const collectionFilter = modelMap.filter((el) => {
            if (el.toLowerCase() === property.collection.toLowerCase()) {
              return el
            }
          })[0]

          prop['type'] = 'array'
          prop['items'] = {
            '$ref': '#/definitions/' + inflect.camelize(collectionFilter)
          }

          // Add to Relations
          modelRelations[modelName].push({
            property: propertyName,
            model: collectionFilter,
            type: 'hasMany'
          })

          // Add to Populate
          modelPopulates[modelName].push(propertyName)
        }
        // Has Many Through
        else if (property.collection && property.through) {
          const throughFilter = modelMap.filter((el) => {
            if (el.toLowerCase() === property.through.toLowerCase()) {
              return el
            }
          })[0]

          prop['type'] = 'array'
          prop['items'] = {
            '$ref': '#/definitions/' + inflect.camelize(throughFilter)
          }

          // Add to Relations
          modelRelations[modelName].push({
            property: propertyName,
            model: throughFilter,
            type: 'hasManyThrough'
          })

          // Add to Populate
          modelPopulates[modelName].push(propertyName)
        }
        // Has One / Belongs To
        else if (property.model) {
          const modelFilter = modelMap.filter((el) => {
            if (el.toLowerCase() === property.model.toLowerCase()) {
              return el
            }
          })[0]

          prop['type'] = 'object'
          prop['$ref'] = '#/definitions/' + inflect.camelize(modelFilter)

          // Add to Relations
          modelRelations[modelName].push({
            'property': propertyName,
            'model': modelFilter,
            'type': 'hasOne'
          })

          // Add to Populate
          modelPopulates[modelName].push(propertyName)
        }
        else if (Array.isArray(property.type)) {
          prop.type = 'array'
        }
        else {
          prop.type = property.type
        }

        prop.type = prop.type.toLowerCase()

        if (prop.type === 'integer') {
          prop.type = 'integer'
          prop.type = 'int32'
        }
        else if (prop.type === 'long') {
          prop.type = 'integer'
          prop.type = 'int64'
        }
        else if (prop.type === 'float') {
          prop.type = 'number'
          prop.type = 'float'
        }
        else if (prop.type === 'double') {
          prop.type = 'number'
          prop.format = 'double'
        }
        else if (prop.type === 'byte') {
          prop.type = 'string'
          prop.format = 'byte'
        }
        else if (prop.type === 'binary') {
          prop.type = 'string'
          prop.format = 'binary'
        }
        else if (prop.type === 'date') {
          prop.type = 'string'
          prop.format = 'date'
        }
        else if (prop.type === 'dateTime' || prop.type === 'time') {
          prop.type = 'string'
          prop.format = 'date-time'
        }
        else if (prop.type === 'password') {
          prop.type = 'string'
          prop.format = 'password'
        }
        else if (prop.type === 'json') {
          prop.type = 'object'
        }
        else if (prop.type === 'array' && (!prop.items)) {
          prop.items = {
            '$ref': '#/definitions/x-any'
          }
        }
        else if (!prop.type.match(/^object$|^array$|^number$/)) {
          prop.format = prop.type
          prop.type = 'string'
        }

        modelProperties[propertyName] = prop
      }

      // Add Formatted Properties to Swagger Definition
      swaggerDefinition.properties = modelProperties

      if (swaggerDefinition.required.length === 0) {
        swaggerDefinition.required = undefined
      }

      // Add Definition to SwaggerJson
      definitions[modelName] = swaggerDefinition
    }

    return definitions
  }

  genResponseObject(httpCode, responseName, description) {
    const responseObject = {}

    switch (httpCode) {
    case '200':
      responseObject.description = description || 'Request was successful'

      if (this.app.api.models[responseName]) {
        responseObject.schema = {
          'type': 'object',
          '$ref': '#/definitions/' + responseName
        }
      }
      else if (this.app.api.models[inflect.singularize(responseName)]) {
        responseObject.schema = {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/' + inflect.singularize(responseName)
          }
        }
      }
      else {
        responseObject.schema = {
          '$ref': '#/responses/' + (responseName || 'x-GenericSuccess')
        }
      }
      break
    case '400':
      responseObject.description = description || 'Bad Request'
      responseObject.schema = {
        '$ref': '#/responses/' + (responseName || 'BadRequest')
      }
      break
    case '401':
      responseObject.description = description || 'Unauthorized'
      responseObject.schema = {
        '$ref': '#/responses/' + (responseName || 'Unauthorized')
      }
      break
    case '404':
      responseObject.description = description || 'Not Found'
      responseObject.schema = {
        '$ref': '#/responses/' + (responseName || 'NotFound')
      }
      break
    case '500':
      responseObject.description = description || 'Unexpected Error'
      responseObject.schema = {
        '$ref': '#/responses/' + (responseName || 'UnexpectedError')
      }
      break
    }

    return responseObject
  }

  getResponses(config, doc) {
    let responses = {}

    responses['x-GenericSuccess'] = {
      'properties': {}
    }

    if (config.passport) {
      for (const authType in config.passport) {
        switch (authType) {
        case 'local':

          responses['PassportLocalSuccess'] = {
            'required': [
              'redirect',
              'user',
              'token'
            ],
            'properties': {
              'redirect': {
                'type': 'string'
              },
              'user': {
                'type': 'object',
                'schema': {
                  '$ref': '#/definitions/User'
                }
              },
              'token': {
                'type': 'string'
              }
            }
          }

          break
        }
      }
    }

    responses.BadRequest = {
      'required': [
        'error'
      ],
      'properties': {
        'error': {
          'type': 'string'
        }
      }
    }
    responses.Unauthorized = {
      'required': [
        'error'
      ],
      'properties': {
        'error': {
          'type': 'string'
        }
      }
    }
    responses.NotFound = {
      'required': [
        'error'
      ],
      'properties': {
        'error': {
          'type': 'string'
        }
      }
    }
    responses.UnexpectedError = {
      'required': [
        'error',
        'status',
        'summary'
      ],
      'properties': {
        'error': {
          'type': 'string'
        },
        'status': {
          'type': 'integer',
          'format': 'int'
        },
        'summary': {
          'type': 'string'
        },
        'raw': {
          'type': 'object'
        }
      }
    }

    /*
    const models = this.app.api.models

    for (const modelName in models) {
      const modelNameCamelized = inflect.camelize(modelName)
      const modelNameCamelizedPluralized = inflect.pluralize(modelNameCamelized)

      responses[modelNameCamelized] = {
        type: 'object',
        schema: {
          '$ref': '#/definitions/' + modelNameCamelized
        }
      }
      responses[modelNameCamelizedPluralized] = {
        type: 'array',
        items: {
          '$ref': '#/definitions/' + modelNameCamelized
        }
      }

      if (this.app.api.models[modelName]) {
        const model = this.app.api.models[modelName]
        const config = this.app.config
        const produces = this.getProduces(config)

        // Try example
        const definitionExample = this.getModelExample(model, true)

        if (definitionExample) {
          for (const produceIndex in produces) {
            const produce = produces[produceIndex]

            responses[modelNameCamelized].examples[produce] = definitionExample
            responses[modelNameCamelizedPluralized].examples[produce] = [definitionExample]
          }
        }
      }
    }
    */

    return responses
  }

  getPathLocalRegister(paths, config) {
    const pathItem = {}

    const localStrategy = config.passport.strategies.local
    let usernameField = 'username'

    if (localStrategy.options && localStrategy.options.usernameField) {
      usernameField = localStrategy.options
    }

    pathItem.post = {}
    pathItem.post.summary = 'Register a User object with ' + usernameField + ' and password as login credentials'
    pathItem.post.operationId = 'auth.localRegister'
    pathItem.post.tags = [
      'Auth',
      'JWT',
      'Passport',
      'User'
    ]
    pathItem.post.parameters = [
      {
        name: 'data',
        in: 'body',
        description: 'Data to register a new User (password field is required)',
        required: true,
        schema: {
          description: 'User object including password',
          '$ref': '#/definitions/User'
        }
      }
    ]
    pathItem.post.responses = {
      '200': this.genResponseObject('200', 'PassportLocalSuccess'),
      '400': this.genResponseObject('400')
    }

    paths['/auth/local/register'] = pathItem

    return paths
  }

  getPathLocalLogin(paths, config) {
    const pathItem = {}

    const localStrategy = config.passport.strategies.local
    let usernameField = 'username'

    if (localStrategy.options && localStrategy.options.usernameField) {
      usernameField = localStrategy.options
    }

    const postParametersSchemaParameters = {}
    postParametersSchemaParameters[usernameField] = {
      type: 'string'
    }
    postParametersSchemaParameters['password'] = {
      type: 'password'
    }

    pathItem.post = {}
    pathItem.post.summary = 'Login a User object with ' + usernameField + ' and password'
    pathItem.post.operationId = 'auth.localLogin'
    pathItem.post.tags = [
      'Auth',
      'JWT',
      'Passport',
      'User'
    ]
    pathItem.post.parameters = [
      {
        name: 'data',
        in: 'body',
        description: 'Login credentials',
        required: true,
        schema: {
          type: 'object',
          description: 'User object including password',
          required: [
            usernameField,
            'password'
          ],
          parameters: postParametersSchemaParameters
        }
      }
    ]
    pathItem.post.responses = {
      '200': this.genResponseObject('200', 'PassportLocalSuccess'),
      '400': this.genResponseObject('400')
    }

    paths['/auth/local'] = pathItem

    return paths
  }

  getPathLocalLogout(paths, config) {
    const pathItem = {}

    pathItem.get = {}
    pathItem.get.summary = 'Logout a User object'
    pathItem.get.operationId = 'auth.localLogout'
    pathItem.get.tags = [
      'Auth',
      'JWT',
      'Passport',
      'User'
    ]
    pathItem.get.parameters = []
    pathItem.get.security = [
      {
        jwt: []
      }
    ]
    pathItem.get.responses = {
      '200': this.genResponseObject('200', 'PassportLocalSuccess'),
      '401': this.genResponseObject('401')
    }

    paths['/auth/local/logout'] = pathItem

    return paths
  }

  getPathDefaultLimit(config) {
    let defaultLimit = 100

    if (config.footprints && config.footprints.models && config.footprints.models.options &&
        config.footprints.models.options.defaultLimit) {
      defaultLimit = config.footprints.models.options.defaultLimit
    }

    return defaultLimit
  }

  getPathSecurity(doc, modelName) {
    if (this.app.api.models[modelName].security) {
      return this.app.api.models[modelName].security()
    }

    if (doc.security) {
      return doc.security
    }

    if (doc.securityDefinitions) {
      const pathSecurity = []

      for (const securityName in doc.securityDefinitions) {
        const security = {}
        security[securityName] = []

        pathSecurity.push(security)
      }

      return pathSecurity
    }

    return undefined
  }

  getModelCriteria(config, doc, modelName, keepId) {
    const definition = doc.definitions[modelName]

    const criterias = []

    for (const propertyName in  definition.properties) {
      if (propertyName.match(/(populate|limit|offset)/)) {
        continue
      }

      if (propertyName === 'id' && !keepId) {
        continue
      }

      const property  = definition.properties[propertyName]

      if (property['$ref']) {
        continue
      }

      if (property.type === 'array' && property.items['$ref']) {
        continue
      }

      if (property.type === 'object') {
        continue
      }

      const criteria = {
        name: propertyName,
        in: 'query',
        description: 'Filter ' + inflect.titleize(modelName) + ' by ' + inflect.titleize(propertyName),
        required: false,
        type: property.type,
        format: property.format,
        items: property.items
      }

      criterias.push(criteria)
    }

    return criterias
  }

  getPathModel(paths, config, doc, modelName) {
    const pathItem = {}
    const pathId = '/' + modelName.toLowerCase()

    pathItem.get = {}
    pathItem.get.summary = 'List all ' + inflect.titleize(inflect.pluralize(modelName))
    pathItem.get.operationId = modelName + '.find'
    pathItem.get.tags = [
      modelName
    ]
    pathItem.get.parameters = this.getModelCriteria(config, doc, modelName, true)
    pathItem.get.parameters.push({
      name: 'populate',
      in: 'query',
      description: 'Properties to populate (valid: ' + modelPopulates[modelName].join(', ') + ')',
      required: false,
      type: 'array',
      items: {
        type: 'string'
      }
    })
    pathItem.get.parameters.push({
      name: 'limit',
      in: 'query',
      description: 'Pagination size',
      required: false,
      type: 'number',
      format: 'int',
      default: this.getPathDefaultLimit(config)
    })
    pathItem.get.parameters.push({
      name: 'offset',
      in: 'query',
      description: 'Pagination cusrsor',
      required: false,
      type: 'number',
      format: 'int',
      default: 0
    })
    pathItem.get.responses = {}
    pathItem.get.responses['200'] = this.genResponseObject('200', inflect.pluralize(modelName))
    pathItem.get.responses['400'] = this.genResponseObject('400')
    pathItem.get.responses['401'] = this.genResponseObject('401')
    pathItem.get.responses['404'] = this.genResponseObject('404')
    pathItem.get.responses['500'] = this.genResponseObject('500')
    pathItem.get.security = this.getPathSecurity(doc, modelName)

    pathItem.post = {}
    pathItem.post.summary = 'Create a ' + inflect.titleize(inflect.pluralize(modelName))
    pathItem.post.operationId = modelName + '.create'
    pathItem.post.tags = [
      modelName
    ]
    pathItem.post.parameters = []
    pathItem.post.parameters.push({
      name: 'data',
      in: 'body',
      description: 'Data to create a new ' + inflect.titleize(modelName),
      required: true,
      schema: {
        description: inflect.titleize(modelName) + ' object',
        '$ref': '#/definitions/' + modelName
      }
    })
    pathItem.post.responses = {}
    pathItem.post.responses['200'] = this.genResponseObject('200', modelName)
    pathItem.post.responses['400'] = this.genResponseObject('400')
    pathItem.post.responses['401'] = this.genResponseObject('401')
    pathItem.post.responses['404'] = this.genResponseObject('404')
    pathItem.post.responses['500'] = this.genResponseObject('500')
    pathItem.post.security = this.getPathSecurity(doc, modelName)

    pathItem.put = {}
    pathItem.put.summary = 'Update a ' + inflect.titleize(modelName)
    pathItem.put.operationId = modelName + '.update'
    pathItem.put.tags = [
      modelName
    ]
    pathItem.put.parameters = this.getModelCriteria(config, doc, modelName, true)
    pathItem.put.parameters.push({
      name: 'data',
      in: 'body',
      description: 'Data to create a new ' + inflect.titleize(modelName),
      required: true,
      schema: {
        description: inflect.titleize(modelName) + ' object',
        '$ref': '#/definitions/' + modelName
      }
    })
    pathItem.put.responses = {}
    pathItem.put.responses['200'] = this.genResponseObject('200', modelName)
    pathItem.put.responses['400'] = this.genResponseObject('400')
    pathItem.put.responses['401'] = this.genResponseObject('401')
    pathItem.put.responses['404'] = this.genResponseObject('404')
    pathItem.put.responses['500'] = this.genResponseObject('500')
    pathItem.put.security = this.getPathSecurity(doc, modelName)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' + inflect.titleize(inflect.pluralize(modelName))
    pathItem.delete.operationId = modelName + '.destroy'
    pathItem.delete.tags = [
      modelName
    ]
    pathItem.delete.parameters = this.getModelCriteria(config, doc, modelName, true)
    pathItem.delete.responses = {}
    pathItem.delete.responses['200'] = this.genResponseObject('200', modelName)
    pathItem.delete.responses['400'] = this.genResponseObject('400')
    pathItem.delete.responses['401'] = this.genResponseObject('401')
    pathItem.delete.responses['404'] = this.genResponseObject('404')
    pathItem.delete.responses['500'] = this.genResponseObject('500')
    pathItem.delete.security = this.getPathSecurity(doc, modelName)

    paths[pathId] = pathItem
    return paths
  }

  getPathModelById(paths, config, doc, modelName) {
    const pathItem = {}
    const pathId = '/' + modelName.toLowerCase() + '/{id}'

    pathItem.get = {}
    pathItem.get.summary = 'Get a ' + inflect.titleize(modelName)
    pathItem.get.operationId = modelName + '.findById'
    pathItem.get.tags = [
      modelName
    ]
    pathItem.get.parameters = this.getModelCriteria(config, doc, modelName)
    pathItem.get.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.get.parameters.push({
      name: 'populate',
      in: 'query',
      description: 'Properties to populate (valid: ' + modelPopulates[modelName].join(', ') + ')',
      required: false,
      type: 'array',
      items: {
        type: 'string'
      }
    })
    pathItem.get.responses = {}
    pathItem.get.responses['200'] = this.genResponseObject('200', modelName)
    pathItem.get.responses['400'] = this.genResponseObject('400')
    pathItem.get.responses['401'] = this.genResponseObject('401')
    pathItem.get.responses['404'] = this.genResponseObject('404')
    pathItem.get.responses['500'] = this.genResponseObject('500')
    pathItem.get.security = this.getPathSecurity(doc, modelName)

    pathItem.put = {}
    pathItem.put.summary = 'Update a ' + inflect.titleize(modelName)
    pathItem.put.operationId = modelName + '.updateById'
    pathItem.put.tags = [
      modelName
    ]
    pathItem.put.parameters = this.getModelCriteria(config, doc, modelName)
    pathItem.put.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.put.parameters.push({
      name: 'data',
      in: 'body',
      description: 'Data to update a ' + inflect.titleize(modelName),
      required: true,
      schema: {
        description: inflect.titleize(modelName) + ' object',
        '$ref': '#/definitions/' + modelName
      }
    })
    pathItem.put.responses = {}
    pathItem.put.responses['200'] = this.genResponseObject('200', modelName)
    pathItem.put.responses['400'] = this.genResponseObject('400')
    pathItem.put.responses['401'] = this.genResponseObject('401')
    pathItem.put.responses['404'] = this.genResponseObject('404')
    pathItem.put.responses['500'] = this.genResponseObject('500')
    pathItem.put.security = this.getPathSecurity(doc, modelName)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' + inflect.titleize(modelName)
    pathItem.delete.operationId = modelName + '.destroyById'
    pathItem.delete.tags = [
      modelName
    ]
    pathItem.delete.parameters = this.getModelCriteria(config, doc, modelName)
    pathItem.delete.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.delete.responses = {}
    pathItem.delete.responses['200'] = this.genResponseObject('200', modelName)
    pathItem.delete.responses['400'] = this.genResponseObject('400')
    pathItem.delete.responses['401'] = this.genResponseObject('401')
    pathItem.delete.responses['404'] = this.genResponseObject('404')
    pathItem.delete.responses['500'] = this.genResponseObject('500')
    pathItem.delete.security = this.getPathSecurity(doc, modelName)

    paths[pathId] = pathItem
    return paths
  }

  getPathModelByIdAndRelation(paths, config, doc, modelName, modelRelation) {
    const pathItem = {}
    const pathId = '/' + modelName.toLowerCase() + '/{id}/' + modelRelation.property.toLowerCase()

    pathItem.get = {}
    pathItem.get.summary = 'List all ' + inflect.titleize(inflect.pluralize(modelRelation.property)) + ' on ' + inflect.titleize(modelRelation.model)
    pathItem.get.operationId = modelName + '.find' + inflect.camelize(modelRelation.property)
    pathItem.get.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.get.tags.push(modelRelation.model)
    }
    pathItem.get.parameters = this.getModelCriteria(config, doc, modelRelation.model, true)
    pathItem.get.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.get.parameters.push({
      name: 'populate',
      in: 'query',
      description: 'Properties to populate (check populate for ' + inflect.titleize(modelRelation.model) + ')',
      required: false,
      type: 'array',
      items: {
        type: 'string'
      }
    })
    pathItem.get.parameters.push({
      name: 'limit',
      in: 'query',
      description: 'Pagination size',
      required: false,
      type: 'number',
      format: 'int',
      default: this.getPathDefaultLimit(config)
    })
    pathItem.get.parameters.push({
      name: 'offset',
      in: 'query',
      description: 'Pagination cusrsor',
      required: false,
      type: 'number',
      format: 'int',
      default: 0
    })
    pathItem.get.responses = {}
    pathItem.get.responses['200'] = this.genResponseObject('200', inflect.pluralize(modelRelation.model))
    pathItem.get.responses['400'] = this.genResponseObject('400')
    pathItem.get.responses['401'] = this.genResponseObject('401')
    pathItem.get.responses['404'] = this.genResponseObject('404')
    pathItem.get.responses['500'] = this.genResponseObject('500')
    pathItem.get.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.post = {}
    pathItem.post.summary = 'Create a ' + inflect.titleize(inflect.pluralize(modelRelation.property)) + ' on ' + inflect.titleize(modelRelation.model)
    pathItem.post.operationId = modelName + '.create' + inflect.camelize(modelRelation.property)
    pathItem.post.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.post.tags.push(modelRelation.model)
    }
    pathItem.post.parameters = []
    pathItem.post.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.post.parameters.push({
      name: 'data',
      in: 'body',
      description: 'Data to create a new ' + inflect.titleize(modelRelation.property),
      required: true,
      schema: {
        description: inflect.titleize(modelRelation.property) + ' object',
        '$ref': '#/definitions/' + modelRelation.model
      }
    })
    pathItem.post.responses = {}
    pathItem.post.responses['200'] = this.genResponseObject('200', modelRelation.model)
    pathItem.post.responses['400'] = this.genResponseObject('400')
    pathItem.post.responses['401'] = this.genResponseObject('401')
    pathItem.post.responses['404'] = this.genResponseObject('404')
    pathItem.post.responses['500'] = this.genResponseObject('500')
    pathItem.post.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.put = {}
    pathItem.put.summary = 'Update a ' + inflect.titleize(modelRelation.property) + ' on ' + inflect.titleize(modelName)
    pathItem.put.operationId = modelName + '.update' + inflect.camelize(modelRelation.property)
    pathItem.put.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.put.tags.push(modelRelation.model)
    }
    pathItem.put.parameters = this.getModelCriteria(config, doc, modelRelation.model, true)
    pathItem.put.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.put.parameters.push({
      name: 'data',
      in: 'body',
      description: 'Data to update a ' + inflect.titleize(modelRelation.property),
      required: true,
      schema: {
        description: inflect.titleize(modelRelation.property) + ' object',
        '$ref': '#/definitions/' + modelRelation.model
      }
    })
    pathItem.put.responses = {}
    pathItem.put.responses['200'] = this.genResponseObject('200', modelRelation.model)
    pathItem.put.responses['400'] = this.genResponseObject('400')
    pathItem.put.responses['401'] = this.genResponseObject('401')
    pathItem.put.responses['404'] = this.genResponseObject('404')
    pathItem.put.responses['500'] = this.genResponseObject('500')
    pathItem.put.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' + inflect.titleize(modelRelation.property) + ' on ' + inflect.titleize(modelName)
    pathItem.delete.operationId = modelName + '.destroy' + inflect.camelize(modelRelation.property)
    pathItem.delete.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.delete.tags.push(modelRelation.model)
    }
    pathItem.delete.parameters = this.getModelCriteria(config, doc, modelRelation.model, true)
    pathItem.delete.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.delete.responses = {}
    pathItem.delete.responses['200'] = this.genResponseObject('200', modelRelation.model)
    pathItem.delete.responses['400'] = this.genResponseObject('400')
    pathItem.delete.responses['401'] = this.genResponseObject('401')
    pathItem.delete.responses['404'] = this.genResponseObject('404')
    pathItem.delete.responses['500'] = this.genResponseObject('500')
    pathItem.delete.security = this.getPathSecurity(doc, modelRelation.model)

    paths[pathId] = pathItem
    return paths
  }

  getPathModelByIdAndRelationById(paths, config, doc, modelName, modelRelation) {
    const pathItem = {}
    const pathId = '/' + modelName.toLowerCase() + '/{id}/' + modelRelation.property.toLowerCase() + '/{cid}'

    pathItem.get = {}
    pathItem.get.summary = 'Get a ' + inflect.titleize(modelRelation.property) + ' on ' + inflect.titleize(modelName)
    pathItem.get.operationId = modelName + '.findById' + inflect.camelize(modelRelation.property)
    pathItem.get.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.get.tags.push(modelRelation.model)
    }
    pathItem.get.parameters = this.getModelCriteria(config, doc, modelRelation.model)
    pathItem.get.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.get.parameters.push({
      name: 'cid',
      in: 'path',
      description: inflect.titleize(modelRelation.property) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.get.parameters.push({
      name: 'populate',
      in: 'query',
      description: 'Properties to populate (check populate for ' + inflect.titleize(modelRelation.model) + ')',
      required: false,
      type: 'array',
      items: {
        type: 'string'
      }
    })
    pathItem.get.responses = {}
    pathItem.get.responses['200'] = this.genResponseObject('200', modelRelation.model)
    pathItem.get.responses['400'] = this.genResponseObject('400')
    pathItem.get.responses['401'] = this.genResponseObject('401')
    pathItem.get.responses['404'] = this.genResponseObject('404')
    pathItem.get.responses['500'] = this.genResponseObject('500')
    pathItem.get.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.put = {}
    pathItem.put.summary = 'Update a ' + inflect.titleize(modelRelation.property) + ' on ' + inflect.titleize(modelName)
    pathItem.put.operationId = modelName + '.updateById' + inflect.camelize(modelRelation.property)
    pathItem.put.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.put.tags.push(modelRelation.model)
    }
    pathItem.put.parameters = this.getModelCriteria(config, doc, modelRelation.model)
    pathItem.put.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.put.parameters.push({
      name: 'cid',
      in: 'path',
      description: inflect.titleize(modelRelation.property) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.put.parameters.push({
      name: 'data',
      in: 'body',
      description: 'Data to update a ' + inflect.titleize(modelRelation.property),
      required: true,
      schema: {
        description: inflect.titleize(modelRelation.property) + ' object',
        '$ref': '#/definitions/' + modelRelation.model
      }
    })
    pathItem.put.responses = {}
    pathItem.put.responses['200'] = this.genResponseObject('200', modelRelation.model)
    pathItem.put.responses['400'] = this.genResponseObject('400')
    pathItem.put.responses['401'] = this.genResponseObject('401')
    pathItem.put.responses['404'] = this.genResponseObject('404')
    pathItem.put.responses['500'] = this.genResponseObject('500')
    pathItem.put.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' + inflect.titleize(modelRelation.property) + ' on ' + inflect.titleize(modelName)
    pathItem.delete.operationId = modelName + '.destroyById' + inflect.camelize(modelRelation.property)
    pathItem.delete.tags = [
      modelName
    ]
    if (modelName.toLowerCase() !== modelRelation.model.toLowerCase()) {
      pathItem.delete.tags.push(modelRelation.model)
    }
    pathItem.delete.parameters = this.getModelCriteria(config, doc, modelRelation.model)
    pathItem.delete.parameters.push({
      name: 'id',
      in: 'path',
      description: inflect.titleize(modelName) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.delete.parameters.push({
      name: 'cid',
      in: 'path',
      description: inflect.titleize(modelRelation.model) + ' id',
      required: true,
      type: 'string'
    })
    pathItem.delete.responses = {}
    pathItem.delete.responses['200'] = this.genResponseObject('200', modelRelation.model)
    pathItem.delete.responses['400'] = this.genResponseObject('400')
    pathItem.delete.responses['401'] = this.genResponseObject('401')
    pathItem.delete.responses['404'] = this.genResponseObject('404')
    pathItem.delete.responses['500'] = this.genResponseObject('500')
    pathItem.delete.security = this.getPathSecurity(doc, modelRelation.model)

    paths[pathId] = pathItem
    return paths
  }

  getPaths(config, doc) {
    let paths = {}

    if (config.passport) {
      for (const authType in config.passport) {
        switch (authType) {
        case 'local':

          paths = this.getPathLocalRegister(paths, config)
          paths = this.getPathLocalLogin(paths, config)
          paths = this.getPathLocalLogout(paths, config)

          break
        }
      }
    }

    const models = this.app.api.models

    for (const modelName in models) {

      // /{model}
      paths = this.getPathModel(paths, config, doc, modelName)

      // /{model}/{id}
      paths = this.getPathModelById(paths, config, doc, modelName)

      for (const modelRelationIndex in modelRelations[modelName]) {
        const modelRelation = modelRelations[modelName][modelRelationIndex]

        // /{model}/{id}/{child}
        paths = this.getPathModelByIdAndRelation(paths, config, doc, modelName, modelRelation)

        // /{model}/{id}/{child}/{cid}
        paths = this.getPathModelByIdAndRelationById(paths, config, doc, modelName, modelRelation)
      }
    }

    return paths
  }

  getModelMap() {
    modelMap = []

    const models = this.app.api.models
    for (const modelName in models) {
      modelMap.push(modelName)
    }
  }

  getSwaggerDoc() {
    const config = this.app.config

    this.getModelMap()

    const doc = {}

    doc.swagger = '2.0'
    doc.info = this.getInfo(config)
    doc.basePath = this.getBasePath(config)
    doc.schemes = this.getSchemes(config)
    doc.consumes = this.getConsumes(config)
    doc.produces = this.getProduces(config)
    doc.host = this.getHost(config)
    // doc.port = this.getPort(config)
    doc.securityDefinitions = this.getSecurityDefinitions(config)
    doc.security = this.getSecurity(config)
    doc.tags = this.getTags(config, doc)
    doc.definitions = this.getDefinitions(config, doc)
    doc.responses = this.getResponses(config, doc)
    doc.paths = this.getPaths(config, doc)

    return doc
  }

// End Swagger Doc

}

