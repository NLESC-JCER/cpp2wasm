// this JavaScript snippet is run by cypress and is stored as cypress/integration/example_spec.js
describe('webassembly/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/webassembly/example.html');
    cy.get('#answer').contains('-1.00');
  });
});