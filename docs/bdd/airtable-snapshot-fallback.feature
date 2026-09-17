Feature: A failed Airtable fetch republishes the last known-good content
  Every successful fetch writes a snapshot. If Airtable is down or the API quota
  is exhausted, the build republishes stale-but-real content instead of a hollow
  site. With no snapshot to fall back on the build fails loudly instead.

  Scenario: A successful fetch saves a snapshot
    Given Airtable returns records for a table
    When the fetch completes
    Then the records are written to the snapshot directory
    And the snapshot is keyed by both the table and the query

  Scenario: The two Guests queries get separate snapshots
    Given the Guests table is fetched once for the count and once for the directory
    When both fetches complete
    Then each is stored under its own snapshot file

  Scenario: A failed fetch falls back to the snapshot
    Given a snapshot exists for a table
    When the Airtable request fails
    Then the snapshot's records are used
    And a warning naming the table and the record count is logged
    And the warning is raised as an annotation on the workflow run

  Scenario Outline: Any failure mode falls back the same way
    Given a snapshot exists for a table
    When the Airtable request <failure>
    Then the snapshot's records are used

    Examples:
      | failure                          |
      | returns a non-OK status          |
      | fails with a network error       |
      | exhausts the API quota           |

  Scenario: No snapshot means the build fails
    Given no snapshot exists for a table
    And Airtable credentials are configured
    When the Airtable request fails
    Then the error is raised
    And the build fails
    And no hollow site is published

  Scenario: A snapshot that cannot be written does not fail the fetch
    Given the snapshot directory cannot be written to
    When a successful fetch tries to save its snapshot
    Then the fetched records are still returned
    And the build continues

  Scenario: The snapshot survives between workflow runs
    Given the previous build saved a snapshot
    When a new workflow run starts
    Then the newest snapshot is restored from the workflow cache
    And the run saves its own snapshot under a fresh key
