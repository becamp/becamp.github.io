Feature: Registration form submission
  A visitor registers for beCamp by posting the form to the registration
  endpoint, which writes one row to the Airtable Guests table and sends them
  back to the form with a status on the query string.

  Background:
    Given the registration endpoint has valid Airtable credentials
    And the request origin is an allowed origin

  Scenario: A complete registration is saved
    Given a visitor has filled in their name and email address
    When they submit the registration form
    Then one record is created in the Airtable Guests table
    And they are redirected to "/register?status=success"
    And the page shows "You're registered! See you in October."

  Scenario: Attendance and volunteering choices are recorded
    Given a visitor has checked the reception, Pitch Night and Saturday boxes
    And they have checked "Yes, I can help out on Saturday!"
    When they submit the registration form
    Then the created record marks each checked box as true
    And the created record marks every unchecked box as false

  Scenario: The success banner is scrolled into view
    Given a visitor has been redirected to "/register?status=success"
    When the page finishes loading
    Then the success banner is no longer hidden
    And the banner is scrolled to the centre of the viewport
