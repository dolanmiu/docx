/**
 * Shape properties (`wps:spPr`) for preset shapes.
 *
 * @module
 */
import { BuilderElement, type IMediaDataTransformation, type XmlComponent } from "docx";

import { type PresetShapeType, getOoxmlShapeName } from "./preset-shape-type";
import { createShapeGuides } from "./shape-adjustments";
import { type ShapeEffects, createShapeEffects } from "./shape-effects";
import { type ShapeFill, createShapeFill } from "./shape-fill";
import { type ShapeLine, createShapeLine } from "./shape-line";
import { type CustomGeometryOptions, createCustomGeometry, createCustomGeometryData } from "../custom-geometry/custom-geometry";
import { createPresetGeometry, createTransform } from "../drawing/drawing-parts";

/**
 * The geometry of a shape: a preset shape with its adjustments, or a custom shape drawn from SVG path data.
 */
export type PresetShapeGeometry =
    | {
          readonly type: PresetShapeType;
          /** The shape's adjustments, such as `{ cornerRadius: 25 }` for a `"roundedRectangle"` */
          readonly adjustments?: Readonly<Record<string, number | undefined>>;
      }
    | (CustomGeometryOptions & {
          /** A custom shape, drawn from SVG path data scaled to fill the shape */
          readonly type: "custom";
      });

export type PresetShapePropertiesOptions = {
    readonly transformation: IMediaDataTransformation;
    readonly geometry: PresetShapeGeometry;
    readonly fill?: ShapeFill;
    readonly line?: ShapeLine;
    readonly effects?: ShapeEffects;
};

/**
 * Creates the `wps:spPr` element for a preset shape: transform, geometry, fill, line and effects, in schema order.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ShapeProperties">
 *   <xsd:sequence>
 *     <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="0"/>
 *     <xsd:group ref="EG_Geometry" minOccurs="0"/>
 *     <xsd:group ref="EG_FillProperties" minOccurs="0"/>
 *     <xsd:element name="ln" type="CT_LineProperties" minOccurs="0"/>
 *     <xsd:group ref="EG_EffectProperties" minOccurs="0"/>
 *     ...
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createPresetShapeProperties = ({
    transformation,
    geometry,
    fill,
    line,
    effects,
}: PresetShapePropertiesOptions): XmlComponent =>
    new BuilderElement({
        name: "wps:spPr",
        children: [
            createTransform(transformation),
            geometry.type === "custom"
                ? createCustomGeometry(createCustomGeometryData(geometry, transformation.emus.x, transformation.emus.y))
                : createPresetGeometry(getOoxmlShapeName(geometry.type), createShapeGuides(geometry.type, geometry.adjustments)),
            createShapeFill(fill),
            createShapeLine(line),
            ...(effects ? [createShapeEffects(effects)] : []),
        ],
    });
