Feature: One switch fakes every gated section for review
  Gated interfaces cannot be reviewed before the data that unlocks them exists.
  Setting USE_FAKE_DATA to "true" substitutes a registrant count, an attendee
  directory and a Saturday schedule so all of it can be looked at in advance.

  Production builds leave the flag unset and read real Airtable data.

  Scenario: The registrant count is faked
    Given USE_FAKE_DATA is "true"
    When the registrant count is requested
    Then the count is 78
    And no Guests request is made to Airtable

  Scenario: The faked count unlocks the gated sections
    Given USE_FAKE_DATA is "true"
    When the site is built
    Then the navigation includes the "Attendees" link
    And the attendee directory is unlocked

  Scenario: The attendee directory is faked
    Given USE_FAKE_DATA is "true"
    When the attendee list is requested
    Then 26 sample attendees are returned
    And each has an avatar hash derived from a sample address
    And no Guests request is made to Airtable

  Scenario: The Saturday schedule is faked
    Given USE_FAKE_DATA is "true"
    When the Saturday schedule is requested
    Then a full sample day of sessions is returned
    And parallel tracks fill the morning and afternoon session blocks
    And lunch, lightning talks, the break, the retrospective and drinks occupy single rows
    And no Saturday Schedule request is made to Airtable

  Scenario: The faked schedule lifts the preliminary teaser
    Given USE_FAKE_DATA is "true"
    When the schedule page is rendered before Pitch Night
    Then the grid is not blurred
    And the sample sessions are legible

  Scenario Outline: Anything other than "true" reads real data
    Given USE_FAKE_DATA is <value>
    When the site is built
    Then content is read from Airtable

    Examples:
      | value   |
      | unset   |
      | "false" |
      | "1"     |
      | "TRUE"  |

  Scenario: The flag is set per deployment rather than in the repository
    When the deploy workflow runs
    Then USE_FAKE_DATA is read from a repository variable
