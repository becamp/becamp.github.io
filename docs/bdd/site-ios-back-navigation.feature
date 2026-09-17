Feature: The back button works on iOS
  WebKit's back-trapping heuristic skips history entries it considers added
  without user interaction, which includes entries pushed after the router's
  async page fetch. The result was that back or swipe-back jumped clean out of
  the site, so on iOS internal links stay on native navigation.

  Scenario Outline: iOS devices opt out of client-side routing
    Given the visitor is on <device>
    When any page is rendered
    Then every internal link is marked to force a full page load

    Examples:
      | device  |
      | iPhone  |
      | iPad    |
      | iPod    |

  Scenario: iPadOS masquerading as macOS is still detected
    Given the visitor is on a Mac user agent reporting more than one touch point
    When any page is rendered
    Then every internal link is marked to force a full page load

  Scenario: Back navigation returns within the site on iOS
    Given the visitor is on iOS and has navigated from the home page to the schedule
    When they go back
    Then they return to the home page
    And they are not taken out of the site

  Scenario: Other platforms keep client-side routing
    Given the visitor is on a desktop browser
    When any page is rendered
    Then internal links are not marked for a full page load
    And navigation stays client-side

  Scenario: Links added by a later navigation are also marked
    Given the visitor is on iOS
    When a new page is swapped in
    Then the new page's internal links are marked too
