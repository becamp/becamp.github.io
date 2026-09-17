Feature: The footer's mountains shift as you approach them
  The footer is a layered mountain illustration. As it scrolls into view the
  near ridges rise while the sun and far ridges sink slightly behind them, like
  descending from the sky, and the layers drift with the pointer.

  Scenario: The layers settle as the footer comes into view
    Given the footer is below the viewport
    When the visitor scrolls it into view
    Then each layer is offset in proportion to how far into view the footer is
    And the near ridges move in the opposite direction to the sun and far ridges
    And the layers reach their resting position when the footer is fully in view

  Scenario: The layers drift with the pointer
    Given the footer is in view
    When the visitor moves the pointer horizontally across the window
    Then each layer shifts horizontally by an amount set by its depth
    And nearer layers shift further than distant ones
    And the motion eases towards the pointer rather than tracking it exactly

  Scenario: The animation stops once it has settled
    Given the pointer has stopped moving
    When the layers have reached their target
    Then no further animation frames are requested

  Scenario: Reduced motion disables the effect entirely
    Given the visitor prefers reduced motion
    When the footer is scrolled into view
    Then no parallax listeners are attached
    And the illustration is shown in its resting position

  Scenario: The illustration is decorative
    When the footer is rendered
    Then the illustration is marked aria-hidden
    And it does not receive pointer events

  Scenario: Layer references refresh after client-side navigation
    Given the visitor navigates to another page without a full reload
    When the page load event fires
    Then the effect targets the newly swapped-in footer's layers

  Scenario: Resizing the window recalculates the offsets
    Given the footer is in view
    When the window is resized
    Then the layer offsets are recalculated for the new geometry
