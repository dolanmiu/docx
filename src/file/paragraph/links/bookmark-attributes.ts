/**
 * Bookmark attributes module for WordprocessingML documents.
 *
 * This module provides attribute components for bookmark start and end elements.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for the bookmark start element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Bookmark">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_BookmarkRange">
 *       <xsd:attribute name="name" type="s:ST_String" use="required"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_BookmarkRange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_MarkupRange">
 *       <xsd:attribute name="colFirst" type="ST_DecimalNumber" use="optional"/>
 *       <xsd:attribute name="colLast" type="ST_DecimalNumber" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Markup">
 *       <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_Markup">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 */
export class BookmarkStartAttributes extends XmlAttributeComponent<{
    /** Unique numeric identifier for the bookmark */
    readonly id: number;
    /** Name of the bookmark used for reference */
    readonly name: string;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
        name: "w:name",
    };
}

/**
 * Attributes for the bookmark end element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Markup">
 *       <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_Markup">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 */
export class BookmarkEndAttributes extends XmlAttributeComponent<{
    /** Unique numeric identifier matching the bookmark start */
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}
