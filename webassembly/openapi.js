// this JavaScript snippet is appended to webassembly/openapi.js

// this JavaScript snippet is later referred to as <<fastify-openapi-plugin>>
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')
const fastify = require('fastify')()
// this JavaScript snippet is appended to <<fastify-openapi-plugin>>
const oas = require('fastify-oas')
// this JavaScript snippet is appended to <<fastify-openapi-plugin>>
fastify.register(oas, {
  swagger: {
    info: {
      title: 'OpenAPI webservice for root finding with Newton-Raphson',
      license: {
        name: 'Apache-2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      },
      version: '0.1.0'
    },
    consumes: ['application/json'],
    produces: ['application/json'],
    servers: [{
      url: 'http://localhost:3001'
    }]
  },
  exposeRoute: true
})
// this JavaScript snippet is appended to webassembly/openapi.js

// this JavaScript snippet is later referred to as <<fastify-handler>>
const handler = async ({body}) => {
  const { epsilon, guess } = body
  // this JavaScript snippet is later referred to as <<find-root-js>>
  const { NewtonRaphson } = await createModule()
  // this JavaScript snippet is appended to <<find-root-js>>
  const finder = new NewtonRaphson(epsilon)
  const root = finder.solve(guess)
  return { root }
}

// this JavaScript snippet is later referred to as <<fastify-openapi-route>>
const requestBodySchema =
  {
    "type": "object",
    "description": "this JSON document is later referred to as <<request-schema>>",
    "properties": {
      "epsilon": {
        "title": "Epsilon",
        "type": "number",
        "minimum": 0
      },
      "guess": {
        "title": "Initial guess",
        "type": "number"
      }
    },
    "required": [
      "epsilon",
      "guess"
    ],
    "additionalProperties": false
  }
requestBodySchema.example = {
  epsilon: 0.001,
  guess: -20
}
// this JavaScript snippet is appended to <<fastify-openapi-route>>
fastify.route({
  url: '/api/newtonraphson',
  method: 'POST',
  schema: {
    body: requestBodySchema,
    response: {
      200:
        {
          "type": "object",
          "description": "this JSON document is later referred to as <<response-schema>>",
          "properties": {
              "root": {
                "title": "Root",
                "type": "number"
              }
          },
          "required": [
              "root"
          ],
          "additionalProperties": false
        }
    }
  },
  handler
})
// this JavaScript snippet is appended to webassembly/openapi.js
const main = async () => {
  try {
    await fastify.ready()
    fastify.oas()
    const host = '127.0.0.1'
    const port = 3001
    console.log(`Server listening on http://${host}:${port} (Press CTRL+C to quit)`)
    await fastify.listen(port, host)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
main()