Feature: Each registration failure explains itself
  The endpoint names the reason for a failure on the query string, and the form
  turns that into copy the visitor can act on. Every failure used to look
  identical from the browser, which made reports impossible to diagnose.

  Background:
    Given the visitor has been redirected back to the registration form with an error

  Scenario Outline: A known reason gets its own copy
    Given the query string carries the reason "<reason>"
    When the page finishes loading
    Then the error banner is no longer hidden
    And the error banner reads "<message>"

    Examples:
      | reason   | message                                                                                                                                      |
      | missing  | We need both a name and an email address to register you. Please fill those in and submit again.                                              |
      | captcha  | Our spam check flagged this submission. If you're a human — and you almost certainly are — email us and we'll register you by hand.           |
      | airtable | We couldn't save your registration just now. Please try again in a minute.                                                                    |
      | config   | The registration system is misconfigured on our end. Please email us and we'll sort it out.                                                   |
      | server   | Something went wrong on our end. Please try again.                                                                                            |

  Scenario: An unrecognised reason keeps the generic copy
    Given the query string carries the reason "something-new"
    When the page finishes loading
    Then the error banner reads "Something went wrong submitting your registration. Please try again."

  Scenario: A missing reason keeps the generic copy
    Given the query string carries a status of error and no reason
    When the page finishes loading
    Then the error banner reads "Something went wrong submitting your registration. Please try again."

  Scenario: Every error offers a human fallback
    When the error banner is shown
    Then it offers a mailto link to the organizers
    And the link subject is "beCamp: registration trouble"
    And it promises the visitor's details are kept below

  Scenario: A page with no status shows neither banner
    Given the visitor opens "/register" with no query string
    When the page finishes loading
    Then the success banner stays hidden
    And the error banner stays hidden
