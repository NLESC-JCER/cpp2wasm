// this JavaScript snippet stored as src/js/jsonschema-app.js
function App() {
  // this JavaScript snippet is later referred to as <<jsonschema-app>>
  const schema = {
    "type": "object",
    "properties": {
      "epsilon": {
        "title": "Epsilon",
        "type": "number",
        "minimum": 0,
        "default": 0.001
      },
      "guess": {
        "title": "Initial guess",
        "type": "number",
        "default": -20
      }
    },
    "required": ["epsilon", "guess"],
    "additionalProperties": false
  }
  // this JavaScript snippet is appended to <<jsonschema-app>>
  const Form = JSONSchemaForm.default;
  // this JavaScript snippet is appended to <<jsonschema-app>>
  const [root, setRoot] = React.useState(undefined);

  function handleSubmit({formData}, event) {
    event.preventDefault();
    const worker = new Worker('worker.js');
    worker.postMessage({
      type: 'CALCULATE',
      payload: { epsilon: formData.epsilon, guess: formData.guess }
    });
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
      { /* this JavaScript snippet is later referred to as <<jsonschema-form>>  */}
      <Form schema={schema} onSubmit={handleSubmit}/>
      <Result root={root}/>
    </div>
  );
}

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
// this JavaScript snippet appended to src/js/jsonschema-app.js
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