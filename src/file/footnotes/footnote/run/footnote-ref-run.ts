/**
 * Footnote Reference Run module for WordprocessingML documents.
 *
 * This module provides the footnote reference marker that appears
 * at the start of a footnote.
 *
 * @module
 */
import { Run } from "@file/paragraph";

import { FootnoteRef } from "./footnote-ref";

/**
 * Represents a footnote reference run in a WordprocessingML document.
 *
 * FootnoteRefRun displays the footnote reference mark (usually a superscript
 * number) at the beginning of the footnote content.
 *
 * @internal
 */
export class FootnoteRefRun extends Run {
    public constructor() {
        super({
            style: "FootnoteReference",
        });

        this.root.push(new FootnoteRef());
    }
}
