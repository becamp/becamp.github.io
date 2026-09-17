@sessions-board
Feature: The session board can take over the whole screen
  The board is shown on a large display, so it offers one control that puts it
  into native fullscreen and nothing else.

  Scenario: The control enters fullscreen
    Given the board is shown in a browser window
    When the visitor activates the fullscreen control
    Then the document enters fullscreen
    And the browser's navigation interface is hidden

  Scenario: The keyboard shortcut enters fullscreen
    Given the board is shown in a browser window
    When the visitor presses "f"
    Then the document enters fullscreen

  Scenario Outline: A modified keypress is not the shortcut
    When the visitor presses "<combination>"
    Then fullscreen is not toggled

    Examples:
      | combination |
      | Cmd+f       |
      | Ctrl+f      |
      | Alt+f       |

  Scenario: The control reflects the current state
    Given the board is in fullscreen
    Then the control reads "Exit"
    And its icon shows inward-pointing corners
    And it reports aria-pressed "true"

  Scenario: The control returns to its resting state on exit
    Given the board is in fullscreen
    When the visitor exits fullscreen by any means
    Then the control reads "Fullscreen"
    And its icon shows outward-pointing corners
    And it reports aria-pressed "false"

  @manual
  Scenario: The browser's own exit keeps the control in step
    Given the board is in fullscreen
    When the visitor presses Escape
    Then the document leaves fullscreen
    And the control updates to match

  Scenario: The layout does not change in fullscreen
    When the board enters fullscreen
    Then the same five rows and room columns are shown
    And the grid grows to fill the larger area

  Scenario: A refused request says so rather than failing silently
    Given the embedding context does not permit fullscreen
    When the visitor activates the fullscreen control
    Then the control reads "Blocked here"
    And the board continues to fill its own frame
    And the layout is left unchanged

  Scenario: The control is reachable by keyboard
    When the visitor moves focus to the fullscreen control
    Then a visible focus ring is shown
    And the control is visible even if it had faded out
