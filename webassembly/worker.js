// this JavaScript snippet is stored as webassembly/worker.js
importScripts('newtonraphsonwasm.js');

// this JavaScript snippet is later referred to as <<worker-provider-onmessage>>
onmessage = function(message) {
  // this JavaScript snippet is before referred to as <<handle-message>>
  if (message.data.type === 'CALCULATE') {
    createModule().then((module) => {
      // this JavaScript snippet is before referred to as <<perform-calc-in-worker>>
      const epsilon = message.data.payload.epsilon;
      const finder = new module.NewtonRaphson(epsilon);
      const guess = message.data.payload.guess;
      const root = finder.solve(guess);
      // this JavaScript snippet is before referred to as <<post-result>>
      postMessage({
        type: 'RESULT',
        payload: {
          root: root
        }
      });
    });
  }
};