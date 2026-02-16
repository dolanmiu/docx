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
import { Run } from "@file/paragraph/run";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

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
 * Reference: http://officeopenxml.com/WPfootnotes.php
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
 * ```
 */
export class FootnoteReferenceRun extends Run {
    /**
     * Creates a new footnote reference run.
     *
     * @param id - Unique identifier linking to the footnote content
     */
    public constructor(id: number) {
        super({ style: "FootnoteReference" });

        this.root.push(new FootnoteReference(id));
    }
}
