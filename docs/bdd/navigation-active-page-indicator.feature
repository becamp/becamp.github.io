Feature: The navigation marks the page you are on
  The current page's link carries a small rotated square beneath it, so the
  visitor can see where they are without reading the URL.

  Scenario Outline: The current page's link is marked
    When the visitor is on "<path>"
    Then the "<label>" link shows the active marker

    Examples:
      | path       | label     |
      | /schedule  | Schedule  |
      | /sponsors  | Sponsors  |
      | /about     | About     |
      | /faqs      | FAQs      |
      | /register  | Register  |

  Scenario: Other links are unmarked
    When the visitor is on "/schedule"
    Then only the "Schedule" link shows the active marker

  Scenario: A trailing slash still matches
    When the visitor is on "/schedule/"
    Then the "Schedule" link shows the active marker

  Scenario: The home page matches the root path
    When the visitor is on "/"
    Then no navigation link shows the active marker

  Scenario: The mobile menu marks the current page in the accent colour
    Given the viewport is narrow enough for the mobile menu
    When the visitor is on "/faqs" and opens the menu
    Then the "FAQs" entry is shown in the accent colour
