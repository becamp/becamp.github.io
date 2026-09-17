Feature: The Attendees link appears only once registrations pass the threshold
  The attendee directory unlocks at 20 registrants, and the navigation links to
  it only when there is something to see. The registrant count is fetched once
  per build and reused by the header and footer on every page.

  Scenario: The link is absent below the threshold
    Given 19 people have registered
    When any page is rendered
    Then the header navigation has no "Attendees" link
    And the footer navigation has no "Attendees" link

  Scenario: The link appears at the threshold
    Given 20 people have registered
    When any page is rendered
    Then the header navigation includes an "Attendees" link to "/attendees"
    And the footer navigation includes an "Attendees" link to "/attendees"

  Scenario: The link appears above the threshold
    Given 78 people have registered
    When any page is rendered
    Then the header navigation includes an "Attendees" link

  Scenario: The remaining links are always present
    When any page is rendered
    Then the navigation links to "/schedule", "/sponsors", "/about" and "/faqs"
    And a "Register" link is shown in the site's accent colour

  Scenario: Counting costs one fetch for the whole build
    Given a build renders every page
    When the header and footer each ask for the registrant count
    Then the count is fetched from Airtable once
    And every later caller is served the memoized value
