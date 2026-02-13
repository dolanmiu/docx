/**
 * Track Revision module for WordprocessingML documents.
 *
 * This module provides support for tracking document revisions
 * (insertions, deletions, and formatting changes).
 *
 * Reference: http://officeopenxml.com/WPtrackRevisions.php
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Properties for a tracked change.
 *
 * @see {@link ChangeAttributes}
 */
export type IChangedAttributesProperties = {
    /** Unique identifier for this change */
    readonly id: number;
    /** Author who made the change */
    readonly author: string;
    /** Date/time when the change was made (ISO 8601 format) */
    readonly date: string;
};

/**
 * Attributes for a tracked change element.
 *
 * Used by elements like ins (insertion) and del (deletion) to
 * record who made a change and when.
 *
 * @internal
 */
export class ChangeAttributes extends XmlAttributeComponent<IChangedAttributesProperties> {
    protected readonly xmlKeys = {
        id: "w:id",
        author: "w:author",
        date: "w:date",
    };
}
