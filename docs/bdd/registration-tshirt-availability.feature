Feature: The T-shirt field disappears when shirts run out
  A single flag in the page source controls whether registrants are asked for a
  size, so the field can be withdrawn once stock is gone without touching the
  endpoint.

  Scenario: Sizes are offered while shirts are available
    Given shirts are marked as available
    When the registration page is rendered
    Then a "T-shirt Size" field is shown
    And it is labelled as free while supplies last
    And the options are "no thanks", "small", "medium", "large" and "x-large"

  @manual
  Scenario: The field is withdrawn when shirts are gone
    Given shirts are marked as unavailable
    When the registration page is rendered
    Then no T-shirt Size field is present
    And a submission carries no T-shirt size

  Scenario: Option values match the Airtable single-select exactly
    Given the T-shirt field is shown
    When a size is submitted
    Then the value sent matches an option name in the Airtable "T-shirt Size" field
