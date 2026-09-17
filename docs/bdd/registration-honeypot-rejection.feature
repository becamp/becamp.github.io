Feature: Honeypot field blocks automated submissions
  A hidden field named "bc-hp" sits off-screen in the form. Real visitors never
  fill it. A submission that does is silently discarded and shown the success
  banner, so a bot gets no signal to adapt.

  The field name is deliberately meaningless: a field named "website", "url" or
  "company" gets autofilled by password managers, which previously threw real
  registrations away behind a success message.

  Scenario: A filled honeypot is discarded
    Given a submission where the field "bc-hp" contains any value
    When the submission reaches the registration endpoint
    Then no record is created in Airtable
    And the visitor is redirected to "/register?status=success"
    And the response is indistinguishable from a real success

  Scenario: The discard is recorded for diagnosis
    Given a submission where the field "bc-hp" contains any value
    When the submission reaches the registration endpoint
    Then a warning naming the submitted email is written to the logs
    And an autofill victim can be told apart from a bot in those logs

  Scenario: The honeypot is hidden from sight but reachable by the form
    When the registration page is rendered
    Then the honeypot wrapper is positioned off-screen
    And the wrapper is marked aria-hidden
    And the honeypot input has tabindex "-1"
    And the honeypot input has autocomplete "off"

  Scenario: The honeypot is never persisted with the visitor's other answers
    Given a visitor submits the registration form
    When the form values are stashed for the round trip
    Then the honeypot field is excluded from the stash
