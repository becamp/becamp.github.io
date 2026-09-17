@sessions-board
Feature: The session board shows only breakout-room sessions
  The board is a wayfinding display. Lunch, lightning talks, the break, the
  retrospective and drinks are deliberately absent so nothing competes with the
  five rows that tell people which room to walk to.

  Scenario: Only the breakout slots are listed
    When the board renders
    Then exactly five session rows are shown
    And they are the slots that run in breakout rooms

  Scenario Outline: Non-breakout items do not appear
    When the board renders
    Then no row is shown for "<item>"

    Examples:
      | item                  |
      | Lunch                 |
      | Lightning Talks       |
      | Break & Sponsor Raffle|
      | Retrospective         |
      | Drinks                |

  Scenario: Each room is a column
    When the board renders
    Then a column is shown for each breakout room
    And each column header names the room
    And each column header carries the room's number in the accent colour

  Scenario: The session rows share the remaining height equally
    When the board renders
    Then the five session rows divide the space below the masthead evenly

  Scenario: An unclaimed slot is shown rather than hidden
    Given one room has no session in a slot
    When the board renders
    Then that cell is shown as an open placeholder
    And it invites someone to claim it at the board

  Scenario: A session card shows what someone needs to choose
    Given a session with a topic, a speaker and a format
    When the board renders
    Then the card shows the topic
    And the card shows the speaker
    And the card shows the format
    And the card does not repeat the room, which the column header already names
