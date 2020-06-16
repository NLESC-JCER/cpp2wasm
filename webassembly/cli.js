// this JavaScript snippet stored as webassembly/cli.js
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')

const main = async () => {
  const epsilon = parseFloat(process.argv[2])
  const guess = parseFloat(process.argv[3])
  // this JavaScript snippet is later referred to as <<find-root-js>>
  const module = await createModule()
  // this JavaScript snippet is appended to <<find-root-js>>
  const finder = new module.NewtonRaphson(epsilon)
  const root = finder.solve(guess)
  const msg = 'Given epsilon of %d and inital guess of %d the found root is %s'
  console.log(msg, epsilon, guess, root.toPrecision(3))
}
main()