Feature: The registration endpoint only answers the site's own form
  The endpoint is a function hosted separately from the static site, so it
  checks the method and the request origin before doing anything else.

  Scenario Outline: Only POST is accepted
    When a "<method>" request reaches the registration endpoint
    Then the response status is 405
    And the response body is "Method not allowed"

    Examples:
      | method |
      | GET    |
      | PUT    |
      | DELETE |
      | PATCH  |
      | HEAD   |

  Scenario Outline: Only known origins may submit
    Given a POST whose origin is "<origin>"
    When it reaches the registration endpoint
    Then the submission is accepted for processing

    Examples:
      | origin                                  |
      | https://be.camp                         |
      | https://www.be.camp                     |
      | https://be-camp-website.vercel.app      |
      | http://localhost:4321                   |

  Scenario Outline: Any other origin is forbidden
    Given a POST whose origin is "<origin>"
    When it reaches the registration endpoint
    Then the response status is 403
    And the response body is "Forbidden"
    And no record is created in Airtable

    Examples:
      | origin                     |
      | https://example.com        |
      | http://be.camp             |
      | https://be.camp.evil.test  |
      | ""                         |

  Scenario: The redirect returns to whichever allowed origin posted
    Given a POST from "https://be-camp-website.vercel.app"
    When the submission is processed
    Then the redirect target begins with "https://be-camp-website.vercel.app/register"

  Scenario: The redirect is a 303
    When the endpoint sends the visitor back to the form
    Then the redirect status is 303
    And a browser reload of the result does not repost the form
