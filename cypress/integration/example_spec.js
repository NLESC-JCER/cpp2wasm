/* ~\~ language=JavaScript filename=cypress/integration/example_spec.js */
/* ~\~ begin <<TESTING.md|cypress/integration/example_spec.js>>[0] */
// this JavaScript snippet is run by cypress and is stored as cypress/integration/example_spec.js
describe('src/js/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example.html');
    cy.get('#answer').contains('-1.00');
  });
});
/* ~\~ end */
