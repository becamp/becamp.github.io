Feature: The countdown bar can be withheld and degrades without scripting
  The bar's only call to action is registration, so it is noise once the visitor
  has arrived on the registration page. It also has a static fallback for
  visitors without JavaScript.

  Scenario: The registration page opts out of the bar
    When the registration page is rendered
    Then no countdown bar is present

  Scenario Outline: Every other page shows the bar
    When the "<page>" page is rendered
    Then the countdown bar is present

    Examples:
      | page      |
      | home      |
      | schedule  |
      | sponsors  |
      | attendees |
      | about     |
      | faqs      |
      | 404       |

  Scenario: Without JavaScript a static bar is shown
    Given the visitor has JavaScript disabled
    When any page that shows the bar is rendered
    Then a static bar reads "beCamp starts October 2–3 — Register now →"
    And it is styled to match the live bar

  Scenario: The bar stays visible while the page scrolls
    Given the countdown bar is present
    When the visitor scrolls down the page
    Then the bar remains pinned to the top of the viewport

  Scenario: The bar sits below the overlays that must cover it
    Given the countdown bar is present
    When the mobile menu is opened
    Then the menu is drawn over the bar
