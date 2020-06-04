# Tests

To make sure [JavaScript and WebAssembly code snippets](README.md#JavaScript) and [Single page application](README.md#single-page-application) work we want have a tests for them.

To test, we will use the [cypress](https://www.cypress.io/) JavaScript end to end testing  framework.
Cypress can simulate user behavior such as clicking buttons etc. and checks expected result in a web browser.

In the following example, we test if the example web page renders the answer `-1.00` when it is visited.

Let's, first write a test for the direct WebAssembly example.

```{.js file=cypress/integration/example_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example_spec.js
describe('src/js/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

Second, a test for the WebAssembly called through a web worker.

```{.js file=cypress/integration/example-web-worker_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example-web-worker_spec.js
describe('src/js/example-web-worker.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-web-worker.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

And lastly, a test for the React/form/Web worker/WebAssembly combination.
Let us also change the guess value.

```{.js file=cypress/integration/example-app_spec.js}
describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    cy.get('input[name=guess]').type('0');
    // TODO assert value is set
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
```

And another test for the full application, but now with JSON schema powered form.

```{.js file=cypress/integration/example-jsonschema-form_spec.js}
describe('src/js/example-jsonschema-form.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-jsonschema-form.html');
    cy.get('input[id=root_epsilon]').type('{selectall}0.1');
    // TODO assert value is set
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
```

And lastly a test for the web application with a plot.

```{.js file=cypress/integration/example-plot_spec.js}
describe('src/js/example-plot.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-plot.html');
    cy.contains('Submit').click();
    // TODO assert plot
  });
});
```

The test can be run with the following command:

```{.awk #test-wasm}
npx cypress run --config-file false
```

The [`npx`](https://www.npmjs.com/package/npx) command ships with NodeJS which is included in the Emscripten SDK and can be used to run commands available on [npm repository](https://npmjs.com/).

The tests will also be run in the [GH Action continous integration build](.github/workflows/main.yml).
