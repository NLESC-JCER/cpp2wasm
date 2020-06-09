// this JavaScript snippet stored as src/js/plot-app.js
// this JavaScript snippet is later referred to as <<heading-component>>
function Heading() {
  const title = 'Root finding web application';
  return <h1>{title}</h1>
}

// this JavaScript snippet is later referred to as <<plot-component>>
function Plot({roots}) {
  const container = React.useRef(null);

  function didUpdate() {
    if (container.current === null) {
      return;
    }
    // this JavaScript snippet is later referred to as <<vega-lite-spec>>
    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "data": { "values": roots },
      "mark": "point",
      "encoding": {
        "x": { "field": "epsilon", "type": "quantitative" },
        "y": { "field": "duration", "type": "quantitative", "title": "Duration (ms)" }
      },
      "width": 800,
      "height": 600
    };
    vegaEmbed(container.current, spec);
  }
  const dependencies = [container, roots];
  React.useEffect(didUpdate, dependencies);

  return <div ref={container}/>;
}

function App() {
  const Form = JSONSchemaForm.default;
  const uiSchema = {
    "guess": {
      "ui:widget": "range"
    }
  }
  const [formData, setFormData] = React.useState({

  });

  function handleChange(event) {
    setFormData(event.formData);
  }

  // this JavaScript snippet is later referred to as <<jsonschema-app>>
  const schema = {
    "type": "object",
    "properties": {
      "epsilon": {
        "title": "Epsilon",
        "type": "object",
        "properties": {
          "min": {
            "type": "number",
            "minimum": 0,
            "default": 0.0001
          },
          "max": {
            "type": "number",
            "minimum": 0,
            "default": 0.001
          },
          "step": {
            "type": "number",
            "minimum": 0,
            "default": 0.0001
          }
        },
        "required": ["min", "max", "step"],
        "additionalProperties": false
      },
      "guess": {
        "title": "Initial guess",
        "type": "number",
        "minimum": -100,
        "maximum": 100,
        "default": -20
      }
    },
    "required": ["epsilon", "guess"],
    "additionalProperties": false
  }
  // this JavaScript snippet is appended to <<plot-app>>
  const [roots, setRoots] = React.useState([]);

  function handleSubmit(submission, event) {
    event.preventDefault();
    const worker = new Worker('worker-sweep.js');
    worker.postMessage({
      type: 'CALCULATE',
      payload: submission.formData
    });
    worker.onmessage = function(message) {
        if (message.data.type === 'RESULT') {
          const result = message.data.payload.roots;
          setRoots(result);
          worker.terminate();
      }
    };
  }

  return (
    <div>
      <Heading/>
      { /* this JavaScript snippet is later referred to as <<jsonschema-form>>  */}
      <Form
        schema={schema}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      <Plot roots={roots}/>
    </div>
  );
}

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);