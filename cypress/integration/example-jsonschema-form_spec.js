describe('src/js/example-jsonschema-form.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-jsonschema-form.html');
    cy.get('input[id=root_guess]').type('-30');
    cy.get('input[id=root_guess]').contains('-30');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});