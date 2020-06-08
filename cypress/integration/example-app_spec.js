describe('src/js/example-app.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-app.html');
    // We append a 0 to the guess input field so it becomes -200 
    cy.get('input[name=guess]').type('0');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});