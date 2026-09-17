Feature: Premier sponsors are presented separately
  The site shows two tiers. Premier sponsors get square tiles under their own
  heading; everyone else gets a shorter tile below.

  Scenario: The tiers are split by level
    Given one sponsor at level "Premier Sponsor"
    And two sponsors at other levels
    When the sponsors are grouped
    Then the premier group holds the first sponsor
    And the regular group holds the other two

  Scenario: A sponsor with no level recorded is a regular sponsor
    Given a sponsor with no level recorded
    When the sponsors are grouped
    Then they are placed in the regular group

  Scenario: Both tiers are shown on the home page
    When the home page is rendered
    Then a "Premier Sponsors" heading is shown
    And a "Sponsors" heading is shown
    And a link to "/sponsors" invites the visitor to meet them all

  Scenario: Each tier ends with an invitation to join it
    When the sponsors section is rendered
    Then the premier tier ends with a tile reading "Click to become a Premier Sponsor"
    And the regular tier ends with a tile reading "Click to become a sponsor"
    And each tile opens a pre-addressed email to the organizers

  Scenario: An empty premier tier still shows the invitation
    Given no premier sponsors have been confirmed
    When the sponsors page is rendered
    Then the premier invitation tile is still shown
