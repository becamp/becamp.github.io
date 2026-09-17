Feature: A build without Airtable credentials degrades to empty content
  Local development should work for anyone who clones the repository, so a
  missing token is a reason to render empty sections rather than to fail.

  Scenario Outline: Each fetch is skipped when credentials are absent
    Given no Airtable token or base ID is configured
    When the "<table>" table is requested
    Then no request is made to Airtable
    And an empty list is returned
    And a warning naming the skipped table is logged

    Examples:
      | table             |
      | Sponsors          |
      | Guests            |
      | Saturday Schedule |

  Scenario: The site still builds with no content
    Given no Airtable credentials are configured
    When the site is built
    Then the build succeeds
    And the sponsors section shows only its invitation tiles
    And the schedule shows its placeholder rows
    And the attendee directory shows its locked notice

  Scenario: An empty registrant count keeps the directory closed
    Given no Airtable credentials are configured
    When the registrant count is requested
    Then the count is zero
    And the attendee directory stays locked
