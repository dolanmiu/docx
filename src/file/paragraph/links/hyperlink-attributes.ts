/**
 * Hyperlink attributes module for WordprocessingML documents.
 *
 * This module provides attribute components for hyperlink elements.
 *
 * Reference: http://officeopenxml.com/WPhyperlink.php
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Properties for hyperlink attributes.
 *
 * @property id - Relationship ID for external hyperlinks
 * @property anchor - Bookmark name for internal hyperlinks
 * @property history - Whether to add this link to the document's history
 */
export type IHyperlinkAttributesProperties = {
    /** Relationship ID for external hyperlinks */
    readonly id?: string;
    /** Bookmark name for internal hyperlinks */
    readonly anchor?: string;
    /** Whether to add this link to the document's history (1 for true, 0 for false) */
    readonly history: number;
};

/**
 * Attributes for the hyperlink element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="tgtFrame" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="tooltip" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="docLocation" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="anchor" type="s:ST_String" use="optional"/>
 *   <xsd:attribute ref="r:id"/>
 * </xsd:complexType>
 * ```
 */
export class HyperlinkAttributes extends XmlAttributeComponent<IHyperlinkAttributesProperties> {
    protected readonly xmlKeys = {
        id: "r:id",
        history: "w:history",
        anchor: "w:anchor",
    };
}
