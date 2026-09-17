Feature: Sponsors are ordered by contribution
  Sponsors appear biggest contribution first, with ties broken alphabetically so
  the order is stable between builds rather than following Airtable's row order.

  Scenario: Larger contributions come first
    Given sponsors with cash contributions of 500, 2500 and 1000
    When the sponsor list is built
    Then they are ordered 2500, 1000, 500

  Scenario: Equal contributions are ordered alphabetically
    Given three sponsors contributing the same amount, named "Zebra Co", "Acme" and "Mango"
    When the sponsor list is built
    Then they are ordered "Acme", "Mango", "Zebra Co"

  Scenario: Alphabetical ordering ignores case
    Given two sponsors contributing the same amount, named "acme" and "Ableton"
    When the sponsor list is built
    Then "Ableton" is ordered before "acme"

  Scenario: A sponsor with no recorded contribution sorts last
    Given a sponsor with no cash budget recorded
    And a sponsor contributing 100
    When the sponsor list is built
    Then the contributing sponsor is ordered first

  Scenario: A non-numeric contribution is treated as zero
    Given a sponsor whose cash budget cannot be read as a number
    When the sponsor list is built
    Then that sponsor is treated as contributing nothing

  Scenario: Stray whitespace does not break the ordering
    Given a sponsor whose name is stored as " SpiffWorks"
    When the sponsor list is built
    Then the name is trimmed to "SpiffWorks"
    And it sorts under "S"
