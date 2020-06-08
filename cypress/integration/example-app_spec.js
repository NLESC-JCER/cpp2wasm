describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    // In initial guess input field type 0 to append 0 to default -20 so the value is -200
    cy.get('input[name=guess]').type('0');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});