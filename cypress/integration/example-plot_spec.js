describe('src/js/example-plot.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/src/js/example-plot.html');
    cy.contains('Submit').click();
    // TODO assert plot
  });
});