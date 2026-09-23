/**
 * Fills for preset shapes: none, solid or gradient.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createShapeColor, percentageValue } from "./shape-color";
import { createNoFill } from "../../pic/shape-properties/outline/no-fill";

/**
 * A colour stop in a gradient fill.
 *
 * @publicApi
 */
export type GradientStop = {
    /** Where the stop sits along the gradient, from 0 to 100 */
    readonly position: number;
    /** A 6-digit hex colour such as `"FF0000"` */
    readonly color: string;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * A solid colour fill.
 *
 * @publicApi
 */
export type SolidShapeFill = {
    readonly type?: "solid";
    /** A 6-digit hex colour such as `"FF0000"` */
    readonly color: string;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * A gradient fill. It is linear unless `path` is set.
 *
 * @publicApi
 */
export type GradientShapeFill = {
    readonly type: "gradient";
    /** At least two colour stops */
    readonly stops: readonly GradientStop[];
    /** Direction of a linear gradient in degrees, clockwise from left-to-right. Default is 0 */
    readonly angle?: number;
    /** Makes the gradient radiate from the centre: in a circle, a rectangle, or following the shape's outline */
    readonly path?: "circle" | "rect" | "shape";
};

/**
 * How a shape is filled: a hex colour, `"none"`, a solid fill or a gradient fill.
 *
 * @publicApi
 */
export type ShapeFill = string | SolidShapeFill | GradientShapeFill;

// <xsd:complexType name="CT_GradientStop">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="pos" type="ST_PositiveFixedPercentage" use="required"/>
// </xsd:complexType>
const createGradientStop = ({ position, color, transparency }: GradientStop): XmlComponent =>
    new BuilderElement<{ readonly position: number }>({
        name: "a:gs",
        attributes: {
            position: { key: "pos", value: Math.round(position * 1000) },
        },
        children: [createShapeColor(color, transparency)],
    });

const createLinearShade = (angle: number): XmlComponent =>
    new BuilderElement<{ readonly angle: number }>({
        name: "a:lin",
        attributes: {
            // ST_PositiveFixedAngle: 60000ths of a degree, from 0 up to (not including) 360 degrees
            angle: { key: "ang", value: Math.round((((angle % 360) + 360) % 360) * 60000) % 21600000 },
        },
    });

const createPathShade = (path: "circle" | "rect" | "shape"): XmlComponent =>
    new BuilderElement<{ readonly path: string }>({
        name: "a:path",
        attributes: {
            path: { key: "path", value: path },
        },
        children: [
            // Focus the gradient on the centre of the shape
            new BuilderElement<{ readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }>({
                name: "a:fillToRect",
                attributes: {
                    left: { key: "l", value: 50000 },
                    top: { key: "t", value: 50000 },
                    right: { key: "r", value: 50000 },
                    bottom: { key: "b", value: 50000 },
                },
            }),
        ],
    });

/**
 * Creates an `a:gradFill` element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_GradientFillProperties">
 *   <xsd:sequence>
 *     <xsd:element name="gsLst" type="CT_GradientStopList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_ShadeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tileRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
 *   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @throws If there are fewer than two stops or a stop position is outside 0 to 100
 */
const createGradientFill = ({ stops, angle = 0, path }: GradientShapeFill): XmlComponent => {
    if (stops.length < 2) {
        throw new Error(`Invalid gradient fill. Expected at least 2 stops, got ${stops.length}`);
    }

    const sortedStops = [...stops]
        .map((stop) => ({ ...stop, position: percentageValue(stop.position, "gradient stop position") }))
        .sort((a, b) => a.position - b.position);

    return new BuilderElement<{ readonly rotateWithShape: boolean }>({
        name: "a:gradFill",
        attributes: {
            rotateWithShape: { key: "rotWithShape", value: true },
        },
        children: [
            new BuilderElement({
                name: "a:gsLst",
                children: sortedStops.map(createGradientStop),
            }),
            path ? createPathShade(path) : createLinearShade(angle),
        ],
    });
};

/**
 * Creates the fill element for a preset shape.
 *
 * - `undefined` or `"none"` writes `<a:noFill/>`
 * - A hex colour or a solid fill writes `<a:solidFill>`
 * - A gradient fill writes `<a:gradFill>`
 */
export const createShapeFill = (fill: ShapeFill = "none"): XmlComponent => {
    if (fill === "none") {
        return createNoFill();
    }

    if (typeof fill === "string") {
        return new BuilderElement({ name: "a:solidFill", children: [createShapeColor(fill)] });
    }

    if (fill.type === "gradient") {
        return createGradientFill(fill);
    }

    return new BuilderElement({ name: "a:solidFill", children: [createShapeColor(fill.color, fill.transparency)] });
};
