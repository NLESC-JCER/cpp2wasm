# Tests

To make sure [JavaScript and WebAssembly code snippets](README.md#JavaScript) and [Single page application](README.md#single-page-application) work we want have a tests for them.

To test, we will use the [cypress](https://www.cypress.io/) JavaScript end to end testing framework.
Cypress can simulate user behavior such as clicking buttons etc. and checks expected result in a web browser.

In the following examples, we test if the example web pages render the answer `-1.00` when they are visited.

To visit a web page we need to start a simple web server with using Python

```shell
python3 -m http.server 8000
```

Let's, first write a test for the [direct WebAssembly example](http://localhost:8000/webassembly/example.html).

```{.js file=cypress/integration/webassembly/example_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example_spec.js
describe('webassembly/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/webassembly/example.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

Second, a test for the WebAssembly called through a [web worker](http://localhost:8000/webassembly/example-web-worker.html).

```{.js file=cypress/integration/webassembly/example-web-worker_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example-web-worker_spec.js
describe('webassembly/example-web-worker.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/webassembly/example-web-worker.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

Third, a test for the [React/form/Web worker/WebAssembly combination](http://localhost:8000/react/example-app.html).
Let us also change the initial guess value.

```{.js file=cypress/integration/react/example-app_spec.js}
describe('react/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/react/example-app.html');
    // The initial value of the guess input field is -20 so we append a 0 and it becomes -200 
    cy.get('input[name=guess]').type('0');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
```

And similar test to the previous one, but now with [JSON schema powered form](http://localhost:8000/react/example-jsonschema-form.html).

```{.js file=cypress/integration/react/example-jsonschema-form_spec.js}
describe('react/example-jsonschema-form.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/react/example-jsonschema-form.html');
    // The JSON schema powered form uses a hierarchy of identifiers for each input field starting with `root`
    // As the `epsilon` input field is a direct child of root, it has `root_epsilon` as an identifier
    const input_selector = 'input[id=root_epsilon]';
    // In initial guess input field we replace the default value with 0.1
    cy.get(input_selector).type('{selectall}0.1');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
```

And lastly a test for the [web application with a plot](http://localhost:8000/react/example-plot.html).

```{.js file=cypress/integration/react/example-plot_spec.js}
describe('react/example-plot.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/react/example-plot.html');
    cy.contains('Submit').click();
    // TODO assert plot has been plotted, see https://github.com/NLESC-JCER/cpp2wasm/issues/55
  });
});
```

The test can be run with the one of the following commands:

```{.awk #test-webassembly}
npx cypress run --config-file false --spec 'cypress/integration/webassembly/*_spec.js'
```

```{.awk #test-react}
npx cypress run --config-file false --spec 'cypress/integration/react/*_spec.js'
```

The [`npx`](https://www.npmjs.com/package/npx) command ships with NodeJS which is included in the Emscripten SDK and can be used to run commands available on [npm repository](https://npmjs.com/).

The tests will also be run in the [GH Action continous integration build](.github/workflows/main.yml).
