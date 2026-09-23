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
import { BuilderElement, XmlComponent } from "@file/xml-components";

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
 * const rounded = new AdjustmentValues({ adj: 25000 }); // <a:gd name="adj" fmla="val 25000"/>
 * ```
 */
export class AdjustmentValues extends XmlComponent {
    public constructor(adjustments: Readonly<Record<string, number>> = {}) {
        super("a:avLst");

        for (const [name, value] of Object.entries(adjustments)) {
            this.root.push(
                new BuilderElement<{ readonly name: string; readonly formula: string }>({
                    name: "a:gd",
                    attributes: {
                        name: { key: "name", value: name },
                        formula: { key: "fmla", value: `val ${Math.round(value)}` },
                    },
                }),
            );
        }
    }
}
