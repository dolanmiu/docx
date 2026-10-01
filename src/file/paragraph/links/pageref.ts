/**
 * Page reference module for WordprocessingML documents.
 *
 * This module provides page reference elements for cross-referencing
 * the page number of a bookmarked location.
 *
 * Reference: https://www.ecma-international.org/publications/standards/Ecma-376.htm (Part 1, Page 1234)
 *
 * @module
 */
import { createBeginDirtyWithoutPageNumbers, createEnd, createSeparate } from "@file/paragraph/run/field";

import { Run } from "../run";
import { PageReferenceFieldInstruction } from "./pageref-field-instruction";

/**
 * Options for page reference fields.
 *
 * @see {@link PageReference}
 */
export type IPageReferenceOptions = {
    /**
     * \h option - Creates a hyperlink to the bookmarked paragraph.
     */
    readonly hyperlink?: boolean;
    /**
     * \p option - Causes the field to display its position relative to the source
     *  bookmark. If the PAGEREF field is on the same page as the
     *  bookmark, it omits "on page #" and returns "above" or "below"
     *  only. If the PAGEREF field is not on the same page as the
     *  bookmark, the string "on page #" is used.
     */
    readonly useRelativePosition?: boolean;
};

/**
 * Represents a page reference (PAGEREF) field.
 *
 * The PAGEREF field displays the page number of the page containing
 * the specified bookmark, useful for cross-references like "see page 5".
 *
 * It is written dirty, so Word fills in the page number when it opens the document, after asking to. When the
 * document is given `pageNumbers`, it is written clean, with the number they work out, or blank when they couldn't,
 * and Word doesn't ask.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Simple page reference
 * new PageReference("figure_1_bookmark");
 *
 * // With hyperlink
 * new PageReference("table_2", { hyperlink: true });
 *
 * // With relative position (e.g., "above" or "on page 5")
 * new PageReference("section_3", {
 *   hyperlink: true,
 *   useRelativePosition: true,
 * });
 * ```
 */
export class PageReference extends Run {
    public constructor(bookmarkId: string, options: IPageReferenceOptions = {}) {
        super({
            children: [
                createBeginDirtyWithoutPageNumbers(),
                new PageReferenceFieldInstruction(bookmarkId, options),
                createSeparate(),
                createEnd(),
            ],
        });
    }
}
