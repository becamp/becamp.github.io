Feature: The registration form cannot be submitted twice
  The reCAPTCHA path holds the POST for up to five seconds. An impatient second
  click in that window would post the form twice and write a duplicate row.

  Scenario: The submit button is disabled on first click
    Given a visitor has filled in the registration form
    When they click "Submit Registration"
    Then the submit button becomes disabled
    And the submit button reads "Submitting…"

  Scenario: A second click during the reCAPTCHA wait does nothing
    Given the visitor has clicked submit
    And the form is waiting on a reCAPTCHA token
    When they click the submit button again
    Then no second submission is sent

  Scenario: The disabled button is visibly inactive
    When the submit button is disabled
    Then it is rendered at reduced opacity
