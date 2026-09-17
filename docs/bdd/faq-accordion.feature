Feature: FAQ answers expand and collapse
  Questions are collapsed by default and open one at a time as the visitor
  chooses, using the platform's own disclosure element so it works without
  JavaScript.

  Scenario: Answers start collapsed
    When a page with FAQs is rendered
    Then every answer is hidden
    And every question shows a "+" indicator

  Scenario: Opening a question reveals its answer
    Given a collapsed FAQ question
    When the visitor activates it
    Then its answer is shown
    And the indicator changes to "−"
    And the question text changes to the link colour

  Scenario: Closing a question hides its answer again
    Given an open FAQ question
    When the visitor activates it
    Then its answer is hidden
    And the indicator changes back to "+"

  Scenario: Several questions can be open at once
    Given two collapsed FAQ questions
    When the visitor opens both
    Then both answers are shown

  Scenario: The disclosure works without JavaScript
    Given the visitor has JavaScript disabled
    When they activate a FAQ question
    Then its answer is shown

  Scenario: The default marker is suppressed in favour of the site's own
    When a page with FAQs is rendered
    Then no browser default disclosure triangle is shown
    And the "+" and "−" indicators are used instead
