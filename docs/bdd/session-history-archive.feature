Feature: The session archive is browsable and searchable
  /history lists every session on record. The whole archive ships in the HTML,
  newest year first, so it reads and indexes without JavaScript; the script
  narrows what is on screen rather than fetching anything.

  Note: /history used to redirect to /about, because the old Nuxt site had a
  history page whose story moved there. The archive now occupies that URL, and
  the redirect is gone.

  Scenario: Every session is in the page
    When the history page is rendered
    Then every year on record has a block
    And every session on record has a row

  Scenario: The newest year is the one on screen
    Given the visitor has JavaScript enabled
    When the history page loads
    Then only the newest year's block is shown
    And the summary reads "Showing" that year

  Scenario: The whole archive shows without JavaScript
    Given the visitor has JavaScript disabled
    When the history page loads
    Then every year's block is shown

  Scenario: Picking a year swaps which block is shown
    Given the history page has loaded
    When the visitor picks a year from the rail
    Then only that year's block is shown
    And that year is marked as the current one

  Scenario: Searching crosses every year
    Given the history page has loaded
    When the visitor searches for a word two years both used
    Then both years' blocks are shown
    And each block counts only its matching sessions
    And a year with no match is hidden

  Scenario: Filtering by type keeps sessions carrying that label
    Given the history page has loaded
    When the visitor filters by "Learn"
    Then every shown session carries "Learn" in its type
    And a session typed "Present/Learn" is still shown

  Scenario: A search with no matches says so
    Given the history page has loaded
    When the visitor searches for a word no session uses
    Then no session row is shown
    And the page offers to let them pitch it instead

  Scenario: Picking a year clears an active search
    Given the visitor has searched
    When they pick a year from the rail
    Then the search box is empty
    And the type filter is back to "All"

  Scenario: Gaps in the record are shown, not hidden
    When a year with no room or type on record is shown
    Then its room and type columns read as a dash
