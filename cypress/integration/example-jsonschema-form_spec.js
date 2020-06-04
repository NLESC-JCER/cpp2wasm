/* ~\~ language=JavaScript filename=cypress/integration/example-jsonschema-form_spec.js */
/* ~\~ begin <<TESTING.md|cypress/integration/example-jsonschema-form_spec.js>>[0] */
describe('src/js/example-jsonschema-form.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-jsonschema-form.html');
    cy.get('input[id=root_epsilon]').type('{selectall}0.1');
    // TODO assert value is set
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});
/* ~\~ end */
