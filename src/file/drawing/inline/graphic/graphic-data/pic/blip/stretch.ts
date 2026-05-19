/**
 * Stretch fill module for blip fills.
 *
 * This module defines how images are stretched to fill shapes.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a fill rectangle for stretch fill mode.
 *
 * This element specifies the rectangular area of the shape to which
 * the blip fill should be stretched.
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
 */
class FillRectangle extends XmlComponent {
    public constructor() {
        super("a:fillRect");
    }
}

/**
 * Represents a stretch fill mode for blip fills.
 *
 * This element specifies that the blip (image) should be stretched to fill
 * the entire shape. The stretch fill is one of the fill mode properties
 * that determines how an image is applied to a shape.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_StretchInfoProperties">
 *   <xsd:sequence>
 *     <xsd:element name="fillRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const stretch = new Stretch();
 * ```
 */
export class Stretch extends XmlComponent {
    public constructor() {
        super("a:stretch");
        this.root.push(new FillRectangle());
    }
}
