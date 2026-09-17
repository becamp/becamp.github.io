Feature: The countdown bar appears instantly for returning visitors
  Once the reveal has played, or when the visitor prefers reduced motion, the
  bar is present and correct on arrival with no delay and no animation.

  Scenario: A returning visitor sees the bar immediately
    Given "countdown-bar-seen" is present in localStorage
    When the visitor opens a page that shows the bar
    Then the bar is at full height on arrival
    And its transition is disabled for that first paint
    And the text is set in one go rather than letter by letter

  Scenario: Reduced motion skips the animation
    Given the visitor prefers reduced motion
    When they open a page that shows the bar
    Then the bar appears instantly
    And no letter animation plays

  Scenario: Unavailable storage treats every page as a first visit
    Given localStorage cannot be read or written
    When the visitor opens a page that shows the bar
    Then the reveal animation plays
    And no error is surfaced to the visitor

  Scenario: The bar is rebuilt on each client-side navigation
    Given the visitor navigates between pages without a full reload
    When the new page's bar is swapped in
    Then any previous interval and reveal timer are cleared
    And the new bar's elements are wired up
