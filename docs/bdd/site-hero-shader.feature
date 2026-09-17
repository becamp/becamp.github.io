Feature: The animated backdrop runs once and keeps running
  A WebGPU shader draws the flame and its glow behind the page content. It is
  rendered once by the layout with identical geometry on every page and carried
  across navigations, so the animation never restarts or blinks.

  Scenario: The backdrop persists across navigation
    Given the backdrop is running
    When the visitor navigates to another page
    Then the same canvas element is carried across
    And the animation continues rather than restarting
    And nothing blinks or shifts during the swap

  Scenario: The backdrop sits behind the page content
    When any page is rendered
    Then the backdrop does not receive pointer events
    And page content is drawn above it
    And the glow shows only through transparent backgrounds

  Scenario: The composition follows the viewport width
    Given the viewport narrows from 1440 to 1024 pixels
    When the backdrop is laid out
    Then the composition slides left as the viewport narrows
    And the flame shrinks to fit narrow screens

  Scenario: No shader is created on phones
    Given the viewport is below the small breakpoint
    When the page is rendered
    Then the backdrop is not displayed
    And no GPU context is created

  Scenario: Crossing the breakpoint initialises the shader
    Given the viewport was below the small breakpoint
    When it is widened past the breakpoint
    Then the shader is initialised

  Scenario: Reduced motion shows the static impression instead
    Given the visitor prefers reduced motion
    When the page is rendered
    Then no shader is created
    And a static flame under a soft glow is shown

  Scenario Outline: A terminal GPU failure falls back to the static image
    Given the shader reports "<reason>"
    When the failure is handled
    Then the static fallback is revealed

    Examples:
      | reason         |
      | unsupported    |
      | no-adapter     |
      | no-device      |
      | init-failed    |
      | device-lost    |
      | out-of-memory  |
      | gpu-error      |
      | render-failed  |
      | unrecoverable  |

  Scenario: A shader that finishes loading after the visitor has moved on is discarded
    Given the visitor navigates away while the shader is still being created
    When the creation resolves
    Then the orphaned instance is destroyed

  Scenario: The canvas is resized to its real layout box
    Given the canvas has been laid out
    When the geometry is applied
    Then any stale inline dimensions are cleared first
    And the shader is resized to the measured box

  Scenario: Resizes the observer misses are still caught
    Given the shader is running
    When the window width changes without a resize event
    Then a periodic check notices and reapplies the layout
