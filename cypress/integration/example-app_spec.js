/* ~\~ language=JavaScript filename=cypress/integration/example-app_spec.js */
/* ~\~ begin <<TESTING.md|cypress/integration/example-app_spec.js>>[0] */
describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    cy.get('input[name=guess]').type('0');
    // TODO assert value is set
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
/* ~\~ end */
