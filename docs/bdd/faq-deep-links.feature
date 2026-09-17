Feature: Individual FAQs can be linked to directly
  Each question carries an anchor derived from its own text, so other pages can
  point at a specific answer.

  Scenario Outline: The anchor is derived from the question
    Given a FAQ question "<question>"
    Then its anchor is "<anchor>"

    Examples:
      | question                    | anchor                   |
      | How are topics decided?     | how-are-topics-decided   |
      | Does it cost anything?      | does-it-cost-anything    |
      | Can I attend just one day?  | can-i-attend-just-one-day|
      | Are there rules?            | are-there-rules          |

  Scenario: The schedule page links to a specific FAQ
    When the schedule page is rendered
    Then it links to "/faqs#how-are-topics-decided"

  Scenario: Following a deep link scrolls clear of the header
    When the visitor opens "/faqs#how-are-topics-decided"
    Then that question is scrolled into view
    And it is not hidden behind the sticky header

  Scenario: The home page FAQ summary links to the full list
    When the home page is rendered
    Then a shortened set of common questions is shown
    And a link to "/faqs" offers all of them
