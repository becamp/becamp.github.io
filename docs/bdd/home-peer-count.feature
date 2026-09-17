Feature: The home page names how many peers are already coming
  Once registrations pass twenty, the hero says how many people have signed up.
  Below that it says nothing rather than advertising a small number.

  Scenario: The peer count is withheld below the threshold
    Given 19 people have registered
    When the home page is rendered
    Then no peer count line is shown

  Scenario: The peer count appears at the threshold
    Given 20 people have registered
    When the home page is rendered
    Then the hero reads "Join your 20 peers at beCamp!"

  Scenario: The peer count reflects the current total
    Given 78 people have registered
    When the home page is rendered
    Then the hero reads "Join your 78 peers at beCamp!"

  Scenario: The count matches the directory gate
    Given the peer count line is shown
    Then the attendee directory is also unlocked
    And both read the same memoized registrant count
