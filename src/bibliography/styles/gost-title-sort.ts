/**
 * Word's GOST - Title Sort style (GostTitle.XSL): citations such as "(Baker, 2010 p. 50)", and a bibliography of entries
 * such as "**How to Write Bibliographies** [Book] / auth. Dickens Charles John. - Chicago : Adventure Works Press,
 * 2006.", each starting with its title in bold, sorted by it.
 *
 * @module
 */
import { formatCitation, formatEntry, mainOf } from "./gost-family";
import type { StyleDefinition } from "./style";
import { sortByKey } from "./xsl";
import { type WordSource, fieldOf } from "../word-source";

/**
 * The sources sorted by title, then by the last, first and middle names of the first of the people they're named by
 * (`sortedList`). Each sort keeps the order of the one before for sources it doesn't tell apart, so sorting by the last
 * key first sorts by them all
 */
const sorted = (sources: readonly WordSource[]): readonly WordSource[] => {
    const person = (source: WordSource): { readonly last: string; readonly first: string; readonly middle: string } =>
        mainOf(source).people[0] ?? { last: "", first: "", middle: "" };
    return [
        (source: WordSource): string => person(source).middle,
        (source: WordSource): string => person(source).first,
        (source: WordSource): string => person(source).last,
        (source: WordSource): string => fieldOf(source, "Title"),
    ].reduce((list, key) => sortByKey(list, key), sources);
};

/**
 * Word's GOST - Title Sort style.
 *
 * @internal
 */
export const gostTitleSort: StyleDefinition = {
    name: "GOST - Title Sort",
    file: "GostTitle.XSL",
    version: "2003",
    citation: formatCitation,
    bibliography: (sources) => ({
        hangingIndent: false,
        paragraphs: sorted(sources).map((source) => formatEntry(source, "title")),
    }),
};
