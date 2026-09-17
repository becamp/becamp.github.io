Feature: The registrant count is fetched once per build
  The header and the footer both ask for the count, and both appear on every
  page. Without memoization a build would re-count the table once per page.

  Scenario: Repeated callers share one fetch
    Given a build renders eight pages
    When the header and footer on each page request the registrant count
    Then exactly one request is made to Airtable
    And every caller receives the same count

  Scenario: Concurrent callers share the same in-flight request
    Given two callers request the count before the first has resolved
    When both awaits settle
    Then only one request was made
    And both receive the same count

  Scenario: The memoized value is used by every gate
    Given the count has been fetched
    When the navigation gate and the directory gate are evaluated
    Then both read the same memoized count
    And they cannot disagree about whether the directory is unlocked
