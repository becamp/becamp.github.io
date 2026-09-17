Feature: Every page describes itself to crawlers and link previews
  Each page sets its own title and description, a canonical URL, and the Open
  Graph and Twitter tags a shared link needs.

  Scenario: Each page sets its own title
    Then the following titles are used
      | page      | title                                            |
      | home      | beCamp — The un-conference for Charlottesville    |
      | schedule  | Schedule — beCamp                                |
      | sponsors  | Sponsors — beCamp                                |
      | attendees | Attendees — beCamp                               |
      | faqs      | FAQs — beCamp                                    |
      | register  | Register — beCamp                                |
      | 404       | Page not found — beCamp                          |

  Scenario: A page without its own description uses the site default
    When a page is rendered without a description
    Then the description reads "beCamp is a free, community-run un-conference for the Charlottesville tech community."

  Scenario: A page with its own description uses it
    When the attendees page is rendered
    Then its description names the people coming to beCamp 2026

  Scenario: The canonical URL is absolute
    When the schedule page is rendered
    Then the canonical link is "https://be.camp/schedule"

  Scenario: Link previews carry a title, description and image
    When any page is rendered
    Then an Open Graph title, description, URL and image are set
    And the image is declared as 2400 by 1260
    And the site name is "beCamp"
    And a large-image Twitter card is declared

  Scenario: Favicons are offered at several sizes
    When any page is rendered
    Then icons are declared at 16, 32 and 192 pixels
    And an Apple touch icon is declared at 152 pixels

  Scenario: A sitemap is published
    When the site is built
    Then a sitemap is generated
    And it is rooted at "https://be.camp"
