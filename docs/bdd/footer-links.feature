Feature: The footer carries the site's standing links
  Every page ends with the same navigation and the handful of links that need to
  be reachable from anywhere.

  Scenario: The footer repeats the site navigation
    When any page is rendered
    Then the footer links to "/schedule", "/sponsors", "/about" and "/faqs"

  Scenario: The footer links to the shared code of conduct
    When any page is rendered
    Then the footer links to the Charlottesville tech community code of conduct
    And the link opens in a new tab

  Scenario: The footer offers a way to sponsor
    When any page is rendered
    Then the footer offers a "Become a Sponsor" email link
    And the email subject names beCamp sponsorship

  Scenario: The footer offers a way to reach the organizers
    When any page is rendered
    Then the footer offers a "Contact organizers" email link

  Scenario: The FAQs point at the footer for these links
    When the FAQ about the code of conduct is read
    Then it says the full code of conduct is linked in the footer of every page

  Scenario: The attendees link follows the same gate as the header
    Given the registrant count is below the unlock threshold
    When any page is rendered
    Then the footer has no "Attendees" link
