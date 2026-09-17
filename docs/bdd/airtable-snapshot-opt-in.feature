Feature: Content-independent deploys can skip Airtable entirely
  A copy tweak or a styling change does not need fresh content, so a build can
  be told to read the last snapshot and leave the API alone.

  Scenario: A commit message opts out of the API
    Given a push to the main branch
    And the commit message contains "[skip airtable]"
    When the site is built
    Then no request is made to the Airtable API
    And the content comes from the last snapshot
    And a line noting the snapshot and its record count is logged

  Scenario: A manual run can opt out by checkbox
    Given the workflow is dispatched manually
    And the snapshot input is checked
    When the site is built
    Then no request is made to the Airtable API

  Scenario: A push without the marker fetches normally
    Given a push to the main branch
    And the commit message does not contain "[skip airtable]"
    When the site is built
    Then content is fetched from the Airtable API

  Scenario: The daily rebuild never skips
    Given the scheduled daily build runs
    When the site is built
    Then content is fetched from the Airtable API
    And published content is never more than a day old

  Scenario: Opting out with no snapshot falls through to a live fetch
    Given the snapshot opt-out is requested
    And no snapshot exists for a table
    When that table is requested
    Then a warning noting the missing snapshot is logged
    And the records are fetched live
