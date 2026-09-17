@sessions-board
Feature: The session board fits whatever screen it is plugged into
  Every size on the board derives from one unit that tracks whichever viewport
  dimension is binding, so the layout fits without a media query and without
  anyone measuring the display first.

  Scenario: Nothing scrolls
    When the board is rendered at any viewport size
    Then the page height equals the viewport height
    And neither axis scrolls

  Scenario Outline: The whole day fits on one screen
    Given a display of <width> by <height> pixels
    When the board is rendered
    Then all five session rows are visible
    And the masthead is visible
    And no content is clipped

    Examples:
      | width | height | shape           |
      | 1920  | 1080   | 1080p           |
      | 3840  | 2160   | 4K              |
      | 2560  | 1080   | ultrawide       |
      | 1024  | 768    | 4:3 projector   |
      | 1440  | 900    | laptop          |

  Scenario: A wider-than-16:9 display scales to its height
    Given a display wider than 16:9
    When the board is rendered
    Then sizes are driven by the viewport height
    And the grid does not overflow horizontally

  Scenario: A narrower-than-16:9 display scales to its width
    Given a display narrower than 16:9
    When the board is rendered
    Then sizes are driven by the viewport width
    And the grid does not overflow vertically

  Scenario: Long session titles wrap rather than clip
    Given a session title long enough to need three lines
    When the board is rendered
    Then the title wraps within its card
    And no text is cut off

  Scenario: A long speaker name is truncated rather than breaking the row
    Given a speaker name wider than its card
    When the board is rendered
    Then the name is truncated with an ellipsis
    And the card's height is unchanged
