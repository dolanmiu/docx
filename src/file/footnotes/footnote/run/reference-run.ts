/**
 * Footnote reference run module for WordprocessingML documents.
 *
 * This module provides the footnote reference marker that appears in the
 * main document text to indicate a footnote.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import type { Paragraph } from "@file/paragraph";
import { Run } from "@file/paragraph/run";
import { type IContext, type IXmlableObject, XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * A footnote's or endnote's content: its paragraphs.
 *
 * A {@link FootnoteReferenceRun} or {@link EndnoteReferenceRun} can be given its note's content, rather than the id of
 * one of the document's `footnotes` or `endnotes`, for a note of its own. The note is added to the document's notes,
 * with an id none of them has, when the run is written in the document's body.
 */
export type NoteContent = {
    /** The note's paragraphs */
    readonly children: readonly Paragraph[];
};

/**
 * Represents the attributes for a footnote reference element.
 *
 * @internal
 */
export class FootNoteReferenceRunAttributes extends XmlAttributeComponent<{
    /** Unique identifier linking to the footnote */
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

/**
 * Represents a footnote reference element in WordprocessingML.
 *
 * FootnoteReference creates the link between the main document text
 * and the footnote content by using a unique identifier.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FtnEdnRef">
 *   <xsd:attribute name="customMarkFollows" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="id" use="required" type="ST_DecimalNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export class FootnoteReference extends XmlComponent {
    public constructor(id: number) {
        super("w:footnoteReference");

        this.root.push(
            new FootNoteReferenceRunAttributes({
                id: id,
            }),
        );
    }
}

/**
 * Represents a footnote reference run in a WordprocessingML document.
 *
 * FootnoteReferenceRun creates a run containing a footnote reference marker
 * (typically a superscript number) that appears in the main document text.
 * Clicking this marker navigates to the corresponding footnote content.
 *
 * It refers to one of the document's `footnotes` by its id, or is given its footnote's content, for a footnote of its
 * own, which is added to the document's footnotes when the run is written. Content made before the document it goes
 * in, such as by a function that makes paragraphs, then brings its footnotes with it.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Add a footnote reference in a paragraph
 * new Paragraph({
 *   children: [
 *     new TextRun("This text has a footnote"),
 *     new FootnoteReferenceRun(1),
 *   ],
 * });
 *
 * // Or with the footnote's content
 * new Paragraph({
 *   children: [
 *     new TextRun("This text has a footnote of its own"),
 *     new FootnoteReferenceRun({ children: [new Paragraph("The footnote.")] }),
 *   ],
 * });
 * ```
 */
export class FootnoteReferenceRun extends Run {
    private readonly footnote?: NoteContent;

    /**
     * Creates a new footnote reference run.
     *
     * @param footnote - The id of one of the document's `footnotes`, or the footnote's content, for a footnote of the
     * run's own. Word has footnotes only in a document's body, so a run with its footnote's content is left out of
     * headers, footers, comments and notes
     */
    public constructor(footnote: number | NoteContent) {
        super({ style: "FootnoteReference" });

        if (typeof footnote === "number") {
            this.root.push(new FootnoteReference(footnote));
        } else {
            this.footnote = footnote;
        }
    }

    /**
     * Formats the run, with its own footnote added to the document's footnotes, and referred to by the id it has there.
     */
    public override prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.footnote === undefined) {
            return super.prepForXml(context);
        }
        const id = context.file?.FootNotes.View.idOf(this, this.footnote, context);
        if (id === undefined) {
            return undefined;
        }
        // The reference is only in the run while it is written, as the id is the footnote's in the document it is in
        this.root.push(new FootnoteReference(id));
        try {
            return super.prepForXml(context);
        } finally {
            this.root.pop();
        }
    }
}
