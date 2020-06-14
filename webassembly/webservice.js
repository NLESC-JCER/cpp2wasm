// this JavaScript snippet stored as webassembly/webservice.js
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')
const fastify = require('fastify')()
// this JavaScript snippet is appended to webassembly/webservice.js
const handler = async ({body}) => {
  const { epsilon, guess } = body
  // this JavaScript snippet is later referred to as <<find-root-js>>
  const { NewtonRaphson } = await createModule()
  // this JavaScript snippet is appended to <<find-root-js>>
  const finder = new NewtonRaphson(epsilon)
  const root = finder.solve(guess)
  return { root }
}
// this JavaScript snippet is appended to webassembly/webservice.js
fastify.route({
  url: '/api/newtonraphson',
  method: 'POST',
  schema: {
    body:
        {
           "type": "object",
           "properties": {
              "epsilon": {
                 "type": "number",
                 "minimum": 0
              },
              "guess": {
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
            "properties": {
                "root": {
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
const main = async () => {
  try {
    const host = '127.0.0.1'
    const port = 3000
    console.log(`Server listening on http://${host}:${port} (Press CTRL+C to quit)`)
    await fastify.listen(port, host)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
main()