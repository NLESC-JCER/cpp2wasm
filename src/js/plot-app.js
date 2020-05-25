// this JavaScript snippet stored as src/js/plot-app.js
// this JavaScript snippet is later referred to as <<heading-component>>
function Heading() {
  const title = 'Root finding web application';
  return <h1>{title}</h1>
}

// this JavaScript snippet is later referred to as <<plot-component>>

function Plot({data}) {
  const container = React.useRef(null);
  React.useEffect(() => {
    if (container === null || data.length === 0) {
      return;
    }
    console.log(data);
    const spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "description": "A scatterplot showing of root finding with different epsilons versus the calculation duration",
      "data": {"values": data},
      "mark": "point",
      "encoding": {
        "x": {"field": "epsilon", "type": "quantitative"},
        "y": {"field": "duration", "type": "quantitative"}
      },
      "width": 800,
      "height": 600
    };
    vegaEmbed(container.current, spec);
  }, [container, data]);

  return <div ref={container}/>;
}

function App() {
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
  const Form = JSONSchemaForm.default;
  const uiSchema = {
    "guess": {
      "ui:widget": "range"
    }
  }
  const [formData, setFormData] = React.useState({});

  function handleChange(event) {
    setFormData(event.formData);
  }
  // this JavaScript snippet is appended to <<plot-app>>
  const [roots, setRoots] = React.useState([]);

  function handleSubmit({formData}, event) {
    event.preventDefault();
    const worker = new Worker('worker-sweep.js');
    worker.postMessage({
      type: 'CALCULATE',
      payload: { epsilon: formData.epsilon, guess: formData.guess }
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
        uiSchema={uiSchema}
        schema={schema}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      <Plot data={roots}/>
    </div>
  );
}

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);
// this JavaScript snippet appended to src/js/plot-app.js