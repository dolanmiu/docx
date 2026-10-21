/**
 * The GB7714 style of citation, written from Word's (GB.XSL). It is Word's ISO 690 by first element and date but for a
 * few of its templates: it cites a source by its tag when the source has no author or year, and writes a space after a
 * website's version and date, and a report's department and institution, by different fields.
 *
 * @module
 */
import { firstElementBibliography, firstElementCitation } from "./iso-690-family";
import type { StyleDefinition } from "./style";

/** GB7714, as Word writes it */
export const gb7714: StyleDefinition = {
    name: "GB7714",
    file: "GB.XSL",
    version: "2005",
    citation: firstElementCitation("GB7714"),
    bibliography: firstElementBibliography("GB7714"),
};
