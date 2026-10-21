/**
 * A document's bibliography: the sources its citations and bibliographies refer to, and the style they're written in.
 *
 * @module
 */
import type { DocumentBibliography } from "docx";

import { CitationStyle, STYLE_DEFINITIONS } from "./citation-style";
import { BibliographySources } from "./document-sources";
import type { Source } from "./source";

/**
 * Options for {@link createBibliography}.
 *
 * @publicApi
 */
export type DocumentBibliographyOptions = {
    /** The style the citations and bibliographies are written in, such as APA, Word's own default, which it is if not given */
    readonly style?: (typeof CitationStyle)[keyof typeof CitationStyle];
    /** The sources, such as books and websites, which Word lists in its Source Manager */
    readonly sources: readonly Source[];
};

/**
 * A document's bibliography, for the document's `bibliography`: the sources its citations and bibliographies refer to,
 * and the style they're written in, as Word's References > Manage Sources and Style keep them.
 *
 * Every source is in the document's bibliographies, cited or not, as Word's are, and Word lists every source in its
 * Source Manager.
 *
 * @publicApi
 *
 * @throws If two sources have the same tag, a source has none, or the style isn't one of {@link CitationStyle}'s
 *
 * @example
 * ```typescript
 * const doc = new Document({
 *   bibliography: createBibliography({
 *     style: CitationStyle.APA,
 *     sources: [
 *       {
 *         tag: "Bak10",
 *         type: SourceType.BOOK,
 *         authors: [{ lastName: "Baker", firstName: "Anna" }],
 *         title: "The Art of Pizza",
 *         year: 2010,
 *         city: "Naples",
 *         publisher: "Oven Press",
 *       },
 *     ],
 *   }),
 *   sections: [{ children: [new Paragraph({ children: [new Citation("Bak10")] }), new Bibliography({ title: "References" })] }],
 * });
 * ```
 */
export const createBibliography = ({ style = CitationStyle.APA, sources }: DocumentBibliographyOptions): DocumentBibliography => {
    const definition = STYLE_DEFINITIONS[style];
    if (!definition) {
        throw new Error(`"${style}" isn't a style of citation. Give one of CitationStyle's, such as CitationStyle.APA`);
    }
    return { sources: new BibliographySources(definition, sources) };
};
