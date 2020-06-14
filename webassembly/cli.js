// this JavaScript snippet stored as webassembly/cli.js
// this JavaScript snippet is later referred to as <<import-wasm>>
const createModule = require('./newtonraphsonwasm.js')

const main = async () => {
  const epsilon = parseFloat(process.argv[2])
  const guess = parseFloat(process.argv[3])
  // this JavaScript snippet is later referred to as <<find-root-js>>
  const { NewtonRaphson } = await createModule()
  // this JavaScript snippet is appended to <<find-root-js>>
  const finder = new NewtonRaphson(epsilon)
  const root = finder.solve(guess)
  console.log(`Given epsilon of ${epsilon} and inital guess of ${guess} the found root is ${root.toPrecision(3)}`)
}
main()