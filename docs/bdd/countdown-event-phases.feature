Feature: The countdown bar reflects where the event is in time
  The bar re-reads the wall clock every tick rather than decrementing a stored
  delta, which previously drifted with timer jitter and tab throttling.

  Reception starts Friday 2 October 2026 at 4:30pm ET; sessions end Saturday
  3 October at 4:00pm ET.

  Scenario: Before the event it counts down and points at registration
    Given the current time is before the event start
    When the bar renders
    Then the text reads "beCamp starts in <d>d <hh>h <mm>m <ss>s — Register now →"
    And the hours, minutes and seconds are zero-padded to two digits
    And the bar links to "/register"

  Scenario: The countdown updates every second
    Given the bar is showing a countdown
    When one second passes
    Then the remaining time is recalculated from the current wall clock
    And the displayed value decreases by one second

  Scenario: The countdown does not drift while a tab is backgrounded
    Given the bar has been left in a background tab for an hour
    When the tab is brought to the front
    Then the displayed remaining time matches the wall clock
    And no accumulated drift is shown

  Scenario: During the event it announces itself and points at the schedule
    Given the current time is at or after the event start
    And the current time is before the event end
    When the bar renders
    Then the text reads "beCamp is happening now →"
    And the bar links to "/schedule"

  Scenario: After the event the bar removes itself
    Given the current time is at or after the event end
    When the bar renders
    Then the bar is removed from the page
    And its ticking interval is cleared

  Scenario: The event ending mid-visit removes the bar
    Given the bar is showing "beCamp is happening now →"
    When the clock passes the event end during the visit
    Then the next tick removes the bar
