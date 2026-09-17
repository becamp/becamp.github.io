Feature: Links that leave the site open safely
  Anything pointing off-site opens in a new tab and is marked so the new page
  cannot reach back into this one.

  Scenario Outline: An external link is marked
    Given a "<component>" marked as external
    When it is rendered
    Then it opens in a new tab
    And it carries rel "noopener"

    Examples:
      | component          |
      | Button             |
      | TextLink           |
      | sponsor tile       |
      | sponsor placeholder|

  Scenario: An internal link is not marked
    Given a link that is not marked as external
    When it is rendered
    Then it has no target attribute
    And it has no rel attribute

  Scenario: The Gravatar credit opens in a new tab
    Given the attendee directory is unlocked
    When the page is rendered
    Then the Gravatar link opens in a new tab
    And it carries rel "noopener"

  Scenario: Directions links open in a new tab
    When an event info card is rendered
    Then each directions link opens in a new tab
