Feature: The Saturday schedule is teased until it is real
  Topics are pitched and voted on the evening of Friday 2 October. Until then
  the Saturday grid renders as a magazine-style teaser: blurred, clipped after
  the first rows, faded out, and captioned with when it will be filled in.

  Any build after Pitch Night wraps renders the grid untouched, so the Friday
  night publish reveals it without a code change.

  Scenario: Before Pitch Night the grid is teased
    Given the current time is before 8:30pm ET on 2 October 2026
    When the schedule page is rendered
    Then the Saturday grid is blurred
    And it is clipped to a fixed height
    And it fades out towards the cut-off
    And it cannot be selected or interacted with

  Scenario: The teased grid is hidden from assistive technology
    Given the Saturday grid is teased
    Then the grid is marked aria-hidden
    And the caption naming the reveal is not

  Scenario: The caption names when the schedule arrives
    Given the Saturday grid is teased
    Then a caption reads "Schedule to be determined Friday night, October 2nd"

  Scenario: The fade completes before the cut-off
    Given the Saturday grid is teased
    Then the fade is applied to the clipping window rather than the grid
    And no hard edge appears at the bottom of the grid

  Scenario: After Pitch Night the grid is shown plainly
    Given the current time is at or after 8:30pm ET on 2 October 2026
    When the schedule page is rendered
    Then the Saturday grid is not blurred
    And the grid is not clipped
    And no reveal caption is shown

  Scenario: A preview build lifts the teaser
    Given USE_FAKE_DATA is "true"
    When the schedule page is rendered
    Then the Saturday grid is not blurred
    And the sample sessions behind it are legible

  Scenario: The page explains that empty slots are intended
    When the schedule page is rendered
    Then it states that topics get filled in by whoever shows up the night before
    And it says empty slots are the point, not a bug
    And it links to "/faqs#how-are-topics-decided"
