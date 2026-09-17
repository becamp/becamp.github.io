/* Small assertions over a built page. Kept deliberately thin — steps should
   read as statements about the page, not about selectors. */

export const text = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

export const all = (doc: Document | Element, selector: string) => Array.from(doc.querySelectorAll(selector));

export const texts = (doc: Document | Element, selector: string) => all(doc, selector).map(text);

/** Every link href on the page, in document order. */
export const hrefs = (doc: Document) => all(doc, 'a[href]').map((a) => a.getAttribute('href') ?? '');

/** The link whose visible text matches, ignoring case and whitespace. */
export const linkByText = (doc: Document | Element, label: string) =>
  all(doc, 'a').find((a) => text(a).toLowerCase() === label.toLowerCase());

/** True when any element matching the selector contains the given text. */
export const containsText = (doc: Document | Element, selector: string, needle: string) =>
  all(doc, selector).some((el) => text(el).includes(needle));

/** The whole page's visible text, collapsed. Use for copy assertions. */
export const pageText = (doc: Document) => text(doc.body);

/** Meta tag content by name or property. */
export const meta = (doc: Document, key: string) =>
  doc.querySelector(`meta[name="${key}"]`)?.getAttribute('content') ??
  doc.querySelector(`meta[property="${key}"]`)?.getAttribute('content') ??
  undefined;

/** A class list check that tolerates Tailwind's arbitrary-value syntax. */
export const hasClass = (el: Element | null | undefined, cls: string) =>
  (el?.getAttribute('class') ?? '').split(/\s+/).includes(cls);

export const classList = (el: Element | null | undefined) => (el?.getAttribute('class') ?? '').split(/\s+/);
