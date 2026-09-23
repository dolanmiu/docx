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
import type { PresetShapeType } from "../../../wps/preset-shape/preset-shape-type";

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
 * const rectangle = new PresetGeometry();
 * const roundedRectangle = new PresetGeometry({ type: "roundRect", adjustments: { adj: 25000 } });
 * ```
 */
export class PresetGeometry extends XmlComponent {
    public constructor({
        type = "rect",
        adjustments,
    }: {
        /** The preset shape. Defaults to a rectangle. */
        readonly type?: PresetShapeType;
        /** Raw shape guide values, keyed by guide name (e.g. `{ adj: 25000 }`). */
        readonly adjustments?: Readonly<Record<string, number>>;
    } = {}) {
        super("a:prstGeom");

        this.root.push(
            new PresetGeometryAttributes({
                prst: type,
            }),
        );

        this.root.push(new AdjustmentValues(adjustments));
    }
}
