Feature: The published site is rebuilt to pick up content changes
  The site is static, so content edited in Airtable only appears after a build.
  Three triggers cover the ways content changes in practice.

  Scenario: Pushing to the main branch publishes
    Given a commit is pushed to the main branch
    When the workflow runs
    Then the site is built and deployed

  Scenario: A daily rebuild keeps content fresh
    Given no one has pushed for a day
    When the scheduled build runs at 6:00am Eastern
    Then fresh sponsors and schedule data are fetched from Airtable
    And the site is redeployed

  Scenario: A manual run publishes the Friday night schedule
    Given the Saturday schedule has been arranged in Airtable on Pitch Night
    When the workflow is dispatched manually
    Then the schedule is fetched and published
    And the schedule page renders the full grid rather than the teaser

  Scenario: A manual run can build from the last snapshot
    Given the workflow is dispatched manually with the snapshot input checked
    When the workflow runs
    Then no request is made to the Airtable API

  Scenario: The build reads Airtable with the narrowest available credential
    When the workflow runs
    Then a read-only token is preferred
    And the write-scoped token is used only if no read-only token is provisioned

  Scenario: Third-party actions are pinned to immutable commits
    When the workflow definition is read
    Then every third-party action is pinned to a commit SHA
    And no mutable tag is used for a job that holds the Airtable token

  Scenario: Content is at most a day stale
    Given content is edited in Airtable
    When no manual build is triggered
    Then the change appears on the site after the next daily rebuild
