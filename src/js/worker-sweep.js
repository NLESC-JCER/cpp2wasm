// this JavaScript snippet stored as src/js/worker-sweep.js
importScripts('newtonraphsonwasm.js');

onmessage = function(message) {
  if (message.data.type === 'CALCULATE') {
    createModule().then((module) => {
      // this JavaScript snippet is later referred to as <<calculate-sweep>>
      const {min, max, step} = message.data.payload.epsilon;
      const guess = message.data.payload.guess;
      // this JavaScript snippet appended to <<calculate-sweep>>
      const roots = [];
      // this JavaScript snippet appended to <<calculate-sweep>>
      for (let epsilon = min; epsilon <= max; epsilon += step) {
        // this JavaScript snippet appended to <<calculate-sweep>>
        const t0 = performance.now();
        const finder = new module.NewtonRaphson(epsilon);
        const root = finder.solve(guess);
        const duration = performance.now() - t0;
        // this JavaScript snippet appended to <<calculate-sweep>>
        roots.push({
          epsilon,
          guess,
          root,
          duration
        });
        // this JavaScript snippet appended to <<calculate-sweep>>
      }
      postMessage({
        type: 'RESULT',
        payload: {
          roots
        }
      });
    });
  }
};