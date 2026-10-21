/**
 * The ISO 690 style of citation by numerical reference, written from Word's (ISO690Nmerical.XSL): citations by the
 * number of the source, in the order the document cites them, such as "(1)" or "(1 p. 50)", and a bibliography in that
 * order, each source after its number.
 *
 * Word reads this style's HTML with a quirk that the others don't show: after an entry whose bold holds nothing, such as
 * one with no author, the rest of the bibliography is bold.
 *
 * @module
 */
// cspell:words Nmerical
import { type FormattedText } from "./formatted-text";
import {
    type HtmlNode,
    type PopulatedSource,
    citedVolumeAndPages,
    copy,
    element,
    entryOf,
    formatMain,
    hasSameMain,
    hasText,
    populate,
    readHtml,
    startsWithTitle,
    stringOfNames,
    textOfHtml,
} from "./iso-690-family";
import { LOCALS } from "./locals";
import type { CitedSource, FormattedBibliography, StyleDefinition } from "./style";
import { xslTemplates } from "./xsl";
import type { WordSource } from "../word-source";

const { General, ISO690 } = LOCALS;
const { appendDot, needDot } = xslTemplates(General);

/** A source of a citation: its number, then the volume or pages cited, such as "(1 p. 50)" or "(1 2: 50)" (the template's `b:Citation`) */
const citation = (cited: CitedSource): FormattedText => [
    {
        text:
            (cited.first ? General.OpenBracket : "") +
            (cited.prefix ?? "") +
            String(cited.source.order) +
            citedVolumeAndPages(cited.volume, cited.pages, General.EnumSeparator, true) +
            (cited.suffix ?? "") +
            (cited.last ? General.CloseBracket : General.GroupSeparator),
    },
];

/**
 * A source's entry, without its number (`BibReference`): the main contributors in bold, such as "**Baker, Anna.**", or
 * "—." when they're the same as the source before's, then the rest of the entry
 */
const referenceOf = (source: PopulatedSource, previous: PopulatedSource | undefined): readonly HtmlNode[] => {
    const main = formatMain(source);
    const { start, rest } = entryOf(source, previous, "ISO 690");
    const named =
        startsWithTitle(previous) || startsWithTitle(source)
            ? [element("b", copy(main), needDot(main)), General.Space]
            : hasSameMain(source, previous)
              ? [stringOfNames(source.main) ? ISO690.SameAuthor + General.Dot + General.Space : ""]
              : [element("b", copy(appendDot(main))), General.Space];
    return [...start, ...named, ...rest];
};

/**
 * The bibliography, in the order the document cites its sources, each entry after its number, such as "1. ", or empty
 * when it has nothing (the template's `b:Bibliography`)
 */
const bibliography = (sources: readonly WordSource[]): FormattedBibliography => {
    const sorted = [...sources].sort((a, b) => a.order - b.order).map(populate);
    const paragraphs = sorted.map((source, index): readonly HtmlNode[] => {
        const reference = referenceOf(source, sorted[index - 1]);
        return hasText(textOfHtml(reference)) ? [String(source.source.order) + General.Dot + General.Space, copy(...reference)] : [];
    });
    return { paragraphs: readHtml(paragraphs), hangingIndent: false };
};

/** ISO 690 by numerical reference, as Word writes it */
export const iso690NumericalReference: StyleDefinition = {
    name: "ISO 690 - Numerical Reference",
    file: "ISO690Nmerical.XSL",
    version: "1987",
    citation,
    bibliography,
};
