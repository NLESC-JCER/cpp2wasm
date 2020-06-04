/* ~\~ language=JavaScript filename=src/js/worker.js */
/* ~\~ begin <<README.md|src/js/worker.js>>[0] */
// this JavaScript snippet is stored as src/js/worker.js
importScripts('newtonraphsonwasm.js');

/* ~\~ begin <<README.md|worker-provider-onmessage>>[0] */
// this JavaScript snippet is later referred to as <<worker-provider-onmessage>>
onmessage = function(message) {
  /* ~\~ begin <<README.md|handle-message>>[0] */
  // this JavaScript snippet is before referred to as <<handle-message>>
  if (message.data.type === 'CALCULATE') {
    createModule().then((module) => {
      /* ~\~ begin <<README.md|perform-calc-in-worker>>[0] */
      // this JavaScript snippet is before referred to as <<perform-calc-in-worker>>
      const epsilon = message.data.payload.epsilon;
      const finder = new module.NewtonRaphson(epsilon);
      const guess = message.data.payload.guess;
      const root = finder.find(guess);
      /* ~\~ end */
      /* ~\~ begin <<README.md|post-result>>[0] */
      // this JavaScript snippet is before referred to as <<post-result>>
      postMessage({
        type: 'RESULT',
        payload: {
          root: root
        }
      });
      /* ~\~ end */
    });
  }
  /* ~\~ end */
};
/* ~\~ end */
/* ~\~ end */
