/**
 * @Author: Matteo Zambon <Matteo>
 * @Date:   2017-04-13 06:55:18
 * @Last modified by:   Matteo
 * @Last modified time: 2017-07-30 01:06:47
 */

'use strict'

const faker = require('faker')
const objectPath = require('object-path')
const inflect = require('i')()
const _ = require('lodash')

const Service = require('trails/service')

let modelMap = []
const modelRelations = {}
const modelPopulates = {}
const cachedModels = {}

let standardBasePath = ''
let passportBasePath = ''

/**
 * @module SwaggerService
 * @description Service to generate Swagger documentation
 */
module.exports = class SwaggerService extends Service {

// Example

  extractExampleDirective (propertyExample) {
    const directive = {}

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

      if (directiveFaker.length === 2 &&
          faker[directiveFaker[0]] &&
          typeof faker[directiveFaker[0]][directiveFaker[1]] === 'function') {
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

          cachedModels[directive.model] = this.getModelExample(
            this.app.api.models[directive.model],
            false
          )
        }

        example = cachedModels[directive.model]
      }

      if (directive.after) {
        for (const directiveAfterIndex in directive.after) {
          const directiveAfter = directive.after[directiveAfterIndex]

          switch (directiveAfter) {
          case 'int':
            example = parseInt(example, 10)
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
      const matches = config.footprints.prefix.match(/(^|\/)v[0-9.]+($|\/)/)

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
      if (config.passport && config.passport.prefix) {
        if (config.footprints.prefix !== config.passport.prefix) {
          const footprintsPrefix = config.footprints.prefix.toLowerCase()
          const passportPrefix = config.passport.prefix.toLowerCase()

          standardBasePath = ''
          passportBasePath = ''

          let basePath = []

          let path1 = footprintsPrefix.length < passportPrefix.length ?
            footprintsPrefix :
            passportPrefix
          let path2 = footprintsPrefix.length > passportPrefix.length ?
            footprintsPrefix :
            passportPrefix

          path1 = path1.split('/')
          path2 = path2.split('/')

          for (const p in path1) {
            if (path1[p] === path2[p]) {
              basePath.push(path1[p])
            }
            else {
              break
            }
          }

          basePath = basePath.join('/')

          const regExp = new RegExp('^' + basePath)

          standardBasePath = footprintsPrefix.replace(regExp, '')
          passportBasePath = passportPrefix.replace(regExp, '')

          basePath = (!basePath.match(/^\//) ? '/' : '') + basePath
          standardBasePath = (!standardBasePath.match(/^\//) ? '/' : '') + standardBasePath
          passportBasePath = (!passportBasePath.match(/^\//) ? '/' : '') + passportBasePath
          standardBasePath = standardBasePath.replace(/\/$/, '')
          passportBasePath = passportBasePath.replace(/\/$/, '')

          return basePath
        }
      }

      standardBasePath = config.footprints.prefix
      return '/'
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
      return '0.0.0.0:' + this.getPort(config)
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

  getModelNameFromModelMap(modelName) {
    const modelNames = modelMap.filter((el) => {
      if (el.toLowerCase() === modelName.toLowerCase()) {
        return el
      }
    })

    if (modelNames.length > 0) {
      return modelNames[0]
    }

    return 'x-any'
  }

  parseDefinitionModelProperty(property) {
    property.type = property.type.toLowerCase()

    if (property.type === 'integer') {
      property.type = 'integer'
      property.format = 'int32'
    }
    else if (property.type === 'long') {
      property.type = 'integer'
      property.format = 'int64'
    }
    else if (property.type === 'float') {
      property.type = 'number'
      property.format = 'float'
    }
    else if (property.type === 'double') {
      property.type = 'number'
      property.format = 'double'
    }
    else if (property.type === 'byte') {
      property.type = 'string'
      property.format = 'byte'
    }
    else if (property.type === 'binary') {
      property.type = 'string'
      property.format = 'binary'
    }
    else if (property.type === 'date') {
      property.type = 'string'
      property.format = 'date'
    }
    else if (property.type === 'dateTime' || property.type === 'time') {
      property.type = 'string'
      property.format = 'date-time'
    }
    else if (property.type === 'password') {
      property.type = 'string'
      property.format = 'password'
    }
    else if (property.type === 'json') {
      property.type = 'object'
    }
    else if (property.type === 'array' && (!property.items)) {
      property.items = {
        '$ref': '#/definitions/x-any'
      }
    }
    else if (!property.type.match(/^object$|^array$|^number$/)) {
      property.format = property.type
      property.type = 'string'
    }

    return property
  }

  getDefinitionModel(config, doc, models, modelName) {
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

      let prop = {}

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
        const collectionFilter = this.getModelNameFromModelMap(property.collection)

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
        const throughFilter = this.getModelNameFromModelMap(property.through)

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
        const modelFilter = this.getModelNameFromModelMap(property.model)

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

      prop = this.parseDefinitionModelProperty(prop)

      modelProperties[propertyName] = prop
    }

    // Add Formatted Properties to Swagger Definition
    swaggerDefinition.properties = modelProperties

    if (swaggerDefinition.required.length === 0) {
      swaggerDefinition.required = undefined
    }

    return swaggerDefinition
  }

  getDefinitions(config, doc) {
    const definitions = {}

    definitions['x-any'] = {
      'properties': {}
    }

    const models = this.app.api.models

    for (const modelName in models) {
      // Add Definition to SwaggerJson
      definitions[modelName] = this.getDefinitionModel(config, doc, models, modelName)

      if (modelName === 'User' &&
        config.passport &&
        config.passport.strategies &&
        config.passport.strategies.local
      ) {
        const localStrategy = config.passport.strategies.local
        let usernameField = 'username'

        if (localStrategy.options && localStrategy.options.usernameField) {
          usernameField = localStrategy.options.usernameField
        }

        const passportModelProperties = {}
        passportModelProperties[usernameField] = {
          type: 'string'
        }
        passportModelProperties['password'] = {
          type: 'string',
          format: 'password'
        }

        // Swagger Definition
        definitions['UserLogin'] = {
          type: 'object',
          required: [
            usernameField,
            'password'
          ],
          description: 'User credentials',
          properties: passportModelProperties
        }

        definitions['UserRegister'] = definitions[modelName]
        if (definitions['UserRegister'].required) {
          definitions['UserRegister'].required.push('password')
        }
        else {
          definitions['UserRegister'].required = [
            usernameField,
            'password'
          ]
        }
        definitions['UserRegister'].properties['password'] = passportModelProperties['password']
      }
    }

    const responses = this.getResponses(config, doc)

    for (const responseName in responses) {
      definitions[responseName] = responses[responseName]
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
          type: 'object',
          '$ref': '#/definitions/' + responseName
        }

        /** Try example
        const produces = this.getProduces(this.app.config)
        const model = this.app.api.models[responseName]
        const definitionExample = this.getModelExample(model, true)

        if (definitionExample) {
          responseObject.examples = {}
          for (const produceIndex in produces) {
            const produce = produces[produceIndex]

            responseObject.examples[produce] = definitionExample
          }
        }
        */
      }
      else if (this.app.api.models[inflect.singularize(responseName)]) {
        responseObject.schema = {
          type: 'array',
          items: {
            '$ref': '#/definitions/' + inflect.singularize(responseName)
          }
        }

        /** Try example
        const produces = this.getProduces(this.app.config)
        const model = this.app.api.models[inflect.singularize(responseName)]
        const definitionExample = this.getModelExample(model, true)

        if (definitionExample) {
          responseObject.examples = {}
          for (const produceIndex in produces) {
            const produce = produces[produceIndex]

            responseObject.examples[produce] = definitionExample
          }
        }
        */
      }
      else {
        responseObject.schema = {
          type: 'object',
          '$ref': '#/definitions/' + (responseName || 'x-GenericSuccess')
        }
      }
      break
    case '400':
      responseObject.description = description || 'Bad Request'
      responseObject.schema = {
        type: 'object',
        '$ref': '#/definitions/' + (responseName || 'BadRequest')
      }
      break
    case '401':
      responseObject.description = description || 'Unauthorized'
      responseObject.schema = {
        type: 'object',
        '$ref': '#/definitions/' + (responseName || 'Unauthorized')
      }
      break
    case '404':
      responseObject.description = description || 'Not Found'
      responseObject.schema = {
        type: 'object',
        '$ref': '#/definitions/' + (responseName || 'NotFound')
      }
      break
    case '500':
      responseObject.description = description || 'Unexpected Error'
      responseObject.schema = {
        type: 'object',
        '$ref': '#/definitions/' + (responseName || 'UnexpectedError')
      }
      break
    }

    return responseObject
  }

  genResponseObjects(directives) {
    const responses = {}

    for (const directiveIndex in directives) {
      const directive = directives[directiveIndex]

      const httpCode = directive[0] || '200'
      const responseName = directive[1] || undefined
      const description = directive[2] || undefined

      const response = this.genResponseObject(httpCode, responseName, description)

      responses[httpCode] = response
    }

    return responses
  }

  genResponseObjectModel(modelName, isPlural){
    return this.genResponseObjects([
      ['200', isPlural ? inflect.pluralize(modelName) : modelName],
      ['400'],
      ['401'],
      ['404'],
      ['500']
    ])
  }

  getResponses(config, doc) {
    const responses = {}

    responses['x-GenericSuccess'] = {
      description: 'Generic Successful Response',
      properties: {}
    }

    if (config.passport && config.passport.strategies) {
      for (const authType in config.passport.strategies) {
        switch (authType) {
        case 'local':

          responses['PassportLocalSuccess'] = {
            description: 'Successful Response',
            required: [
              'redirect',
              'user',
              'token'
            ],
            properties: {
              redirect: {
                type: 'string'
              },
              user: {
                type: 'object',
                '$ref': '#/definitions/User'
              },
              token: {
                type: 'string'
              }
            }
          }

          break
        }
      }
    }

    responses.BadRequest = {
      description: 'Bad Request',
      required: [
        'error'
      ],
      properties: {
        'error': {
          'type': 'string'
        }
      }
    }
    responses.Unauthorized = {
      description: 'Unauthorized',
      required: [
        'error'
      ],
      properties: {
        'error': {
          'type': 'string'
        }
      }
    }
    responses.NotFound = {
      description: 'Not Found',
      required: [
        'error'
      ],
      properties: {
        'error': {
          'type': 'string'
        }
      }
    }
    responses.UnexpectedError = {
      description: 'Unexpected Error',
      required: [
        'error',
        'status',
        'summary'
      ],
      properties: {
        'error': {
          'type': 'string'
        },
        'status': {
          'type': 'integer',
          'format': 'int32'
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
      usernameField = localStrategy.options.usernameField
    }

    pathItem.post = {}
    pathItem.post.summary = 'Register a User object with ' +
                            usernameField +
                            ' and password as login credentials'
    pathItem.post.operationId = 'auth.localRegister'
    pathItem.post.tags = [
      'Auth',
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
          '$ref': '#/definitions/UserRegister'
        }
      }
    ]
    pathItem.post.responses = this.genResponseObjects([
      ['200', 'PassportLocalSuccess'],
      ['400']
    ])

    paths[passportBasePath + '/auth/local/register'] = pathItem

    return paths
  }

  getPathLocalLogin(paths, config) {
    const pathItem = {}

    const localStrategy = config.passport.strategies.local
    let usernameField = 'username'

    if (localStrategy.options && localStrategy.options.usernameField) {
      usernameField = localStrategy.options.usernameField
    }

    pathItem.post = {}
    pathItem.post.summary = 'Login a User object with ' + usernameField + ' and password'
    pathItem.post.operationId = 'auth.localLogin'
    pathItem.post.tags = [
      'Auth',
      'User'
    ]
    pathItem.post.parameters = [
      {
        name: 'data',
        in: 'body',
        description: 'Login credentials',
        required: true,
        schema: {
          description: 'User object including password',
          '$ref': '#/definitions/UserLogin'
        }
      }
    ]
    pathItem.post.responses = this.genResponseObjectModel('PassportLocalSuccess')

    paths[passportBasePath + '/auth/local'] = pathItem

    return paths
  }

  getPathLocalLogout(paths, config) {
    const pathItem = {}

    pathItem.get = {}
    pathItem.get.summary = 'Logout a User object'
    pathItem.get.operationId = 'auth.localLogout'
    pathItem.get.tags = [
      'Auth',
      'User'
    ]
    pathItem.get.parameters = []
    pathItem.get.security = [
      {
        jwt: []
      }
    ]
    pathItem.get.responses = this.genResponseObjects([
      ['200', 'PassportLocalSuccess'],
      ['401']
    ])

    paths[passportBasePath + '/auth/local/logout'] = pathItem

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
        description: 'Filter ' +
                      inflect.titleize(modelName) +
                      ' by ' +
                      inflect.titleize(propertyName),
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
    const pathId = standardBasePath + '/' + modelName.toLowerCase()

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
      type: 'integer',
      format: 'int32',
      default: this.getPathDefaultLimit(config)
    })
    pathItem.get.parameters.push({
      name: 'offset',
      in: 'query',
      description: 'Pagination cusrsor',
      required: false,
      type: 'integer',
      format: 'int32',
      default: 0
    })
    pathItem.get.responses = this.genResponseObjectModel(modelName, true)
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
    pathItem.post.responses = this.genResponseObjectModel(modelName)
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
    pathItem.put.responses = this.genResponseObjectModel(modelName)
    pathItem.put.security = this.getPathSecurity(doc, modelName)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' + inflect.titleize(inflect.pluralize(modelName))
    pathItem.delete.operationId = modelName + '.destroy'
    pathItem.delete.tags = [
      modelName
    ]
    pathItem.delete.parameters = this.getModelCriteria(config, doc, modelName, true)
    pathItem.delete.responses = this.genResponseObjectModel(modelName)
    pathItem.delete.security = this.getPathSecurity(doc, modelName)

    paths[pathId] = pathItem
    return paths
  }

  getPathModelById(paths, config, doc, modelName) {
    const pathItem = {}
    const pathId = standardBasePath + '/' + modelName.toLowerCase() + '/{id}'

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
    pathItem.get.responses = this.genResponseObjectModel(modelName)
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
    pathItem.put.responses = this.genResponseObjectModel(modelName)
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
    pathItem.delete.responses = this.genResponseObjectModel(modelName)
    pathItem.delete.security = this.getPathSecurity(doc, modelName)

    paths[pathId] = pathItem
    return paths
  }

  getPathModelByIdAndRelation(paths, config, doc, modelName, modelRelation) {
    const pathItem = {}
    const pathId = standardBasePath +
                    '/' +
                    modelName.toLowerCase() +
                    '/{id}/' +
                    modelRelation.property.toLowerCase()

    pathItem.get = {}
    pathItem.get.summary = 'List all ' +
                            inflect.titleize(inflect.pluralize(modelRelation.property)) +
                            ' on ' +
                            inflect.titleize(modelRelation.model)
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
      description: 'Properties to populate (check populate for ' +
                    inflect.titleize(modelRelation.model) +
                    ')',
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
      type: 'integer',
      format: 'int32',
      default: this.getPathDefaultLimit(config)
    })
    pathItem.get.parameters.push({
      name: 'offset',
      in: 'query',
      description: 'Pagination cusrsor',
      required: false,
      type: 'integer',
      format: 'int32',
      default: 0
    })
    pathItem.get.responses = this.genResponseObjectModel(modelRelation.model, true)
    pathItem.get.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.post = {}
    pathItem.post.summary = 'Create a ' +
                            inflect.titleize(inflect.pluralize(modelRelation.property)) +
                            ' on ' +
                            inflect.titleize(modelRelation.model)
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
    pathItem.post.responses = this.genResponseObjectModel(modelRelation.model)
    pathItem.post.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.put = {}
    pathItem.put.summary = 'Update a ' +
                            inflect.titleize(modelRelation.property) +
                            ' on ' +
                            inflect.titleize(modelName)
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
    pathItem.put.responses = this.genResponseObjectModel(modelRelation.model)
    pathItem.put.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' +
                              inflect.titleize(modelRelation.property) +
                              ' on ' +
                              inflect.titleize(modelName)
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
    pathItem.delete.responses = this.genResponseObjectModel(modelRelation.model)
    pathItem.delete.security = this.getPathSecurity(doc, modelRelation.model)

    paths[pathId] = pathItem
    return paths
  }

  getPathModelByIdAndRelationById(paths, config, doc, modelName, modelRelation) {
    const pathItem = {}
    const pathId = standardBasePath +
                    '/' +
                    modelName.toLowerCase() +
                    '/{id}/' +
                    modelRelation.property.toLowerCase() +
                    '/{cid}'

    pathItem.get = {}
    pathItem.get.summary = 'Get a ' +
                            inflect.titleize(modelRelation.property) +
                            ' on ' +
                            inflect.titleize(modelName)
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
      description: 'Properties to populate (check populate for ' +
                    inflect.titleize(modelRelation.model) +
                    ')',
      required: false,
      type: 'array',
      items: {
        type: 'string'
      }
    })
    pathItem.get.responses = this.genResponseObjectModel(modelRelation.model)
    pathItem.get.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.put = {}
    pathItem.put.summary = 'Update a ' +
                            inflect.titleize(modelRelation.property) +
                            ' on ' +
                            inflect.titleize(modelName)
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
    pathItem.put.responses = this.genResponseObjectModel(modelRelation.model)
    pathItem.put.security = this.getPathSecurity(doc, modelRelation.model)

    pathItem.delete = {}
    pathItem.delete.summary = 'Destroy a ' +
                              inflect.titleize(modelRelation.property) +
                              ' on ' +
                              inflect.titleize(modelName)
    pathItem.delete.operationId = modelName +
                                  '.destroyById' +
                                  inflect.camelize(modelRelation.property)
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
    pathItem.delete.responses = this.genResponseObjectModel(modelRelation.model)
    pathItem.delete.security = this.getPathSecurity(doc, modelRelation.model)

    paths[pathId] = pathItem
    return paths
  }

  getPaths(config, doc) {
    let paths = {}

    if (config.passport && config.passport.strategies) {
      for (const authType in config.passport.strategies) {
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
    paths = Object.assign({}, paths, this.getPathsFromRoutes(config))
    paths = Object.assign({}, paths, this.app.config.swagger.paths)
    return paths
  }
  getModelMap() {
    modelMap = []

    const models = this.app.api.models
    for (const modelName in models) {
      modelMap.push(modelName)
    }
  }

  getPathsFromRoutes(config) {
    const routes = _.filter(config.routes, (route) => {
      if (route.path.indexOf('{parentModel}') > -1) {
        return false
      } else if (route.path.indexOf('{model}') > -1) {
        return false
      }
      return true
    })
    const paths = {}
    _.each(routes, (route) => {
      const path = route.path
      let tag = 'Default'
      if (route.path === '/api/explorer') {
        tag = 'Swagger'
      }
      if (route.handler && route.handler.match) {
        const matches = route.handler.match(/(.+)Controller\./)
        if (matches.length >= 2) tag = matches[1]
      }
      if (_.isArray(route.method)) {
        _.each(route.method, (method) => {
          method = method.toLowerCase()
          if (!paths[path]) paths[path] = {}
          paths[path][method] = {
            tags: [tag]
          }
          if (route.config && route.config.plugins && route.config.plugins.swagger) {
            paths[path][method] = Object.assign({}, paths[path][method], route.config.plugins.swagger)
          }
        })
      } else {
        const method = route.method.toLowerCase()
        if (!paths[path]) paths[path] = {}
        paths[path][method] = {
          tags: [tag]
        }
        if (route.config && route.config.plugins && route.config.plugins.swagger) {
          paths[path][method] = Object.assign({}, paths[path][method], route.config.plugins.swagger)
        }
      }
    })
    return paths
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
    doc.securityDefinitions = this.getSecurityDefinitions(config)
    doc.security = this.getSecurity(config)
    doc.tags = this.getTags(config, doc)
    doc.definitions = this.getDefinitions(config, doc)
    doc.paths = this.getPaths(config, doc)

    return doc
  }

// End Swagger Doc

}
