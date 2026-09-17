Feature: The attendee directory unlocks at twenty registrants
  A directory of three people is worse than no directory, so the grid and the
  peer count stay closed until twenty people have registered. The threshold is
  carried over from the previous be.camp site.

  Scenario: Below the threshold the page explains itself
    Given 19 people have registered
    When the attendees page is rendered
    Then no attendee grid is shown
    And a notice reads "The attendee directory unlocks once 20 people have registered. Check back soon — or better, be one of them."
    And no registrant count is stated

  Scenario: At the threshold the directory opens
    Given 20 people have registered
    When the attendees page is rendered
    Then the attendee grid is shown
    And the page states that 20 people have registered

  Scenario: Above the threshold the directory stays open
    Given 78 people have registered
    When the attendees page is rendered
    Then the attendee grid is shown
    And the page states that 78 people have registered

  Scenario: The locked page still invites registration
    Given the directory is locked
    When the attendees page is rendered
    Then a "Register now" call to action is shown

  Scenario: The gate matches the navigation gate
    Given the directory is locked
    Then no navigation link points at the attendees page
