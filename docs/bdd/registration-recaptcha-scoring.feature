Feature: reCAPTCHA scoring is advisory, not a gate
  reCAPTCHA v3 scores each submission. Only a score Google actively places below
  the bot threshold is refused; anything Google cannot render a verdict on is
  accepted and logged.

  This is deliberate. The script is blocked by content blockers, a cold first
  load can outrun the client timeout, and v3 scores a visitor lowest on their
  first interaction with a domain — which is exactly when someone registers.
  Treating those as bots produced "errored the first time, worked on the second
  try" reports. The honeypot remains the hard block.

  Background:
    Given RECAPTCHA_SECRET_KEY is configured on the endpoint
    And the bot threshold is 0.2

  Scenario: A submission Google scores as a bot is refused
    Given Google returns a score of 0.1 for the token
    When the submission reaches the registration endpoint
    Then no record is created in Airtable
    And the visitor is redirected to "/register?status=error&reason=captcha"
    And the error banner offers to register them by hand over email

  Scenario Outline: A submission at or above the threshold is accepted
    Given Google returns a score of <score> for the token
    When the submission reaches the registration endpoint
    Then the record is created in Airtable

    Examples:
      | score |
      | 0.2   |
      | 0.3   |
      | 0.9   |

  Scenario Outline: No usable verdict is treated as unknown, never as a bot
    Given the token verification <outcome>
    When the submission reaches the registration endpoint
    Then the record is created in Airtable
    And a warning noting the submission was accepted unverified is logged

    Examples:
      | outcome                                    |
      | fails with a network error                 |
      | returns success false with an error code   |
      | returns success true but carries no score  |

  Scenario: A token the client could not obtain skips verification entirely
    Given the submitted token is the sentinel "unavailable"
    When the submission reaches the registration endpoint
    Then no verification request is sent to Google
    And the record is created in Airtable

  Scenario: A missing token skips verification entirely
    Given the submission carries no reCAPTCHA token
    When the submission reaches the registration endpoint
    Then no verification request is sent to Google
    And the record is created in Airtable

  Scenario: Verification is skipped when no secret is configured
    Given RECAPTCHA_SECRET_KEY is not configured
    When the submission reaches the registration endpoint
    Then no verification request is sent to Google
    And the record is created in Airtable

  Scenario: A production deployment without a secret complains loudly
    Given RECAPTCHA_SECRET_KEY is not configured
    And VERCEL_ENV is "production"
    When a submission reaches the registration endpoint
    Then an error noting submissions are accepted without bot verification is logged
