Feature: Unfilled schedule slots stay visible
  An un-conference schedule with gaps in it is working as intended, so a slot
  nobody pitched into is shown as an open placeholder rather than hidden.

  Scenario: A slot with no sessions shows a placeholder
    Given sessions exist for some slots but not for "1:25pm - 1:55pm"
    When the schedule page is rendered
    Then the "1:25pm - 1:55pm" row is still present
    And it shows a full-width placeholder
    And the placeholder reads "Coming soon"

  Scenario: No sessions at all shows a placeholder skeleton
    Given the Saturday Schedule table returns no usable rows
    When the schedule page is rendered
    Then ten placeholder rows are shown
    And each row's time reads "TBD"
    And the rows alternate between three parallel placeholders and one full-width placeholder

  Scenario: Placeholders are not links
    Given a schedule placeholder is shown
    Then it is rendered as a plain element rather than a link
