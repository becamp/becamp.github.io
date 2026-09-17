Feature: The published Saturday schedule lists sessions by time slot
  Sessions come from the Airtable "Saturday Schedule" table at build time. Rows
  follow the fixed slot order rather than the order Airtable returns.

  Scenario: Rows follow the canonical slot order
    When the schedule page is rendered with sessions
    Then the rows appear in this order
      | 9:30am - 10:15am  |
      | 10:20am - 11:05am |
      | 11:10am - 11:55am |
      | 12:05pm - 12:35pm |
      | 12:35pm - 1:25pm  |
      | 1:25pm - 1:55pm   |
      | 2:00pm - 2:45pm   |
      | 2:50pm - 3:35pm   |
      | 3:40pm - 4:05pm   |
      | 4:05pm - Whenever |

  Scenario: Each session shows its topic, speaker and room
    Given a session with a topic, a speaker, a location and a type
    When the schedule page is rendered
    Then the card shows the topic
    And the card shows the speaker
    And the card shows the location and type separated by a middot

  Scenario: A session without a speaker omits the line entirely
    Given a session with no speaker
    When the schedule page is rendered
    Then the card shows no speaker line

  Scenario: Room names are made readable
    Given Airtable returns the location "Breakout_Room_1"
    When the schedule page is rendered
    Then the card shows "Breakout Room 1"

  Scenario: Rows without a topic or a time are dropped
    Given the Airtable table contains a row with no topic
    And a row with no time
    When the schedule is built
    Then neither row appears on the page

  Scenario: Topic and speaker whitespace is trimmed
    Given Airtable returns a topic with surrounding whitespace
    When the schedule page is rendered
    Then the card shows the trimmed topic

  Scenario: The Friday programme is listed separately
    When the schedule page is rendered
    Then the reception at The Poplar Restaurant is listed for 4:30pm to 5:30pm
    And Pitch Night at the UVA School of Data Science is listed for 5:30pm to 8:30pm
    And each venue offers a directions link
