/**
 * Custom shapes (`a:custGeom`): polygons and freeform paths drawn from SVG path data.
 *
 * The path is scaled so the box around it fills the shape, then written as DrawingML path commands.
 * Every corner and end of the path is a connection site, so connectors can attach to custom shapes.
 *
 * Reference: ECMA-376 Part 1, 20.1.9.8 custGeom (Custom Geometry)
 *
 * @module
 */
// cspell:ignore custGeom
import { BuilderElement, type XmlComponent } from "docx";

import { type EllipticalArc, type PathPoint, type PathSegment, getPathBounds, parseSvgPath, pointOnArc } from "./svg-path";
import type { ConnectionSite } from "../connector/connection-sites";

/**
 * A segment of a custom shape's path, in whole EMUs from the top-left corner of the shape.
 * Arc angles are in 60,000ths of a degree.
 */
export type CustomPathSegment =
    | { readonly type: "move"; readonly to: PathPoint }
    | { readonly type: "line"; readonly to: PathPoint }
    | { readonly type: "cubic"; readonly points: readonly [PathPoint, PathPoint, PathPoint] }
    | { readonly type: "quadratic"; readonly points: readonly [PathPoint, PathPoint] }
    | {
          readonly type: "arc";
          readonly widthRadius: number;
          readonly heightRadius: number;
          readonly startAngle: number;
          readonly swingAngle: number;
      }
    | { readonly type: "close" };

/**
 * A custom shape's path, scaled to the shape, and its connection sites.
 */
export type CustomGeometry = {
    /** The shape's width in EMUs, which the path is drawn in */
    readonly width: number;
    /** The shape's height in EMUs, which the path is drawn in */
    readonly height: number;
    readonly segments: readonly CustomPathSegment[];
    /** The corners and ends of the path, in the order they are drawn */
    readonly sites: readonly ConnectionSite[];
};

const ANGLE_UNITS_PER_DEGREE = 60000;
const QUARTER_TURN = Math.PI / 2;

/**
 * How the path is scaled to the shape: the top-left corner of the box around the path, and how much it is stretched.
 */
type Scale = {
    readonly left: number;
    readonly top: number;
    readonly x: number;
    readonly y: number;
};

const toShape = ({ left, top, x, y }: Scale, point: PathPoint): PathPoint => ({ x: (point.x - left) * x, y: (point.y - top) * y });

const round = ({ x, y }: PathPoint): PathPoint => ({ x: Math.round(x), y: Math.round(y) });

const degrees = (radians: number): number => (radians * 180) / Math.PI;

const isMultipleOf = (value: number, step: number): boolean => {
    const remainder = Math.abs(value % step);
    return remainder < 1e-9 || step - remainder < 1e-9;
};

/**
 * Splits an arc into cubic Bézier curves of at most a quarter turn each, for arcs DrawingML can't draw directly.
 */
const arcToCubics = (arc: EllipticalArc, scale: Scale): readonly CustomPathSegment[] => {
    const { radiusX, radiusY, rotation, startAngle, sweepAngle } = arc;
    const count = Math.ceil(Math.abs(sweepAngle) / QUARTER_TURN - 1e-9);
    const step = sweepAngle / count;
    // How far along the tangent the control points go for a curve this long
    const handle = (4 / 3) * Math.tan(step / 4);
    const tangent = (angle: number): PathPoint => ({
        x: -radiusX * Math.sin(angle) * Math.cos(rotation) - radiusY * Math.cos(angle) * Math.sin(rotation),
        y: -radiusX * Math.sin(angle) * Math.sin(rotation) + radiusY * Math.cos(angle) * Math.cos(rotation),
    });

    return Array.from({ length: count }, (_, index) => {
        const from = startAngle + step * index;
        const to = from + step;
        const start = pointOnArc(arc, from);
        const end = pointOnArc(arc, to);
        const startTangent = tangent(from);
        const endTangent = tangent(to);
        return {
            type: "cubic",
            points: [
                round(toShape(scale, { x: start.x + handle * startTangent.x, y: start.y + handle * startTangent.y })),
                round(toShape(scale, { x: end.x - handle * endTangent.x, y: end.y - handle * endTangent.y })),
                round(toShape(scale, end)),
            ],
        } as const;
    });
};

/**
 * Converts an arc to DrawingML. An arc of an ellipse that is upright once scaled to the shape is written as an `arcTo`,
 * whose angles are the directions of its ends from the ellipse's centre. Other arcs are drawn with Bézier curves.
 */
const convertArc = (to: PathPoint, arc: EllipticalArc, scale: Scale): readonly CustomPathSegment[] => {
    if (scale.x === 0 || scale.y === 0) {
        return [{ type: "line", to: round(toShape(scale, to)) }];
    }

    const isCircle = Math.abs(arc.radiusX - arc.radiusY) < 1e-9 && Math.abs(scale.x - scale.y) < 1e-9;
    if (!isCircle && !isMultipleOf(arc.rotation, QUARTER_TURN)) {
        return arcToCubics(arc, scale);
    }

    // Turning an upright ellipse by quarter turns moves the angles round by the turn, and swaps the radii for odd quarter turns
    const turned = !isCircle && !isMultipleOf(arc.rotation, Math.PI);
    const widthRadius = (turned ? arc.radiusY : arc.radiusX) * scale.x;
    const heightRadius = (turned ? arc.radiusX : arc.radiusY) * scale.y;
    // The direction of the point at an angle round the ellipse. It is within a quarter turn of the angle
    const direction = (angle: number): number => {
        const difference = Math.atan2(heightRadius * Math.sin(angle), widthRadius * Math.cos(angle)) - angle;
        return angle + difference - 2 * Math.PI * Math.round(difference / (2 * Math.PI));
    };
    const start = direction(arc.startAngle + arc.rotation);
    const end = direction(arc.startAngle + arc.rotation + arc.sweepAngle);

    return [
        {
            type: "arc",
            widthRadius: Math.round(widthRadius),
            heightRadius: Math.round(heightRadius),
            startAngle: Math.round((((degrees(start) % 360) + 360) % 360) * ANGLE_UNITS_PER_DEGREE),
            swingAngle: Math.round(degrees(end - start) * ANGLE_UNITS_PER_DEGREE),
        },
    ];
};

const convertSegment = (segment: PathSegment, scale: Scale): readonly CustomPathSegment[] => {
    switch (segment.type) {
        case "move":
        case "line":
            return [{ type: segment.type, to: round(toShape(scale, segment.to)) }];
        case "cubic":
            return [
                {
                    type: "cubic",
                    points: [
                        round(toShape(scale, segment.control1)),
                        round(toShape(scale, segment.control2)),
                        round(toShape(scale, segment.to)),
                    ],
                },
            ];
        case "quadratic":
            return [{ type: "quadratic", points: [round(toShape(scale, segment.control)), round(toShape(scale, segment.to))] }];
        case "arc":
            return convertArc(segment.to, segment.arc, scale);
        default:
            return [segment];
    }
};

/**
 * The direction, right (0), down (90), left (180) or up (270), a point is furthest from the middle of a box in,
 * measured as a share of the box's width and height. A point as far across as up or down is taken to be up or down.
 */
export const outwardAngle = (x: number, y: number, width: number, height: number): number => {
    const across = width === 0 ? 0 : (x - width / 2) / width;
    const down = height === 0 ? 0 : (y - height / 2) / height;
    if (Math.abs(across) > Math.abs(down)) {
        return across > 0 ? 0 : 180;
    }
    return down < 0 ? 270 : across === 0 && down === 0 ? 0 : 90;
};

/**
 * The corners and ends of a path: where each of its segments ends. A connector leaves each one in the direction,
 * right, down, left or up, that it is furthest from the middle of the shape in.
 */
const findSites = (segments: readonly PathSegment[], scale: Scale, width: number, height: number): readonly ConnectionSite[] => {
    const ends = segments.flatMap((segment) => (segment.type === "close" ? [] : [round(toShape(scale, segment.to))]));
    const unique = ends.filter((point, index) => ends.findIndex(({ x, y }) => x === point.x && y === point.y) === index);
    return unique.map(({ x, y }) => ({ x, y, angle: outwardAngle(x, y, width, height) }));
};

/**
 * Reads SVG path data and scales it to a shape: the box around the path is stretched to fill the shape's box.
 *
 * @param path - SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"`, in any units
 * @param width - The shape's width in EMUs
 * @param height - The shape's height in EMUs
 * @throws If the path is not valid SVG path data
 */
export const createCustomGeometryPath = (path: string, width: number, height: number): CustomGeometry => {
    const segments = parseSvgPath(path);
    const bounds = getPathBounds(segments);
    const pathWidth = bounds.right - bounds.left;
    const pathHeight = bounds.bottom - bounds.top;
    const x = pathWidth > 0 ? width / pathWidth : 0;
    const y = pathHeight > 0 ? height / pathHeight : 0;
    const scale: Scale = { left: bounds.left, top: bounds.top, x, y };

    return {
        width,
        height,
        segments: segments.flatMap((segment) => convertSegment(segment, scale)),
        sites: findSites(segments, scale, width, height),
    };
};

const createPoint = ({ x, y }: PathPoint): XmlComponent =>
    new BuilderElement<PathPoint>({
        name: "a:pt",
        attributes: {
            x: { key: "x", value: x },
            y: { key: "y", value: y },
        },
    });

const createPathSegment = (segment: CustomPathSegment): XmlComponent => {
    switch (segment.type) {
        case "move":
            return new BuilderElement({ name: "a:moveTo", children: [createPoint(segment.to)] });
        case "line":
            return new BuilderElement({ name: "a:lnTo", children: [createPoint(segment.to)] });
        case "cubic":
            return new BuilderElement({ name: "a:cubicBezTo", children: segment.points.map(createPoint) });
        case "quadratic":
            return new BuilderElement({ name: "a:quadBezTo", children: segment.points.map(createPoint) });
        case "arc":
            return new BuilderElement<Omit<Extract<CustomPathSegment, { readonly type: "arc" }>, "type">>({
                name: "a:arcTo",
                attributes: {
                    widthRadius: { key: "wR", value: segment.widthRadius },
                    heightRadius: { key: "hR", value: segment.heightRadius },
                    startAngle: { key: "stAng", value: segment.startAngle },
                    swingAngle: { key: "swAng", value: segment.swingAngle },
                },
            });
        default:
            return new BuilderElement({ name: "a:close" });
    }
};

// <xsd:complexType name="CT_ConnectionSite">
//     <xsd:sequence>
//         <xsd:element name="pos" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="ang" type="ST_AdjAngle" use="required"/>
// </xsd:complexType>
const createConnectionSite = ({ x, y, angle }: ConnectionSite): XmlComponent =>
    new BuilderElement<{ readonly angle: number }>({
        name: "a:cxn",
        attributes: { angle: { key: "ang", value: Math.round(angle * ANGLE_UNITS_PER_DEGREE) } },
        children: [
            new BuilderElement<PathPoint>({
                name: "a:pos",
                attributes: { x: { key: "x", value: x }, y: { key: "y", value: y } },
            }),
        ],
    });

/**
 * Creates an `a:custGeom` element for a custom shape.
 *
 * The text in the shape uses the whole of its box (`a:rect`).
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_CustomGeometry2D">
 *   <xsd:sequence>
 *     <xsd:element name="avLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="gdLst" type="CT_GeomGuideList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="ahLst" type="CT_AdjustHandleList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="cxnLst" type="CT_ConnectionSiteList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="rect" type="CT_GeomRect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="pathLst" type="CT_Path2DList" minOccurs="1" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createCustomGeometry = ({ width, height, segments, sites }: CustomGeometry): XmlComponent =>
    new BuilderElement({
        name: "a:custGeom",
        children: [
            new BuilderElement({ name: "a:avLst" }),
            new BuilderElement({ name: "a:gdLst" }),
            new BuilderElement({ name: "a:ahLst" }),
            new BuilderElement({ name: "a:cxnLst", children: sites.map(createConnectionSite) }),
            new BuilderElement<{ readonly left: string; readonly top: string; readonly right: string; readonly bottom: string }>({
                name: "a:rect",
                attributes: {
                    left: { key: "l", value: "l" },
                    top: { key: "t", value: "t" },
                    right: { key: "r", value: "r" },
                    bottom: { key: "b", value: "b" },
                },
            }),
            new BuilderElement({
                name: "a:pathLst",
                children: [
                    new BuilderElement<{ readonly width: number; readonly height: number }>({
                        name: "a:path",
                        attributes: {
                            width: { key: "w", value: width },
                            height: { key: "h", value: height },
                        },
                        children: segments.map(createPathSegment),
                    }),
                ],
            }),
        ],
    });
