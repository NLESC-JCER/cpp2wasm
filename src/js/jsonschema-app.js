// ~\~ language=jsx filename=src/js/jsonschema-app.js
// ~\~ begin <<README.md|src/js/jsonschema-app.js>>[0]
// this JavaScript snippet stored as src/js/jsonschema-app.js
function App() {
  /* ~\~ begin <<README.md|jsonschema-app>>[0] */
  // this JavaScript snippet is later referred to as <<jsonschema-app>>
  const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "https://nlesc-jcer.github.io/cpp2wasm/NNRequest.json",
    "type": "object",
    "properties": {
      "epsilon": {
        "title": "Epsilon",
        "type": "number",
        "minimum": 0
      },
      "guess": {
        "title": "Initial guess",
        "type": "integer",
        "minimum": -100,
        "maximum": 100
      }
    },
    "required": ["epsilon", "guess"],
    "additionalProperties": false
  }
  /* ~\~ end */
  /* ~\~ begin <<README.md|jsonschema-app>>[1] */
  // this JavaScript snippet is appended to <<jsonschema-app>>
  const Form = JSONSchemaForm.default;
  /* ~\~ end */
  /* ~\~ begin <<README.md|jsonschema-app>>[2] */
  const uiSchema = {
    "guess": {
      "ui:widget": "range"
    }
  }
  /* ~\~ end */
  /* ~\~ begin <<README.md|jsonschema-app>>[3] */
  // this JavaScript snippet is appended to <<jsonschema-app>>
  const [formData, setFormData] = React.useState({
    epsilon: 0.001,
    guess: -20
  });

  function handleChange(event) {
    setFormData(event.formData);
  }
  /* ~\~ end */
  /* ~\~ begin <<README.md|jsonschema-app>>[4] */
  // this JavaScript snippet is appended to <<jsonschema-app>>
  const [root, setRoot] = React.useState(undefined);

  function handleSubmit({formData}, event) {
    event.preventDefault();
    const worker = new Worker('worker.js');
    worker.postMessage({
      type: 'CALCULATE',
      payload: formData
    });
    worker.onmessage = function(message) {
        if (message.data.type === 'RESULT') {
          const result = message.data.payload.root;
          setRoot(result);
          worker.terminate();
      }
    };
  }
  /* ~\~ end */

  return (
    <div>
      <Heading/>
      { /* ~\~ begin <<README.md|jsonschema-form>>[0] */ }
      { /* this JavaScript snippet is later referred to as <<jsonschema-form>>  */}
      <Form
        uiSchema={uiSchema}
        schema={schema}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      { /* ~\~ end */ }
      <Result root={root}/>
    </div>
  );
}

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
// ~\~ end
// ~\~ begin <<README.md|src/js/jsonschema-app.js>>[1]
// this JavaScript snippet appended to src/js/jsonschema-app.js
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
// ~\~ end
