Feature: The introduction video opens in a lightbox
  The "What is beCamp?" button opens a video over the page. The embed is loaded
  only when the lightbox opens and unloaded when it closes, so the video never
  plays or phones home in the background.

  Scenario: The lightbox opens on demand
    Given the visitor is on the home page
    When they activate "What is beCamp?"
    Then the lightbox is shown over the page
    And scrolling of the page behind it is locked
    And the video embed is loaded and begins playing

  Scenario: No embed is loaded until the lightbox opens
    When the home page is rendered
    Then the video frame has no source
    And no request is made to the video host

  Scenario: Closing the lightbox unloads the embed
    Given the lightbox is open
    When the visitor closes it
    Then the lightbox is hidden
    And the video frame's source is cleared
    And page scrolling is restored

  Scenario Outline: The lightbox can be dismissed several ways
    Given the lightbox is open
    When the visitor <action>
    Then the lightbox is hidden

    Examples:
      | action                              |
      | activates the close button          |
      | presses Escape                      |
      | clicks the backdrop outside the video |

  Scenario: Clicking the video itself does not close the lightbox
    Given the lightbox is open
    When the visitor clicks the video
    Then the lightbox stays open

  Scenario: Escape does nothing when the lightbox is closed
    Given the lightbox is closed
    When the visitor presses Escape
    Then nothing happens

  Scenario: The button falls back to an anchor without JavaScript
    Given the visitor has JavaScript disabled
    When they activate "What is beCamp?"
    Then the link is followed rather than intercepted

  Scenario: The embed is served from the privacy-preserving host
    Given the lightbox is open
    Then the embed is loaded from the no-cookie video host

  Scenario: The close control is announced
    When the lightbox is rendered
    Then the close control carries an accessible label

  Scenario: The Escape listener is attached once for the session
    Given the visitor navigates between several pages
    Then the document-wide Escape listener is attached once
    And the element listeners are rebound to each page's lightbox

  Scenario: Pages without the video section are unaffected
    Given the visitor is on a page with no video section
    When they press Escape
    Then nothing happens
