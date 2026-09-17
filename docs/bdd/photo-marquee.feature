Feature: The photo strip scrolls continuously
  Photographs from previous years scroll past in a loop, alternating landscape
  and portrait so the cadence stays regular across the seam.

  Scenario: The strip scrolls without stopping
    When the home page is rendered
    Then the photo strip scrolls horizontally
    And the sequence is duplicated so the loop has no visible seam

  Scenario: The cadence survives the loop point
    When the photo strip is rendered
    Then landscape and portrait images strictly alternate
    And the number of photographs is even

  Scenario: Hovering pauses the strip
    Given the photo strip is scrolling
    When the visitor hovers over it
    Then the scrolling pauses
    And it resumes when the pointer leaves

  Scenario: Reduced motion stops the scrolling
    Given the visitor prefers reduced motion
    When the home page is rendered
    Then the strip does not animate
    And the photographs are still shown

  Scenario: The strip fades out at both edges
    When the photo strip is rendered
    Then it fades to transparent at its left and right edges

  Scenario: The strip does not cause a page-wide horizontal scroll
    Given a system with classic scrollbars
    When the home page is rendered
    Then the strip is full-bleed
    And the page does not scroll horizontally

  Scenario: Every photograph is described
    When the photo strip is rendered
    Then each image carries alternative text describing the scene
