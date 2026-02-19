/**
 * Footnote continuation separator run module for WordprocessingML documents.
 *
 * This module provides the run containing the continuation separator element.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { Run } from "@file/paragraph";

import { ContinuationSeperator } from "./continuation-seperator";

/**
 * Represents a footnote continuation separator run in WordprocessingML.
 *
 * ContinuationSeperatorRun creates a run containing the continuation
 * separator element that defines the line used when footnotes continue
 * from a previous page.
 *
 * @internal
 */
export class ContinuationSeperatorRun extends Run {
    public constructor() {
        super({});

        this.root.push(new ContinuationSeperator());
    }
}
