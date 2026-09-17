Feature: The event's times and venues are stated consistently
  When and where beCamp happens appears in the hero, on the schedule page and in
  the countdown. The dates and venues agree wherever they are shown.

  Scenario: The hero states both days
    When the home page is rendered
    Then a card reads "Fri, Oct 2 from 4:30–8:30pm" for "Reception & Pitch night"
    And a card reads "Sat, Oct 3 from 9am–4pm" for "Sessions"

  Scenario: The Friday card lists both venues in order
    When the Friday card is rendered
    Then "The Poplar Restaurant" is listed at 4:30
    And "UVA School of Data Science" is listed at 5:30
    And each venue offers a directions link

  Scenario: The Saturday card lists one venue
    When the Saturday card is rendered
    Then "UVA School of Data Science" is listed
    And no time annotation is shown, since there is only one venue

  Scenario: The schedule page repeats the same times
    When the schedule page is rendered
    Then the reception is listed as 4:30pm to 5:30pm
    And Pitch Night is listed as 5:30pm to 8:30pm
    And Saturday sessions are listed as 9am to 4pm

  Scenario: The countdown counts to the reception
    When the countdown bar is rendered before the event
    Then it counts down to Friday 2 October 2026 at 4:30pm Eastern

  @manual
  Scenario: The countdown ends when sessions end
    When the clock passes Saturday 3 October 2026 at 4:00pm Eastern
    Then the countdown bar removes itself

  Scenario: The location is named on every page that mentions dates
    When the home page or the registration page is rendered
    Then it reads "October 2–3 in Charlottesville, VA"
