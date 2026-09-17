Feature: A failed registration keeps what the visitor typed
  A failed submit used to land on an empty form, so anyone who hit an error had
  to retype their name, email and eight checkboxes — which is how people end up
  double-submitting or giving up. Values survive the round trip in
  sessionStorage under the key "becamp:registration".

  Scenario: Values are stashed on submit
    Given a visitor has filled in the registration form
    When they submit it
    Then every named text, select and checkbox value is written to sessionStorage
    And checkbox fields are stored as booleans

  Scenario: Values are restored after a failure
    Given a submission failed and the visitor is back on the form
    And a stash exists from that submission
    When the page finishes loading
    Then each text and select field is refilled from the stash
    And each checkbox is restored to its stashed checked state

  Scenario: The stash is dropped once registration lands
    Given a submission succeeded and the visitor is back on the form
    When the page finishes loading
    Then the stash is removed from sessionStorage

  Scenario Outline: Single-use and trap fields are never stashed
    Given a visitor submits the registration form
    When the form values are stashed
    Then the field "<field>" is excluded

    Examples:
      | field           |
      | recaptcha-token |
      | bc-hp           |

  Scenario: Unwritable storage costs the convenience, not the submission
    Given sessionStorage cannot be written to
    When the visitor submits the registration form
    Then the submission still proceeds
    And no error is surfaced to the visitor

  Scenario: An unreadable stash is treated as no stash
    Given the stashed value is not valid JSON
    When the form attempts to restore it
    Then no fields are changed
    And no error is surfaced to the visitor

  Scenario: A stash from a different form shape is applied field by field
    Given the stash contains a field the current form no longer has
    When the form is restored
    Then the unknown field is ignored
    And every field the form still has is restored
