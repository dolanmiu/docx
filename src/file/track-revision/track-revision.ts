/**
 * Track Revision module for WordprocessingML documents.
 *
 * This module provides support for tracking document revisions
 * (insertions, deletions, and formatting changes).
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Properties for a tracked change element.
 *
 * These properties identify the change and its author for revision tracking.
 *
 * @property id - Unique identifier for this change (must be unique within the document)
 * @property author - Name of the author who made the change
 * @property date - Date and time when the change was made (ISO 8601 format)
 */
export type IChangedAttributesProperties = {
    /** Unique identifier for this change (must be unique within the document) */
    readonly id: number;
    /** Name of the author who made the change */
    readonly author: string;
    /** Date and time when the change was made (ISO 8601 format) */
    readonly date: string;
};

/**
 * Attributes for a tracked change element.
 *
 * Represents the common attributes (id, author, date) that appear on track change
 * elements such as insertions (w:ins) and deletions (w:del). These attributes
 * are part of the CT_TrackChange complex type in OOXML.
 *
 * Reference: http://officeopenxml.com/WPtrackChanges.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TrackChange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Markup">
 *       <xsd:attribute name="author" type="s:ST_String" use="required"/>
 *       <xsd:attribute name="date" type="ST_DateTime" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_Markup">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
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
