describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    cy.get('input[name=guess]').type('0');
    // TODO assert value is set
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});