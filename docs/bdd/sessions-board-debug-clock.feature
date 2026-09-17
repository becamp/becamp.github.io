@sessions-board @mockup @manual
Feature: The session board's clock can be simulated for testing
  Focus handover only happens at five moments in the day, which makes it
  untestable in real time. A debug panel overrides the clock so the behaviour
  can be driven to any minute and watched.

  This panel is mockup scaffolding. It is not intended to reach the display.

  Scenario: The board follows the real clock by default
    Given no simulated time has been set
    When the board renders
    Then the masthead clock shows the real current time
    And the masthead label reads "Now"

  Scenario: Setting a simulated time overrides the clock
    Given the debug panel is shown
    When the visitor scrubs to 10:15am
    Then the masthead clock shows "10:15am"
    And the masthead label reads "Simulated"
    And the label is shown in the accent colour
    And a screenshot cannot be mistaken for the real time

  Scenario: The scrubber covers the whole event day
    When the debug panel is shown
    Then the scrubber spans 8:00am to 5:00pm
    And it moves in one-minute steps

  Scenario Outline: The nudge buttons step the clock
    Given the simulated time is 10:14am
    When the visitor activates "<button>"
    Then the simulated time becomes <result>

    Examples:
      | button | result  |
      | +1m    | 10:15am |
      | +5m    | 10:19am |
      | −1m    | 10:13am |
      | −5m    | 10:09am |

  Scenario Outline: Arrow keys step the clock
    Given the simulated time is 10:14am
    When the visitor presses "<key>"
    Then the simulated time becomes <result>

    Examples:
      | key        | result  |
      | ArrowRight | 10:15am |
      | ArrowLeft  | 10:13am |

  Scenario: The scrubber's own arrow handling is not doubled
    Given focus is on the scrubber
    When the visitor presses ArrowRight
    Then the simulated time advances by exactly one minute

  Scenario: Boundary shortcuts jump to each handover moment
    When the debug panel is shown
    Then a jump control is offered for every session's start and end time
    And each control names which edge it is

  Scenario: The panel reports the resulting decision, not just the grid
    Given the simulated time is 10:15am
    Then the panel reports the focused slot as "Session 2"
    And the panel reports its state as "up next"

  Scenario: The simulated time is clamped to the scrubber's range
    Given the simulated time is 8:00am
    When the visitor steps backwards
    Then the simulated time stays at 8:00am

  Scenario: Returning to the real clock
    Given a simulated time has been set
    When the visitor activates "Use real clock"
    Then the board follows the real clock again
    And the masthead label reads "Now"

  Scenario: The panel can be dismissed
    Given the debug panel is shown
    When the visitor presses "d"
    Then the panel is hidden
    And the board underneath is unobstructed

  Scenario: Only the real clock is polled
    Given a simulated time has been set
    When the periodic tick fires
    Then the simulated time is left alone
