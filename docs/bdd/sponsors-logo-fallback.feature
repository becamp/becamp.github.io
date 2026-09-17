Feature: A sponsor without a logo is shown by name
  Logos come from Airtable attachments. A sponsor who has not supplied one is
  still presented properly rather than leaving an empty tile.

  Scenario: A sponsor with a logo shows the image
    Given a sponsor with a logo attachment
    When their tile is rendered
    Then the logo is shown
    And the sponsor's name is used as the image's alternative text

  Scenario: A sponsor without a logo shows their name
    Given a sponsor with no logo attachment
    When their tile is rendered
    Then their name is shown as text
    And the tile is the same size as a tile with a logo

  Scenario: Logos are normalised to the site's palette
    Given a sponsor logo of any colour
    When their tile is rendered
    Then the logo is rendered in the single tone the dark tiles use

  Scenario: Logos are downloaded into the build
    Given a sponsor logo hosted on an Airtable attachment URL
    When the site is built
    Then the image is downloaded and served from the site
    And the published page does not depend on the expiring Airtable URL

  Scenario: Logos keep their intrinsic dimensions
    Given a sponsor logo with a known width and height
    When their tile is rendered
    Then those dimensions are declared on the image
    And the logo is scaled to fit without distortion
