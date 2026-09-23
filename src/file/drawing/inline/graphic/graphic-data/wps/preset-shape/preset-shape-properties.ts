/**
 * Shape properties (`wps:spPr`) for preset shapes.
 *
 * @module
 */
import type { IMediaDataTransformation } from "@file/media";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import type { PresetShapeType } from "./preset-shape-type";
import { type ShapeFill, createShapeFill } from "./shape-fill";
import { type ShapeLine, createShapeLine } from "./shape-line";
import { Form } from "../../pic/shape-properties/form";
import { PresetGeometry } from "../../pic/shape-properties/preset-geometry/preset-geometry";

/**
 * The geometry of a preset shape.
 */
export type PresetShapeGeometry = {
    readonly type: PresetShapeType;
    /** Raw shape guide values, keyed by guide name (e.g. `{ adj: 25000 }`) */
    readonly adjustments?: Readonly<Record<string, number>>;
};

export type PresetShapePropertiesOptions = {
    readonly transformation: IMediaDataTransformation;
    readonly geometry: PresetShapeGeometry;
    readonly fill?: ShapeFill;
    readonly line?: ShapeLine;
};

/**
 * Creates the `wps:spPr` element for a preset shape: transform, geometry, fill and line, in schema order.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ShapeProperties">
 *   <xsd:sequence>
 *     <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="0"/>
 *     <xsd:group ref="EG_Geometry" minOccurs="0"/>
 *     <xsd:group ref="EG_FillProperties" minOccurs="0"/>
 *     <xsd:element name="ln" type="CT_LineProperties" minOccurs="0"/>
 *     ...
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createPresetShapeProperties = ({ transformation, geometry, fill, line }: PresetShapePropertiesOptions): XmlComponent =>
    new BuilderElement({
        name: "wps:spPr",
        children: [
            new Form(transformation),
            new PresetGeometry({ type: geometry.type, adjustments: geometry.adjustments }),
            createShapeFill(fill),
            createShapeLine(line),
        ],
    });
