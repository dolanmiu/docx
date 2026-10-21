/**
 * The ISO 690 style of citation by first element and date, written from Word's (ISO690.XSL): citations such as
 * "(Baker, 2010)", and a bibliography sorted by its sources' authors, with the year after them.
 *
 * @module
 */
import { firstElementBibliography, firstElementCitation } from "./iso-690-family";
import type { StyleDefinition } from "./style";

/** ISO 690 by first element and date, as Word writes it */
export const iso690FirstElementAndDate: StyleDefinition = {
    name: "ISO 690 - First Element and Date",
    file: "ISO690.XSL",
    version: "1987",
    citation: firstElementCitation("ISO 690"),
    bibliography: firstElementBibliography("ISO 690"),
};
