@sessions-board
Feature: The session board's focus advances the moment a session ends
  The board exists to answer "which room am I walking to". Focus lands on the
  first session that has not ended yet, so the instant a session's end time
  passes, attention moves to the next one and never rests on something finished.

  Background:
    Given the board shows the five breakout-room slots
      | slot              | start   | end     |
      | 9:30am - 10:15am  | 9:30am  | 10:15am |
      | 10:20am - 11:05am | 10:20am | 11:05am |
      | 11:10am - 11:55am | 11:10am | 11:55am |
      | 2:00pm - 2:45pm   | 2:00pm  | 2:45pm  |
      | 2:50pm - 3:35pm   | 2:50pm  | 3:35pm  |

  Scenario Outline: Focus is the first session that has not ended
    Given the time is <time>
    When the board renders
    Then the focused slot is <focus>

    Examples: Before the day begins
      | time   | focus            |
      | 9:00am | 9:30am - 10:15am |

    Examples: While a session is running
      | time    | focus             |
      | 9:30am  | 9:30am - 10:15am  |
      | 10:00am | 9:30am - 10:15am  |
      | 10:14am | 9:30am - 10:15am  |

    Examples: At the instant a session ends
      | time    | focus             |
      | 10:15am | 10:20am - 11:05am |
      | 11:05am | 11:10am - 11:55am |
      | 11:55am | 2:00pm - 2:45pm   |
      | 2:45pm  | 2:50pm - 3:35pm   |

    Examples: In the gap between sessions
      | time    | focus             |
      | 10:17am | 10:20am - 11:05am |
      | 1:00pm  | 2:00pm - 2:45pm   |
      | 1:59pm  | 2:00pm - 2:45pm   |

  Scenario: Focus never rests on a finished session
    Given the time is any moment during the day
    When the board renders
    Then the focused slot's end time is later than the current time

  Scenario: The long midday gap points at the afternoon
    Given the time is 12:30pm, during lunch
    When the board renders
    Then the focused slot is "2:00pm - 2:45pm"
    And the board is not left without a focus

  Scenario: After the last session the board shows no focus
    Given the time is 3:35pm
    When the board renders
    Then no slot is focused
    And the board reports the day as over

  Scenario: Focus is re-evaluated as the day advances
    Given the board has been left running
    When the clock crosses a session's end time
    Then focus moves to the next slot without anyone touching the display
