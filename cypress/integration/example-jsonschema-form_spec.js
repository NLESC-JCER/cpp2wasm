describe('react/example-jsonschema-form.html', () => {
  it('should render -1.00', () => {
    cy.visit('http://localhost:8000/react/example-jsonschema-form.html');
    // The JSON schema powered form uses a hierarchy of identifiers for each input field starting with `root`
    // As the `epsilon` input field is a direct child of root, it has `root_epsilon` as an identifier
    const input_selector = 'input[id=root_epsilon]';
    // In initial guess input field we replace the default value with 0.1
    cy.get(input_selector).type('{selectall}0.1');
    cy.contains('Submit').click();
    cy.get('#answer').contains('-1.00');
  });
});