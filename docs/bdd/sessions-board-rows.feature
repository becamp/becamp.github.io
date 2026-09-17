@sessions-board
Feature: The session board shows the five breakout rows and its full-width bands
  The board is a wayfinding display, and five rows tell people which room to
  walk to. The bands are the exception: doors and breakfast, lunch, the
  lightning talks, the break and the closing retrospective run across every room
  at once, or in no room at all, so the board shows each as a single full-width
  row rather than cards that would each name a room they do not use. Doors and
  breakfast are fixed, so that band needs no schedule record; every other band
  waits for the records it absorbs. A band is shown and never focused:
  through the midday block nobody needs a room, and once the last session has
  ended there is no next room to point at.

  Background:
    Given the Saturday schedule holds the banded blocks
      | topic                               | time              | location   |
      | Lunch                               | 12:05pm - 12:35pm | Atrium     |
      | Lightning Talks — five minutes each | 12:35pm - 1:25pm  | Auditorium |
      | Break & Sponsor Raffle              | 1:25pm - 1:55pm   | Atrium     |
      | Retrospective                       | 3:40pm - 4:05pm   | Auditorium |

  Scenario Outline: Each banded block is shown as one row
    When the board renders
    Then exactly one "<band>" row is shown

    Examples:
      | band   |
      | doors  |
      | midday |
      | retro  |

  Scenario: Doors and breakfast open the board
    When the board renders
    Then the "doors" row opens the board

  Scenario: The doors band needs no schedule record
    Given the schedule holds no record for the doors band
    When the board renders
    Then exactly one "doors" row is shown

  Scenario: The midday block's three records become one row
    Given the midday block holds three records
    When the board renders
    Then the midday block occupies exactly one row

  Scenario Outline: A band covers its whole block
    When the board renders
    Then the "<band>" row runs from <start> to <end>

    Examples:
      | band   | start   | end    |
      | doors  | 9:00am  | 9:30am |
      | midday | 12:05pm | 1:55pm |
      | retro  | 3:40pm  | 4:30pm |

  Scenario Outline: A band names its block
    When the board renders
    Then the "<band>" row is labelled "<label>"

    Examples:
      | band   | label                               |
      | doors  | Doors open & Breakfast              |
      | midday | Lunch & Lightning Talks             |
      | retro  | Conference Retrospective & clean up  |

  Scenario Outline: A band spans every room column
    When the board renders
    Then the "<band>" row spans every room column

    Examples:
      | band   |
      | doors  |
      | midday |
      | retro  |

  Scenario Outline: A band sits where the clock reaches it
    When the board renders
    Then the "<band>" row follows the "<slot>" row

    Examples:
      | band   | slot              |
      | midday | 11:10am - 11:55am |
      | retro  | 2:50pm - 3:35pm   |

  Scenario: The retrospective band closes the board
    When the board renders
    Then the "retro" row is the last row on the board

  Scenario: The five breakout rows are unchanged
    When the board renders
    Then exactly five session rows are shown
    And they are the slots that run in breakout rooms

  Scenario: Drinks are off-site and stay off the board
    When the board renders
    Then no row is shown for "Drinks"

  Scenario Outline: A band never carries focus
    Given the time is <time>
    When the board renders
    Then no band carries focus

    Examples:
      | time    |
      | 9:10am  |
      | 12:30pm |
      | 3:50pm  |

  Scenario: Focus crosses the midday block to the afternoon
    Given the time is 12:30pm
    When the board renders
    Then the focused slot is "2:00pm - 2:45pm"

  Scenario: Each room is a column
    When the board renders
    Then a column is shown for each breakout room
    And each column header names the room
    And each column header carries the room's number in the accent colour

  Scenario: The breakout rows share the remaining height equally
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
