/**
 * Source rectangle module for blip fills.
 *
 * This module defines the portion of an image to use when filling a shape.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a source rectangle for blip fills.
 *
 * This element specifies a portion of the blip (image) to use as the fill.
 * When not specified with attributes, it indicates the entire blip should be used.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RelativeRect">
 *   <xsd:attribute name="l" type="ST_Percentage" use="optional" default="0"/>
 *   <xsd:attribute name="t" type="ST_Percentage" use="optional" default="0"/>
 *   <xsd:attribute name="r" type="ST_Percentage" use="optional" default="0"/>
 *   <xsd:attribute name="b" type="ST_Percentage" use="optional" default="0"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const srcRect = new SourceRectangle();
 * ```
 */
export class SourceRectangle extends XmlComponent {
    public constructor() {
        super("a:srcRect");
    }
}
