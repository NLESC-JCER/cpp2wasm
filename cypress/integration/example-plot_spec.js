describe('react/example-plot.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/react/example-plot.html');
    cy.contains('Submit').click();
    // TODO assert plot has been plotted, see https://github.com/NLESC-JCER/cpp2wasm/issues/55
  });
});