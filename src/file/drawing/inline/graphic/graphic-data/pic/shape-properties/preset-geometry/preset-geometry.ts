/**
 * Preset geometry module for DrawingML shapes.
 *
 * This module provides predefined shape geometries that can be applied
 * to pictures and shapes without requiring custom path definitions.
 *
 * Reference: http://officeopenxml.com/drwSp-prstGeom.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { AdjustmentValues } from "./adjustment-values/adjustment-values";
import { PresetGeometryAttributes } from "./preset-geometry-attributes";

/**
 * Represents a preset geometry for a DrawingML shape.
 *
 * This element specifies when a preset geometric shape should be used instead
 * of a custom geometry. It includes a shape preset identifier and optional
 * adjustment values that modify the base shape.
 *
 * Reference: http://officeopenxml.com/drwSp-prstGeom.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PresetGeometry2D">
 *   <xsd:sequence>
 *     <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="prst" type="ST_ShapeType" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const geometry = new PresetGeometry();
 * ```
 */
export class PresetGeometry extends XmlComponent {
    public constructor() {
        super("a:prstGeom");

        this.root.push(
            new PresetGeometryAttributes({
                prst: "rect",
            }),
        );

        this.root.push(new AdjustmentValues());
    }
}
