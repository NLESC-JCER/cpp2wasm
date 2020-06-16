// this JavaScript snippet stored as webassembly/task.js
const createModule = require('./newtonraphsonwasm.js')
// this JavaScript snippet appended to webassembly/task.js
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