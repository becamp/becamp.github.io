Feature: Registrant email addresses never leave the build
  Avatars need an email hash, not an email. The hash is computed while the site
  is being built and only the hash is written into the published HTML.

  Scenario: Only the hash reaches the browser
    Given an opted-in registrant with the email "ada@example.com"
    When the attendees page is built
    Then the published HTML contains the MD5 hash of that address
    And the published HTML does not contain the address itself

  Scenario: The address is lowercased and trimmed before hashing
    Given a registrant whose stored email is "  Ada@Example.com  "
    When the hash is computed
    Then it is the hash of "ada@example.com"
    And the avatar resolves to the same image as the tidied address

  Scenario: Only the fields the directory needs are requested
    When the attendee list is fetched from Airtable
    Then the request asks only for the guest name, email and directory permission fields

  Scenario: The registrant count request carries no personal data
    When the registrant count is fetched from Airtable
    Then the request asks only for the guest name field
    And only the number of rows is used
