Feature: The photo archive shows every beCamp on record, year by year
  Photographs from past beCamps are collected on one page, newest year first,
  each credited as far as its source allows, and each opening in a viewer.

  Scenario: Photos are grouped by year, newest first
    When the photos page is rendered
    Then the photographs are grouped under a heading for each year
    And the years run from newest to oldest
    And each year states how many photographs it holds

  Scenario: A visitor can jump to any year
    When the photos page is rendered
    Then there is a link to each year's group of photographs
    And each link shows that year's photograph count

  Scenario: Every photograph is described
    When the photos page is rendered
    Then each photograph carries alternative text describing the scene

  Scenario: A photograph with no description fails the build
    Given a photograph in the archive with no alternative text
    When the site is built
    Then the build fails

  Scenario: Photographs are credited as far as the source allows
    When the photos page is rendered
    Then a photograph whose file names its photographer is credited to that handle
    And a photograph from Flickr is credited to the beCamp community via Flickr
    And any other photograph is credited to the beCamp community

  Scenario: Photographs below the first screen load on demand
    When the photos page is rendered
    Then only the first few photographs of the newest year load eagerly
    And every other photograph loads lazily

  Scenario: Opening a photograph shows it full size
    Given the visitor is on the photos page
    When the visitor selects a photograph
    Then a viewer opens over the page showing it full size
    And the viewer shows its description, year, credit and position in the archive
    And the page behind it does not scroll

  Scenario: The viewer steps through the whole archive
    Given the viewer is open on a photograph
    When the visitor presses the right arrow key
    Then the next photograph in the archive is shown
    And stepping past the last photograph returns to the first

  Scenario Outline: The viewer can be closed
    Given the viewer is open on a photograph
    When the visitor <action>
    Then the viewer closes
    And the page scrolls again

    Examples:
      | action                        |
      | presses Escape                |
      | selects the close button      |
      | clicks outside the photograph |

  Scenario: Without JavaScript a photograph opens as an image
    Given the visitor has JavaScript disabled
    When the visitor selects a photograph
    Then the full-size image opens directly

  Scenario: The archive and the session history link to each other
    When the photos page is rendered
    Then each year links to that year's sessions in the session history
    And in the session history, each year with photographs links back to them

  Scenario: Following a session-history link opens on that year
    When the visitor opens the session history at a year's address
    Then that year's sessions are the ones shown

  Scenario: The archive asks for the missing years
    When the photos page is rendered
    Then it names the years with no photographs yet
    And it offers a way to send photographs to the organizers

  Scenario: A slideshow plays the archive from the start
    Given the visitor is on the photos page
    When the visitor starts the slideshow
    Then the viewer opens on the newest year's first photograph
    And it advances to the next photograph every five seconds
    And a bar shows the time left on the current photograph

  Scenario: A slideshow can start from any year
    Given the visitor is on the photos page
    When the visitor starts the slideshow for 2008
    Then the viewer opens on the first photograph of 2008
    And it advances on its own

  Scenario: Opening a single photograph does not start a slideshow
    Given the visitor is on the photos page
    When the visitor selects a photograph
    Then the viewer stays on that photograph until the visitor moves on

  Scenario Outline: The slideshow can be paused and resumed
    Given the slideshow is playing
    When the visitor <action>
    Then the slideshow pauses on the current photograph
    And doing the same again resumes it

    Examples:
      | action                     |
      | presses Space              |
      | selects the pause control  |

  Scenario: Stepping by hand during a slideshow restarts the clock
    Given the slideshow is playing
    When the visitor presses the right arrow key
    Then the next photograph gets a full five seconds

  Scenario: Closing the viewer stops the slideshow
    Given the slideshow is playing
    When the visitor presses Escape
    Then the viewer closes
    And no further photograph is shown

  Scenario: Reduced motion keeps the slideshow but drops the animation
    Given the visitor prefers reduced motion
    When the visitor starts the slideshow
    Then photographs change without a fade
    And the time-left bar does not animate

  Scenario: Without JavaScript there is no slideshow control
    Given the visitor has JavaScript disabled
    When the photos page is rendered
    Then no slideshow control is shown
