@sessions-board
Feature: The session board clears its own controls when left alone
  A display nobody is touching should show schedule and nothing else — no stray
  cursor parked in the middle of the screen, no button.

  Scenario: The cursor and control retreat after four idle seconds
    Given the board is shown and has just been touched
    When four seconds pass with no input
    Then the cursor is hidden
    And the fullscreen control fades out
    And the control stops accepting pointer events

  Scenario Outline: Any input brings them straight back
    Given the board has gone idle
    When the visitor generates a "<event>"
    Then the cursor is shown again
    And the fullscreen control fades back in

    Examples:
      | event      |
      | mousemove  |
      | mousedown  |
      | keydown    |
      | touchstart |
      | wheel      |

  Scenario: The idle countdown restarts on every interaction
    Given the board has been touched
    When the visitor moves the pointer again after three seconds
    Then the board does not go idle until four further seconds pass

  Scenario: Keyboard focus overrides the fade
    Given the board has gone idle
    When the visitor tabs to the fullscreen control
    Then the control is fully visible

  Scenario: The schedule itself never fades
    Given the board has gone idle
    Then every session card remains fully legible
    And the masthead remains fully legible
