Feature: Airtable results are read to the end
  Airtable returns large tables one page at a time with a cursor. Every page is
  collected before the data is used, so a table that outgrows one page does not
  silently truncate.

  Scenario: A single-page table is returned as-is
    Given Airtable returns records and no offset
    When the table is fetched
    Then one request is made
    And every record is returned

  Scenario: A multi-page table is followed to the end
    Given Airtable returns records with an offset twice, then records with no offset
    When the table is fetched
    Then three requests are made
    And each request after the first carries the previous response's offset
    And the returned records are the three pages concatenated

  Scenario: The table name is escaped in the request URL
    Given a table named "Saturday Schedule"
    When the table is fetched
    Then the table name is URL-encoded in the request path
