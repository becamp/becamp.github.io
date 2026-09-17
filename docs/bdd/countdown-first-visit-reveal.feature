Feature: The countdown bar introduces itself on a first visit
  On the first page view of a visitor's first-ever session the bar stays
  collapsed briefly, slides open, and locks its text in letter by letter.
  Afterwards it simply appears, so the flourish is a greeting rather than a tax
  on every navigation.

  Scenario: The bar animates open on a first-ever visit
    Given a visitor has never seen the countdown bar
    When they open any page that shows it
    Then the bar starts at zero height
    And it stays collapsed for two seconds
    And it then expands to the height of its content
    And the text locks in one letter at a time

  Scenario: Letters enter from alternating directions
    When the countdown text animates in
    Then even-indexed letters enter from above
    And odd-indexed letters enter from below
    And each letter starts 28 milliseconds after the one before it

  Scenario: The bar stops managing its own height once open
    Given the bar has finished expanding
    When the animation completes
    Then its height is set to auto
    And the bar re-flows when the text wraps or the viewport is resized

  Scenario: The reveal is recorded so it plays only once
    Given a visitor has never seen the countdown bar
    When the bar reveals itself
    Then "countdown-bar-seen" is stored in localStorage
    And the flourish does not play again until site data is cleared

  Scenario: Ticks are suppressed while the letters are still animating
    Given the letter animation is in progress
    When a one-second tick fires
    Then the text is not rewritten mid-animation
    And normal ticking resumes once the animation finishes
