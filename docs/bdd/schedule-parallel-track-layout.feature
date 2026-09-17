Feature: Parallel sessions share a single schedule row
  Several sessions can run at once. From the small breakpoint upwards they sit
  side by side on one line; a lone session spans the full width.

  Scenario: Two or more sessions in a slot become columns
    Given three sessions share the slot "9:30am - 10:15am"
    When the schedule page is rendered at desktop width
    Then the three sessions appear side by side in one row
    And the columns are of equal width

  Scenario: A single session spans the row
    Given exactly one session occupies the slot "12:35pm - 1:25pm"
    When the schedule page is rendered
    Then that session spans the full width of the row

  Scenario Outline: The column count follows the number of sessions up to five
    Given <count> sessions share one slot
    When the schedule page is rendered at desktop width
    Then the row is laid out in <columns> columns

    Examples:
      | count | columns |
      | 2     | 2       |
      | 3     | 3       |
      | 5     | 5       |

  Scenario: Beyond five tracks the row wraps
    Given seven sessions share one slot
    When the schedule page is rendered at desktop width
    Then the row is laid out in five columns
    And the remaining sessions wrap onto the next line

  Scenario: Narrow viewports stack every session
    Given three sessions share one slot
    When the schedule page is rendered below the small breakpoint
    Then the sessions are stacked in a single column
    And the page does not scroll horizontally
