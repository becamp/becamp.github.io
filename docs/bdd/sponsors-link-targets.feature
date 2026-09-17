Feature: Sponsor tiles link somewhere useful
  A sponsor with a website links out to it; one without links to their write-up
  on the sponsors page.

  Scenario: A regular sponsor with a website links out
    Given a regular sponsor with a recorded URL
    When their tile is rendered
    Then the tile links to that URL
    And the link opens in a new tab
    And the link carries rel "noopener"

  Scenario: A regular sponsor without a website links to their write-up
    Given a regular sponsor with no recorded URL
    When their tile is rendered
    Then the tile links to "/sponsors#" followed by their slug
    And the link opens in the same tab

  Scenario: A premier sponsor always links to their write-up
    Given a premier sponsor
    When their tile is rendered on the home page
    Then the tile links to "/sponsors#" followed by their slug

  Scenario Outline: The slug is derived from the sponsor's name
    Given a sponsor named "<name>"
    Then their slug is "<slug>"

    Examples:
      | name              | slug             |
      | Acme Corp         | acme-corp        |
      | SpiffWorks        | spiffworks       |
      | Hooli & Co.       | hooli-co         |
      | 3M                | 3m               |

  Scenario: The write-up anchor is reachable from the tile
    Given a sponsor with a write-up on the sponsors page
    When the visitor follows the tile link
    Then the sponsor's section is scrolled into view clear of the header
