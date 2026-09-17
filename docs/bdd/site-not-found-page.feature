Feature: An unknown URL offers a way back
  A missing page is styled like the rest of the site and points at the two
  places a lost visitor most likely wants.

  Scenario: An unknown path shows the not-found page
    When a visitor opens a path that does not exist
    Then the not-found page is shown
    And the label reads "404"
    And the heading reads "This page pitched, but didn't get picked"

  Scenario: The page offers two ways onward
    When the not-found page is rendered
    Then a primary button links to the home page
    And a secondary button links to registration

  Scenario: The page keeps the site's chrome
    When the not-found page is rendered
    Then the header and footer are shown
    And the countdown bar is shown
