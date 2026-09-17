Feature: The attendee directory lists people who opted in
  Only registrants who ticked the directory box appear, listed alphabetically,
  with an avatar looked up from Gravatar by the hash of their email address.

  Background:
    Given the registrant count is above the unlock threshold

  Scenario: Only opted-in registrants are listed
    Given a registrant who ticked the directory box
    And a registrant who left it unticked
    When the attendees page is rendered
    Then the first registrant is listed
    And the second registrant is not listed

  Scenario Outline: A registrant missing required data is skipped
    Given an opted-in registrant with no <field>
    When the attendees page is rendered
    Then that registrant is not listed

    Examples:
      | field |
      | name  |
      | email |

  Scenario: The list is alphabetical by name
    Given opted-in registrants named "Wren Palmer", "Ada Whitfield" and "Maya Trent"
    When the attendees page is rendered
    Then they appear in the order "Ada Whitfield", "Maya Trent", "Wren Palmer"

  Scenario: Each entry shows an avatar and a name
    Given an opted-in registrant
    When the attendees page is rendered
    Then their name is shown
    And an avatar is requested from Gravatar using the hash of their email
    And the avatar request asks for a PG rating
    And the avatar falls back to a generated image when Gravatar has none

  Scenario: Avatars load lazily
    Given the attendee grid is shown
    Then each avatar image is marked for lazy loading
    And each avatar declares its intrinsic width and height

  Scenario: Avatars are decorative in the markup
    Given the attendee grid is shown
    Then each avatar has an empty alt attribute
    And the adjacent name carries the meaning

  Scenario: The grid reflows across viewport sizes
    When the attendees page is rendered
    Then the grid shows three columns on a narrow viewport
    And more columns as the viewport widens
