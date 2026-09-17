@sessions-board
Feature: The focused session says whether it is running or still to come
  Focus moves the moment a session ends, which means it often lands on a session
  that has not started. Labelling that "on now" would send people into an empty
  room, so the board distinguishes the two.

  Scenario: A running session is labelled as on now
    Given the time is 11:30am
    And the focused slot runs from 11:10am to 11:55am
    When the board renders
    Then the focused slot is labelled "On now"
    And a pulsing indicator is shown beside the label

  Scenario: A session that has not started is labelled as up next
    Given the time is 10:15am
    And the focused slot runs from 10:20am to 11:05am
    When the board renders
    Then the focused slot is labelled "Up next"
    And no pulsing indicator is shown

  Scenario: The focus treatment is the same either way
    Given a slot is focused
    When the board renders
    Then the slot's time is shown in the accent colour
    And an accent rail marks the row
    And the row's session cards are tinted with the accent

  Scenario: Unfocused slots show their session number
    Given the third slot is focused
    When the board renders
    Then the first slot is labelled "Session 1"
    And the second slot is labelled "Session 2"
    And the fourth slot is labelled "Session 4"
    And the fifth slot is labelled "Session 5"

  Scenario: Exactly one slot carries the focus
    When the board renders at any time during the day
    Then at most one row is focused

  Scenario: The pulsing indicator respects reduced motion
    Given the viewer prefers reduced motion
    When a running session is focused
    Then the indicator is shown without animation
