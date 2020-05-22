# Tests

To make sure [JavaScript and WebAssembly code snippets](README.md#JavaScript) and [Single page application](README.md#single-page-application) work we want have a tests for them.

To test we will use the [cypress](https://www.cypress.io/) test framework.
Cypress can simulate what a user would do and expect in a web browser.

We want to test if visiting the example web page renders the answer `-1.00`.

First a test for the direct WebAssembly example.

```{.js file=cypress/integration/example_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example_spec.js
describe('src/js/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

Second a test for the WebAssembly called through a web worker.

```{.js file=cypress/integration/example-web-worker_spec.js}
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example-web-worker_spec.js
describe('src/js/example-web-worker.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-web-worker.html');
    cy.get('#answer').contains('-1.00');
  });
});
```

And lastly a test for the full React/form/Web worker/WebAssembly combination.

```{.js file=cypress/integration/example-app_spec.js}
describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    cy.get('input[name=guess]').type('-30');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
```

The test can be run with

```{.awk #test-wasm}
npx cypress run --config-file false
```

The `npx` command ships with NodeJS which is included in the Emscripten SDK and can be used to run commands available on [npm repository](https://npmjs.com/).

The tests will also be run in the [GH Action continous integration build](.github/workflows/main.yml).
