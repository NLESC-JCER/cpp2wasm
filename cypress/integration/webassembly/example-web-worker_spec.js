// this JavaScript snippet is run by cypress and is stored as cypress/integration/example-web-worker_spec.js
describe('webassembly/example-web-worker.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/webassembly/example-web-worker.html');
    cy.get('#answer').contains('-1.00');
  });
});