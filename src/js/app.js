// this JavaScript snippet is later referred to as <<heading-component>>
function Heading() {
  const title = 'Root finding web application';
  return <h1>{title}</h1>
}
// this JavaScript snippet is later referred to as <<result-component>>
function Result(props) {
  const root = props.root;
  let message = 'Not submitted';
  if (root !== undefined) {
    message = 'Root = ' + root;
  }
  return <div id="answer">{message}</div>;
}

// this JavaScript snippet appenended to src/js/app.js
function App() {
  // this JavaScript snippet is later referred to as <<react-state>>
  const [epsilon, setEpsilon] = React.useState(0.001);
  // this JavaScript snippet is appended to <<react-state>>
  function onEpsilonChange(event) {
    setEpsilon(event.target.value);
  }
  // this JavaScript snippet is appended to <<react-state>>
  const [guess, setGuess] = React.useState(-20);

  function onGuessChange(event) {
    setGuess(event.target.value);
  }
  // this JavaScript snippet is appended to <<react-state>>
  const [root, setRoot] = React.useState(undefined);

  function handleSubmit(event) {
    // this JavaScript snippet is later referred to as <<handle-submit>>
    event.preventDefault();
    // this JavaScript snippet is appended to <<handle-submit>>
    const worker = new Worker('worker.js');
    // this JavaScript snippet is appended to <<handle-submit>>
    worker.postMessage({
      type: 'CALCULATE',
      payload: { epsilon: epsilon, guess: guess }
    });
    // this JavaScript snippet is appended to <<handle-submit>>
    worker.onmessage = function(message) {
        if (message.data.type === 'RESULT') {
          const result = message.data.payload.root;
          setRoot(result);
          worker.terminate();
      }
    };
  }

  return (
    <div>
      <Heading/>
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
      <Result root={root}/>
    </div>
  );
}
// this JavaScript snippet appenended to src/js/app.js
ReactDOM.render(
  <App/>,
  document.getElementById('container')
);