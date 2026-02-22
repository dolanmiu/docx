/**
 * Deleted text run module for track changes.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { DeletedNumberOfPages, DeletedNumberOfPagesSection, DeletedPage } from "./deleted-page-number";
import { DeletedText } from "./deleted-text";
import { createBreak } from "../../paragraph/run/break";
import { createBegin, createEnd, createSeparate } from "../../paragraph/run/field";
import { RunProperties } from "../../paragraph/run/properties";
import { type IRunOptions, PageNumber } from "../../paragraph/run/run";
import { ChangeAttributes, type IChangedAttributesProperties } from "../track-revision";

/**
 * Options for creating a deleted text run.
 *
 * Combines run formatting options with track change metadata.
 *
 * @property id - Unique identifier for this deletion
 * @property author - Name of the author who deleted the text
 * @property date - Date and time when the deletion was made (ISO 8601 format)
 */
type IDeletedRunOptions = IRunOptions & IChangedAttributesProperties;

/**
 * Represents a deleted text run in a tracked changes document.
 *
 * A deletion marks text that has been removed from the document as part of
 * revision tracking. It wraps a text run with metadata about who made the
 * deletion and when. Deleted text is typically shown with strikethrough
 * formatting in applications that support track changes.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="del" type="CT_RunTrackChange" minOccurs="0"/>
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
 * // Create a deleted text run
 * new DeletedTextRun({
 *   id: 2,
 *   author: "Jane Smith",
 *   date: "2024-01-15T11:00:00Z",
 *   text: "This text was removed",
 *   italics: true
 * });
 *
 * // Deleted run with page number field
 * new DeletedTextRun({
 *   id: 3,
 *   author: "John Doe",
 *   date: "2024-01-15T12:00:00Z",
 *   children: [PageNumber.CURRENT]
 * });
 * ```
 */
export class DeletedTextRun extends XmlComponent {
    protected readonly deletedTextRunWrapper: DeletedTextRunWrapper;

    public constructor(options: IDeletedRunOptions) {
        super("w:del");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.deletedTextRunWrapper = new DeletedTextRunWrapper(options);
        this.addChildElement(this.deletedTextRunWrapper);
    }
}

/**
 * Internal wrapper for the run element within a deletion.
 *
 * Wraps the actual run content (text, fields, etc.) within a w:r element
 * that appears inside the w:del element. Handles special cases like page
 * numbers and other field codes using deleted-specific element types.
 *
 * @internal
 */
class DeletedTextRunWrapper extends XmlComponent {
    public constructor(options: IRunOptions) {
        super("w:r");
        this.root.push(new RunProperties(options));

        if (options.children) {
            for (const child of options.children) {
                if (typeof child === "string") {
                    switch (child) {
                        case PageNumber.CURRENT:
                            this.root.push(createBegin());
                            this.root.push(new DeletedPage());
                            this.root.push(createSeparate());
                            this.root.push(createEnd());
                            break;
                        case PageNumber.TOTAL_PAGES:
                            this.root.push(createBegin());
                            this.root.push(new DeletedNumberOfPages());
                            this.root.push(createSeparate());
                            this.root.push(createEnd());
                            break;
                        case PageNumber.TOTAL_PAGES_IN_SECTION:
                            this.root.push(createBegin());
                            this.root.push(new DeletedNumberOfPagesSection());
                            this.root.push(createSeparate());
                            this.root.push(createEnd());
                            break;
                        default:
                            this.root.push(new DeletedText(child));
                            break;
                    }
                    continue;
                }

                this.root.push(child);
            }
        } else if (options.text) {
            this.root.push(new DeletedText(options.text));
        }

        if (options.break) {
            for (let i = 0; i < options.break; i++) {
                this.root.splice(1, 0, createBreak());
            }
        }
    }
}
