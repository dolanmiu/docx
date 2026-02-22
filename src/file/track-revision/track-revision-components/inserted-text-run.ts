/**
 * Inserted text run module for track changes.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { type IRunOptions, TextRun } from "../../index";
import { ChangeAttributes, type IChangedAttributesProperties } from "../track-revision";

/**
 * Options for creating an inserted text run.
 *
 * Combines run formatting options with track change metadata.
 *
 * @property id - Unique identifier for this insertion
 * @property author - Name of the author who inserted the text
 * @property date - Date and time when the insertion was made (ISO 8601 format)
 */
type IInsertedRunOptions = IChangedAttributesProperties & IRunOptions;

/**
 * Represents an inserted text run in a tracked changes document.
 *
 * An insertion marks text that has been added to the document as part of
 * revision tracking. It wraps a standard text run with metadata about who
 * made the insertion and when.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="ins" type="CT_RunTrackChange" minOccurs="0"/>
 *
 * <xsd:complexType name="CT_RunTrackChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_TrackChange">
 *       <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *         <xsd:group ref="EG_ContentRunContent"/>
 *         <xsd:group ref="m:EG_OMathMathElements"/>
 *       </xsd:choice>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create an inserted text run
 * new InsertedTextRun({
 *   id: 1,
 *   author: "John Doe",
 *   date: "2024-01-15T10:30:00Z",
 *   text: "This text was added",
 *   bold: true
 * });
 * ```
 */
export class InsertedTextRun extends XmlComponent {
    public constructor(options: IInsertedRunOptions) {
        super("w:ins");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.addChildElement(new TextRun(options as IRunOptions));
    }
}
