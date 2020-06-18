// this JavaScript snippet stored as webassembly/webservice-threaded.js
const { StaticPool } = require('node-worker-threads-pool')

const pool = new StaticPool({
  size: 4,
  task: './webassembly/task.js'
});
// this JavaScript snippet is appended to webassembly/webservice-threaded.js
// this JavaScript snippet is later referred to as <<fastify-openapi-plugin>>
// this JavaScript snippet is later referred to as <<import-wasm-fastify>>
const fastify = require('fastify')()
// this JavaScript snippet is appended to <<fastify-openapi-plugin>>
const oas = require('fastify-oas')
// this JavaScript snippet is appended to <<fastify-openapi-plugin>>
fastify.register(oas, {
  swagger: {
    info: {
      title: 'Root finder',
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
    }, {
      url: 'http://localhost:3002'
    }]
  },
  exposeRoute: true
})

// this JavaScript snippet later referred to as <<fastify-handler-threaded>>

const handler = async ({body}) => {
  const { epsilon, guess } = body
  const root = await pool.exec({epsilon, guess})
  return { root }
}

// this JavaScript snippet is later referred to as <<fastify-openapi-route>>
const requestSchemaWithExample =
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
requestSchemaWithExample.example = {
  epsilon: 0.001,
  guess: -20
}
// this JavaScript snippet is appended to <<fastify-openapi-route>>
fastify.route({
  url: '/api/newtonraphson',
  method: 'POST',
  schema: {
    body: requestSchemaWithExample,
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

// this JavaScript snippet is later referred to as <<fastify-listen>>
const main = async (port) => {
  try {
    const host = '127.0.0.1'
    console.log('Server listening on http://%s:%d (Press CTRL+C to quit)', host, port)
    await fastify.listen(port, host)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
main(3002)