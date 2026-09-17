Feature: The mobile menu opens over the page
  Below the large breakpoint the navigation collapses behind a toggle. The open
  menu covers the viewport and locks the page behind it.

  Scenario: The menu opens
    Given the viewport is narrow enough for the mobile menu
    When the visitor activates the menu toggle
    Then the menu is shown over the full viewport
    And the toggle reports aria-expanded "true"
    And scrolling of the page behind the menu is locked

  Scenario: The menu closes from its own close button
    Given the mobile menu is open
    When the visitor activates the close button
    Then the menu is hidden
    And the toggle reports aria-expanded "false"
    And page scrolling is restored

  Scenario: The toggle closes an open menu
    Given the mobile menu is open
    When the visitor activates the menu toggle again
    Then the menu is hidden

  Scenario: The open menu keeps the logo in place
    Given the mobile menu is open
    Then the logo sits where the header's logo sat before the menu opened

  Scenario: The menu offers the same destinations plus registration
    Given the mobile menu is open
    Then it lists every navigation link
    And it ends with a full-width "Register" button

  Scenario: The toggle is announced to assistive technology
    When the header is rendered
    Then the toggle has an accessible label
    And the toggle points at the menu it controls via aria-controls

  Scenario: Handlers are rebound after client-side navigation
    Given the visitor navigates to another page without a full reload
    When the page load event fires
    Then the toggle and close button are wired to the newly swapped-in header

  Scenario: The wide viewport uses the inline navigation instead
    Given the viewport is at or above the large breakpoint
    When any page is rendered
    Then the inline navigation is shown
    And the menu toggle is hidden
