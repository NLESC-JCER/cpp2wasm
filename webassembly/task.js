// this JavaScript snippet appended to webassembly/task.js
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')
const { parentPort } = require('worker_threads')

parentPort.on('message', async ({epsilon, guess}) => {
  // this JavaScript snippet appended to webassembly/task.js
  const { NewtonRaphson } = await createModule()
  // this JavaScript snippet appended to webassembly/task.js
  const finder = new NewtonRaphson(epsilon)
  const root = finder.solve(guess)
  // this JavaScript snippet appended to webassembly/task.js
  parentPort.postMessage(root)
})