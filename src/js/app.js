// ~\~ language=jsx filename=src/js/app.js
// ~\~ begin <<README.md|src/js/app.js>>[0]
// ~\~ begin <<README.md|heading-component>>[0]
// this JavaScript snippet is later referred to as <<heading-component>>
function Heading() {
  const title = 'Root finding web application';
  return <h1>{title}</h1>
}
// ~\~ end
// ~\~ begin <<README.md|result-component>>[0]
// this JavaScript snippet is later referred to as <<result-component>>
function Result(props) {
  const root = props.root;
  let message = 'Not submitted';
  if (root !== undefined) {
    message = 'Root = ' + root;
  }
  return <div id="answer">{message}</div>;
}
// ~\~ end

// this JavaScript snippet appenended to src/js/app.js
function App() {
  /* ~\~ begin <<README.md|react-state>>[0] */
  // this JavaScript snippet is later referred to as <<react-state>>
  const [epsilon, setEpsilon] = React.useState(0.001);
  /* ~\~ end */
  /* ~\~ begin <<README.md|react-state>>[1] */
  // this JavaScript snippet is appended to <<react-state>>
  function onEpsilonChange(event) {
    setEpsilon(Number(event.target.value));
  }
  /* ~\~ end */
  /* ~\~ begin <<README.md|react-state>>[2] */
  // this JavaScript snippet is appended to <<react-state>>
  const [guess, setGuess] = React.useState(-20);

  function onGuessChange(event) {
    setGuess(Number(event.target.value));
  }
  /* ~\~ end */
  /* ~\~ begin <<README.md|react-state>>[3] */
  // this JavaScript snippet is appended to <<react-state>>
  const [root, setRoot] = React.useState(undefined);
  /* ~\~ end */

  function handleSubmit(event) {
    // ~\~ begin <<README.md|handle-submit>>[0]
    // this JavaScript snippet is later referred to as <<handle-submit>>
    event.preventDefault();
    // ~\~ end
    // ~\~ begin <<README.md|handle-submit>>[1]
    // this JavaScript snippet is appended to <<handle-submit>>
    const worker = new Worker('worker.js');
    // ~\~ end
    // ~\~ begin <<README.md|handle-submit>>[2]
    // this JavaScript snippet is appended to <<handle-submit>>
    worker.postMessage({
      type: 'CALCULATE',
      payload: { epsilon: epsilon, guess: guess }
    });
    // ~\~ end
    // ~\~ begin <<README.md|handle-submit>>[3]
    // this JavaScript snippet is appended to <<handle-submit>>
    worker.onmessage = function(message) {
        if (message.data.type === 'RESULT') {
          const result = message.data.payload.root;
          setRoot(result);
          worker.terminate();
      }
    };
    // ~\~ end
  }

  return (
    <div>
      <Heading/>
      { /* ~\~ begin <<README.md|react-form>>[0] */ }
      { /* this JavaScript snippet is later referred to as <<react-form>> */ }
      <form onSubmit={handleSubmit}>
        <label>
          Epsilon:
          <input name="epsilon" type="number" value={epsilon} onChange={onEpsilonChange}/>
        </label>
        <label>
          Initial guess:
          <input name="guess" type="number" value={guess} onChange={onGuessChange}/>
        </label>
        <input type="submit" value="Submit" />
      </form>
      { /* ~\~ end */ }
      <Result root={root}/>
    </div>
  );
}
// ~\~ end
// ~\~ begin <<README.md|src/js/app.js>>[1]
// this JavaScript snippet appenended to src/js/app.js
ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
// ~\~ end
