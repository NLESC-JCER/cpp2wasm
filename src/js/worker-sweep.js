// this JavaScript snippet stored as src/js/worker-sweep.js
importScripts('newtonraphsonwasm.js');

onmessage = function(message) {
  if (message.data.type === 'CALCULATE') {
    createModule().then((module) => {
      const {min,max,step} = message.data.payload.epsilon;
      const guess = message.data.payload.guess;
      const roots = [];
      for (let epsilon = min; epsilon <= max; epsilon += step) {
        const t0 = performance.now();
        const finder = new module.NewtonRaphson(epsilon);
        const root = finder.find(guess);
        const t1 = performance.now();
        roots.push({
          epsilon,
          guess,
          root,
          duration: t1 - t0
        });
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