Feature: Pages swap in place without a flash
  Navigation is handled client-side so moving between pages does not repaint the
  whole document. The swap is instant rather than crossfaded.

  Scenario: Internal navigation does not reload the document
    Given the visitor is on the home page
    When they follow a link to "/schedule"
    Then the schedule page is shown
    And the document is not fully reloaded

  Scenario: The swap is not animated
    When a page is swapped in
    Then no crossfade is played
    And the new page appears immediately

  Scenario: Component behaviour is re-initialised on each swap
    Given the visitor navigates between pages
    When the page load event fires
    Then the countdown bar, header menu and footer parallax are wired to the new elements
    And previously registered timers are cleared

  Scenario: Handlers are not bound twice
    Given a page load event fires twice for the same form
    When the registration form's handlers are bound
    Then each handler is attached exactly once

  Scenario: The registration form opts out of the swap
    When the visitor submits the registration form
    Then the submission is a full page navigation rather than a client-side swap
