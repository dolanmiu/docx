/**
 * Page reference field instruction module for WordprocessingML documents.
 *
 * This module provides the field instruction element for page references,
 * which displays the page number of a bookmarked location.
 *
 * Reference: http://officeopenxml.com/WPfields.php
 *
 * @module
 */
import { SpaceType } from "@file/shared";
import { XmlComponent } from "@file/xml-components";

import { IPageReferenceOptions } from "./pageref";
import { TextAttributes } from "../run/text-attributes";

/**
 * Represents a PAGEREF field instruction.
 *
 * The PAGEREF field inserts the page number of the page containing
 * the specified bookmark. It can optionally create a hyperlink
 * and display relative positioning (e.g., "on the previous page").
 *
 * @example
 * ```typescript
 * // Basic page reference
 * new PageReferenceFieldInstruction("figure_1");
 *
 * // Page reference with hyperlink and relative position
 * new PageReferenceFieldInstruction("table_1", {
 *   hyperlink: true,
 *   useRelativePosition: true,
 * });
 * ```
 *
 * @internal
 */
export class PageReferenceFieldInstruction extends XmlComponent {
    public constructor(bookmarkId: string, options: IPageReferenceOptions = {}) {
        super("w:instrText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));

        let instruction = `PAGEREF ${bookmarkId}`;

        if (options.hyperlink) {
            instruction = `${instruction} \\h`;
        }
        if (options.useRelativePosition) {
            instruction = `${instruction} \\p`;
        }

        this.root.push(instruction);
    }
}
