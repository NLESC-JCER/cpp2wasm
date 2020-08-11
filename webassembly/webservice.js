// this JavaScript snippet stored as webassembly/webservice.js
// this JavaScript snippet is later referred to as <<import-wasm-fastify>>
const fastify = require('fastify')()
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')
// this JavaScript snippet appended to webassembly/webservice.js
// this JavaScript snippet is later referred to as <<fastify-handler>>
const handler = async ({body}) => {
  const { epsilon, guess } = body
  // this JavaScript snippet is later referred to as <<find-root-js>>
  const module = await createModule()
  // this JavaScript snippet is appended to <<find-root-js>>
  const finder = new module.NewtonRaphson(epsilon)
  const root = finder.solve(guess)
  return { root }
}

fastify.route({
  url: '/api/newtonraphson',
  method: 'POST',
  schema: {
    body:
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
    ,
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
// this JavaScript snippet is appended to webassembly/webservice.js
// this JavaScript snippet is later referred to as <<fastify-listen>>
const main = async (port) => {
  try {
    const host = 'localhost'
    console.log('Server listening on http://%s:%d (Press CTRL+C to quit)', host, port)
    await fastify.listen(port, host)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
main(3000)