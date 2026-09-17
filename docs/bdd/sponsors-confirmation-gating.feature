Feature: Only confirmed sponsors are published
  A sponsor appears on the site once the "Commitment confirmed" box is ticked in
  Airtable, so a conversation in progress is never announced early.

  Scenario: A confirmed sponsor is published
    Given a sponsor whose commitment is confirmed
    When the sponsor list is fetched
    Then that sponsor appears on the site

  Scenario: An unconfirmed sponsor is withheld
    Given a sponsor whose commitment is not confirmed
    When the sponsor list is fetched
    Then that sponsor does not appear on the site

  Scenario: The filter is applied by Airtable rather than after the fact
    When the sponsor list is fetched
    Then the request carries a filter on the "Commitment confirmed" field

  Scenario: A row with no sponsor name is dropped
    Given an Airtable row with no value in the Sponsor column
    When the sponsor list is built
    Then that row does not appear on the site

  Scenario: A preview flag can include unconfirmed sponsors
    Given the unconfirmed-sponsor preview flag is enabled
    When the sponsor list is fetched
    Then no confirmation filter is applied
    And every sponsor row is returned
