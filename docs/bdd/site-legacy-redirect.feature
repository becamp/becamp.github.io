Feature: The old history URL still works
  The previous Nuxt site had a /history page. That story now lives on the about
  page, so the old URL redirects rather than 404ing.

  Scenario: The history URL redirects to about
    When a visitor opens "/history"
    Then they are redirected to "/about"

  Scenario: An inbound link to the old URL is not lost
    Given an external site links to "/history"
    When someone follows that link
    Then they land on the about page
