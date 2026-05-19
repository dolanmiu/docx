/**
 * Footnotes wrapper module for WordprocessingML documents.
 *
 * This module provides a wrapper for managing footnotes and their
 * associated relationships in a document.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import type { IViewWrapper } from "./document-wrapper";
import { FootNotes } from "./footnotes/footnotes";
import { Relationships } from "./relationships";

/**
 * Wrapper class for managing footnotes in a document.
 *
 * Encapsulates the footnotes collection and its relationships,
 * implementing the IViewWrapper interface for consistent access.
 *
 * @example
 * ```typescript
 * const wrapper = new FootnotesWrapper();
 * const footnotes = wrapper.View;
 * const relationships = wrapper.Relationships;
 * ```
 */
export class FootnotesWrapper implements IViewWrapper {
    private readonly footnotess: FootNotes;
    private readonly relationships: Relationships;

    public constructor() {
        this.footnotess = new FootNotes();
        this.relationships = new Relationships();
    }

    public get View(): FootNotes {
        return this.footnotess;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
