/**
 * Word's GOST - Name Sort style (GostName.XSL): citations such as "(Baker, 2010 p. 50)", and a bibliography of entries
 * such as "**Dickens Charles John** How to Write Bibliographies [Book]. - Chicago : Adventure Works Press, 2006.", each
 * starting with its authors in bold, sorted by them.
 *
 * @module
 */
import { formatCitation, formatEntry, formatPersons, mainOf } from "./gost-family";
import type { StyleDefinition } from "./style";
import { sortByKey } from "./xsl";
import { type WordSource, fieldOf } from "../word-source";

/** What the bibliography is sorted by (`b:SortingString`, as `populateMain` writes it): the authors, then the title */
const sortingStringOf = (source: WordSource): string => {
    const main = mainOf(source);
    const author = main.corporate ? main.corporate : formatPersons(main.people);
    const title = fieldOf(source, "Title");
    return (author ? ` ${author}` : "") + (title ? ` ${title}` : "");
};

/**
 * Word's GOST - Name Sort style.
 *
 * @internal
 */
export const gostNameSort: StyleDefinition = {
    name: "GOST - Name Sort",
    file: "GostName.XSL",
    version: "2003",
    citation: formatCitation,
    bibliography: (sources) => ({
        hangingIndent: false,
        paragraphs: sortByKey(sources, sortingStringOf).map((source) => formatEntry(source, "name")),
    }),
};
