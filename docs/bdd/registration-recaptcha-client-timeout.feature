Feature: The registration form never waits indefinitely on reCAPTCHA
  The form holds the POST while it asks reCAPTCHA for a token. A cold first load
  can genuinely take several seconds, and that used to cost a registration, so
  the wait is bounded and every path submits exactly once.

  Scenario: A token that arrives in time is attached to the submission
    Given the reCAPTCHA script has loaded
    When the visitor submits the form
    And reCAPTCHA returns a token within five seconds
    Then the token is placed in the hidden "recaptcha-token" field
    And the form is submitted once

  Scenario: A token that never arrives falls back to a sentinel
    Given the reCAPTCHA script has loaded
    When the visitor submits the form
    And reCAPTCHA has not answered after five seconds
    Then the hidden "recaptcha-token" field is set to "unavailable"
    And the form is submitted once

  Scenario: A token request that fails falls back to the sentinel
    Given the reCAPTCHA script has loaded
    When the visitor submits the form
    And the reCAPTCHA token request rejects
    Then the hidden "recaptcha-token" field is set to "unavailable"
    And the form is submitted once

  Scenario: The timeout and the resolved promise cannot both submit
    Given the reCAPTCHA script has loaded
    When the visitor submits the form
    And the five-second fallback and the token both reach the finish line
    Then the form is submitted exactly once
    And Airtable receives no duplicate row

  Scenario: A blocked reCAPTCHA script does not block registration
    Given a content blocker prevented the reCAPTCHA script from loading
    When the visitor submits the form
    Then the submission proceeds as a plain form post
    And the endpoint treats the absent token as unverified rather than as a bot

  Scenario: reCAPTCHA is absent entirely when no site key is configured
    Given PUBLIC_RECAPTCHA_SITE_KEY is not set
    When the registration page is rendered
    Then no reCAPTCHA script tag is present
    And the honeypot still guards the form

  Scenario: Binding survives client-side navigation
    Given the visitor arrives on the registration page by client-side navigation
    When the page load event fires
    Then the submit handler is bound to the current form
    And it is not bound a second time on a repeat event
