describe('src/js/example.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example.html');
    cy.get('#answer').contains('-1.00');
  });
});