Feature: Registration requires a name and an email address
  Name and email are the only two fields the endpoint insists on. Anything
  missing is reported as "missing" rather than as a generic failure, so the
  visitor knows what to correct.

  Scenario Outline: An incomplete submission is turned away
    Given a submission where the name is <name> and the email is <email>
    When the submission reaches the registration endpoint
    Then no record is created in Airtable
    And the visitor is redirected to "/register?status=error&reason=missing"
    And the error banner reads "We need both a name and an email address to register you. Please fill those in and submit again."

    Examples:
      | name        | email               |
      | absent      | "ada@example.com"   |
      | ""          | "ada@example.com"   |
      | "   "       | "ada@example.com"   |
      | "Ada Lovelace" | absent           |
      | "Ada Lovelace" | ""               |
      | absent      | absent              |

  Scenario: Surrounding whitespace is trimmed before the check
    Given a submission with the name "  Ada Lovelace  "
    And the email "  ada@example.com  "
    When the submission reaches the registration endpoint
    Then the submission is accepted
    And the record stores the name "Ada Lovelace"
    And the record stores the email "ada@example.com"
