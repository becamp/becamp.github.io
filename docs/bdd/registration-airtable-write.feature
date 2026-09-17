Feature: Registrations are written to Airtable by immutable field ID
  The record is keyed by Airtable field ID rather than field name. Airtable
  accepts either, but names are what a human edits, and these columns are worded
  as full sentences with dates in them. Under name keys, tidying the wording in
  the base silently 422s every registration — one unrecognised name rejects the
  whole record, with no deploy and nothing in the repo to explain it.

  Scenario: The record maps form fields to field IDs
    Given a complete registration submission
    When the record is written to Airtable
    Then the name is written to field "fldojBhhSjxaBuZfR"
    And the email is written to field "fldJL5gVTtMNkCo9J"
    And the reception choice is written to field "fldeajWts1m6Ye5XJ"
    And the Pitch Night choice is written to field "fldUkjgZIRmtDKb44"
    And the Saturday choice is written to field "fldddGhk851IyFeSd"
    And the directory permission is written to field "fldDwMDhMx5U0IYzq"
    And the Friday volunteering choice is written to field "fld1s3EixWDgnVVmU"
    And the Saturday volunteering choice is written to field "fldDEEDbEBhOZlxfq"

  Scenario: The base can be reworded without breaking registration
    Given a column in the Guests table is renamed
    When a registration is submitted
    Then the record is still written successfully

  Scenario: Checkbox fields become booleans
    Given a submission where "attend-saturday" is "on"
    And "volunteer-friday" is absent
    When the record is written to Airtable
    Then the Saturday attendance field is true
    And the Friday volunteering field is false

  Scenario: A chosen T-shirt size is included
    Given a submission with a T-shirt size of "large"
    When the record is written to Airtable
    Then field "fldiR5qR1YsLJjOU3" is set to "large"

  Scenario: An absent T-shirt size is omitted entirely
    Given a submission with no T-shirt size
    When the record is written to Airtable
    Then no T-shirt size field is sent

  Scenario: A rejected write is reported as an Airtable failure
    Given Airtable responds with a non-OK status
    When the submission is processed
    Then the status and response body are logged
    And the visitor is redirected with the reason "airtable"

  Scenario Outline: Missing Airtable configuration fails before the request
    Given the environment variable <variable> is not set
    When a submission reaches the registration endpoint
    Then no request is made to Airtable
    And an error noting the missing configuration is logged
    And the visitor is redirected with the reason "config"

    Examples:
      | variable          |
      | AIRTABLE_TOKEN    |
      | AIRTABLE_BASE_ID  |
      | AIRTABLE_TABLE    |

  Scenario: An unexpected failure still returns the visitor to the form
    Given processing the submission throws an unexpected error
    When the endpoint handles it
    Then the error is logged
    And the visitor is redirected with the reason "server"
    And they never see a bare function error page
