/**
 * Adjustment values module for preset geometries.
 *
 * This module provides adjustment value lists that can modify the appearance
 * of preset shape geometries.
 *
 * Reference: http://officeopenxml.com/drwSp-prstGeom.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a list of adjustment values for preset geometry.
 *
 * This element contains a list of shape adjust values that modify the
 * appearance of a preset geometric shape. When empty, default values are used.
 *
 * Reference: http://officeopenxml.com/drwSp-prstGeom.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_GeomGuideList">
 *   <xsd:sequence>
 *     <xsd:element name="gd" type="CT_GeomGuide" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const avLst = new AdjustmentValues();
 * ```
 */
export class AdjustmentValues extends XmlComponent {
    public constructor() {
        super("a:avLst");
    }
}
