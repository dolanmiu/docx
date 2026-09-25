/**
 * Custom shapes (`a:custGeom`): polygons and freeform paths drawn from SVG path data.
 *
 * A shape has one path or several, each filled and outlined on its own. The box around all the paths is scaled to fill
 * the shape, and they are written as DrawingML path commands. Every corner and end of the paths is a connection site,
 * unless the shape gives its own connection points, so connectors can attach to custom shapes.
 *
 * Reference: ECMA-376 Part 1, 20.1.9.8 custGeom (Custom Geometry)
 *
 * @module
 */
// cspell:ignore custGeom
import { BuilderElement, type XmlComponent } from "docx";

import { orientParts } from "./path-holes";
import { type EllipticalArc, type PathBounds, type PathPoint, type PathSegment, getPathBounds, parseSvgPath, pointOnArc } from "./svg-path";
import type { ConnectionSite } from "../connector/connection-sites";
import type { ConnectorSide } from "../shape-connector";

/**
 * How a path of a custom shape is filled: with the shape's `fill` (`true`), not at all (`false`), or with the shape's
 * fill made lighter or darker, as Word's preset shapes shade the top of a cube or the inside of a can.
 *
 * @publicApi
 */
export type CustomShapePathFill = boolean | "lighter" | "slightlyLighter" | "darker" | "slightlyDarker";

/**
 * One of the paths of a custom shape. Each path is filled with the shape's `fill` and outlined with its `line`, on its
 * own, so paths can overlap without cutting holes in each other.
 *
 * @publicApi
 */
export type CustomShapePath = {
    /** SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"`, in the same units as the shape's other paths */
    readonly path: string;
    /** How the path is filled. Default is `true`, the shape's `fill` */
    readonly fill?: CustomShapePathFill;
    /** Whether the shape's `line` is drawn along the path. Default is `true` */
    readonly line?: boolean;
};

/**
 * A box in a custom shape, in the units of its paths.
 *
 * @publicApi
 */
export type CustomShapeTextArea = {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};

/**
 * A point of a custom shape that connectors attach to, in the units of its paths.
 *
 * @publicApi
 */
export type CustomShapeConnectionPoint = {
    readonly x: number;
    readonly y: number;
    /**
     * The side of the shape the point faces. Connectors leave the point towards it, and a connector's end with this
     * `side` attaches here. Default is the side the point is nearest, as a share of the shape's width and height
     */
    readonly side?: ConnectorSide;
};

/**
 * The outline of a custom shape, and where its text and connection points go.
 *
 * @publicApi
 */
export type CustomShapeGeometry = {
    /**
     * Where the text goes, in the units of the paths, such as the body of a speech bubble without its tail. Default is
     * the whole shape
     */
    readonly textArea?: CustomShapeTextArea;
    /**
     * The points connectors attach to, in the units of the paths. Default is every corner and end of the paths
     */
    readonly connectionPoints?: readonly CustomShapeConnectionPoint[];
} & (
    | {
          /**
           * The outline of the shape as SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"` for a triangle.
           * It can use the commands M, L, H, V, C, S, Q, T, A and Z, in any units: the path is scaled so the
           * box around it fills the shape. A closed part of the path inside another part is a hole in it
           */
          readonly path: string;
          readonly paths?: undefined;
      }
    | {
          /**
           * Several paths, in the same units, each with its own fill and line. The box around all of them is scaled to
           * fill the shape. Later paths are drawn over earlier ones
           */
          readonly paths: readonly CustomShapePath[];
          readonly path?: undefined;
      }
);

/**
 * A custom shape's geometry options, as the shape's options give them.
 */
export type CustomGeometryOptions = {
    readonly path?: string;
    readonly paths?: readonly CustomShapePath[];
    readonly textArea?: CustomShapeTextArea;
    readonly connectionPoints?: readonly CustomShapeConnectionPoint[];
};

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
 * How a path is filled, as DrawingML names it (`ST_PathFillMode`). The shape's fill is `"norm"`, the default.
 */
type PathFillMode = "none" | "norm" | "lighten" | "lightenLess" | "darken" | "darkenLess";

/**
 * One of a custom shape's paths, scaled to the shape.
 */
export type CustomGeometryPath = {
    readonly segments: readonly CustomPathSegment[];
    readonly fill: PathFillMode;
    /** Whether the shape's line is drawn along the path */
    readonly stroke: boolean;
};

/**
 * A box in a shape, in EMUs from its top-left corner.
 */
export type CustomGeometryBox = {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};

/**
 * A custom shape's paths, scaled to the shape, its connection sites and where its text goes.
 */
export type CustomGeometry = {
    /** The shape's width in EMUs, which the paths are drawn in */
    readonly width: number;
    /** The shape's height in EMUs, which the paths are drawn in */
    readonly height: number;
    readonly paths: readonly CustomGeometryPath[];
    /** The shape's connection points, or the corners and ends of its paths in the order they are drawn */
    readonly sites: readonly ConnectionSite[];
    /** Where the text goes. Without it, the text uses the whole shape */
    readonly textArea?: CustomGeometryBox;
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
 * The corners and ends of the paths: where each of their segments ends. A connector leaves each one in the direction,
 * right, down, left or up, that it is furthest from the middle of the shape in.
 */
const findSites = (segments: readonly PathSegment[], scale: Scale, width: number, height: number): readonly ConnectionSite[] => {
    const ends = segments.flatMap((segment) => (segment.type === "close" ? [] : [round(toShape(scale, segment.to))]));
    const unique = ends.filter((point, index) => ends.findIndex(({ x, y }) => x === point.x && y === point.y) === index);
    return unique.map(({ x, y }) => ({ x, y, angle: outwardAngle(x, y, width, height) }));
};

const SIDE_ANGLES: Readonly<Record<ConnectorSide, number>> = { right: 0, bottom: 90, left: 180, top: 270 };

/**
 * The shape's own connection points, scaled to the shape.
 *
 * @throws If a point isn't a pair of numbers, or its side isn't one of the four
 */
const connectionSites = (
    points: readonly CustomShapeConnectionPoint[],
    scale: Scale,
    width: number,
    height: number,
): readonly ConnectionSite[] =>
    points.map((point) => {
        const { x, y, side } = point;
        if (!Number.isFinite(x) || !Number.isFinite(y) || (side !== undefined && SIDE_ANGLES[side] === undefined)) {
            throw new Error(
                `Invalid connection point ${JSON.stringify(point)}. Expected numbers x and y, and a side of top, right, bottom or left`,
            );
        }
        const site = round(toShape(scale, { x, y }));
        return { ...site, angle: side === undefined ? outwardAngle(site.x, site.y, width, height) : SIDE_ANGLES[side] };
    });

/* cspell:disable */
const PATH_FILLS: ReadonlyMap<CustomShapePathFill, PathFillMode> = new Map<CustomShapePathFill, PathFillMode>([
    [true, "norm"],
    [false, "none"],
    ["lighter", "lighten"],
    ["slightlyLighter", "lightenLess"],
    ["darker", "darken"],
    ["slightlyDarker", "darkenLess"],
]);
/* cspell:enable */

type ReadPath = {
    readonly segments: readonly PathSegment[];
    readonly fill: PathFillMode;
    readonly stroke: boolean;
};

/**
 * Reads a custom shape's paths. Parts of a path inside other parts are turned round to go the other way, so they are
 * holes whichever way applications fill paths.
 *
 * @throws If there is no path, both `path` and `paths`, a path isn't valid SVG path data, or a fill isn't one of the choices
 */
const readPaths = ({ path, paths }: CustomGeometryOptions): readonly ReadPath[] => {
    if (path !== undefined && paths !== undefined) {
        throw new Error("Invalid custom shape. Expected path or paths, not both");
    }
    const options = paths ?? (path === undefined ? [] : [{ path }]);
    if (options.length === 0) {
        throw new Error("Invalid custom shape. Expected a path, or at least one of paths");
    }
    return options.map(({ path: data, fill = true, line }) => {
        const mode = PATH_FILLS.get(fill);
        if (mode === undefined) {
            throw new Error(
                `Invalid custom shape path fill "${fill}". Expected true, false, "lighter", "slightlyLighter", "darker" or "slightlyDarker"`,
            );
        }
        return { segments: orientParts(parseSvgPath(data)), fill: mode, stroke: line !== false };
    });
};

const unionOf = (bounds: readonly PathBounds[]): PathBounds => ({
    left: Math.min(...bounds.map(({ left }) => left)),
    top: Math.min(...bounds.map(({ top }) => top)),
    right: Math.max(...bounds.map(({ right }) => right)),
    bottom: Math.max(...bounds.map(({ bottom }) => bottom)),
});

/**
 * Where the text goes, scaled to the shape.
 *
 * @throws If the box's sides aren't numbers, or it is turned inside out
 */
const scaleTextArea = (textArea: CustomShapeTextArea, scale: Scale): CustomGeometryBox => {
    const { left, top, right, bottom } = textArea;
    if (![left, top, right, bottom].every(Number.isFinite) || right < left || bottom < top) {
        throw new Error(
            `Invalid text area ${JSON.stringify(textArea)}. Expected numbers left, top, right and bottom, with right at least left and bottom at least top`,
        );
    }
    const topLeft = round(toShape(scale, { x: left, y: top }));
    const bottomRight = round(toShape(scale, { x: right, y: bottom }));
    return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y };
};

/**
 * Reads a custom shape's paths and scales them to the shape: the box around them is stretched to fill the shape's box.
 * The text area and connection points are scaled with them.
 *
 * @param width - The shape's width in EMUs
 * @param height - The shape's height in EMUs
 * @throws If the paths, text area or connection points aren't valid
 */
export const createCustomGeometryData = (options: CustomGeometryOptions, width: number, height: number): CustomGeometry => {
    const paths = readPaths(options);
    const bounds = unionOf(paths.map(({ segments }) => getPathBounds(segments)));
    const pathWidth = bounds.right - bounds.left;
    const pathHeight = bounds.bottom - bounds.top;
    const x = pathWidth > 0 ? width / pathWidth : 0;
    const y = pathHeight > 0 ? height / pathHeight : 0;
    const scale: Scale = { left: bounds.left, top: bounds.top, x, y };

    return {
        width,
        height,
        paths: paths.map(({ segments, fill, stroke }) => ({
            segments: segments.flatMap((segment) => convertSegment(segment, scale)),
            fill,
            stroke,
        })),
        sites:
            options.connectionPoints === undefined
                ? findSites(
                      paths.flatMap(({ segments }) => segments),
                      scale,
                      width,
                      height,
                  )
                : connectionSites(options.connectionPoints, scale, width, height),
        textArea: options.textArea && scaleTextArea(options.textArea, scale),
    };
};

/**
 * The box a custom shape of the given size writes its text in: its text area, or the whole shape.
 *
 * @param width - The shape's width in EMUs
 * @param height - The shape's height in EMUs
 */
export const getCustomTextRectangle = (options: CustomGeometryOptions, width: number, height: number): CustomGeometryBox =>
    (options.textArea && createCustomGeometryData(options, width, height).textArea) ?? { left: 0, top: 0, right: width, bottom: height };

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

/**
 * A shape geometry guide (`a:gd`): a named value worked out from a formula.
 */
type Guide = { readonly name: string; readonly formula: string };

/**
 * A guide for a length across or down the shape that keeps its share of the shape's width or height when the shape is
 * resized, as PowerPoint writes the points of freeforms: the length times `w` (or `h`), divided by the width (or height)
 * it was worked out for.
 */
const shareGuide = (name: string, value: number, size: "w" | "h", length: number): Guide => ({
    name,
    formula: length === 0 ? `val ${value}` : `*/ ${value} ${size} ${length}`,
});

const createGuide = ({ name, formula }: Guide): XmlComponent =>
    new BuilderElement<{ readonly name: string; readonly formula: string }>({
        name: "a:gd",
        attributes: { name: { key: "name", value: name }, formula: { key: "fmla", value: formula } },
    });

/* cspell:disable */
const siteGuides = (sites: readonly ConnectionSite[], width: number, height: number): readonly Guide[] =>
    sites.flatMap(({ x, y }, index) => [shareGuide(`connsiteX${index}`, x, "w", width), shareGuide(`connsiteY${index}`, y, "h", height)]);

// <xsd:complexType name="CT_ConnectionSite">
//     <xsd:sequence>
//         <xsd:element name="pos" type="CT_AdjPoint2D" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="ang" type="ST_AdjAngle" use="required"/>
// </xsd:complexType>
const createConnectionSite = ({ angle }: ConnectionSite, index: number): XmlComponent =>
    new BuilderElement<{ readonly angle: number }>({
        name: "a:cxn",
        attributes: { angle: { key: "ang", value: Math.round(angle * ANGLE_UNITS_PER_DEGREE) } },
        children: [
            new BuilderElement<{ readonly x: string; readonly y: string }>({
                name: "a:pos",
                attributes: { x: { key: "x", value: `connsiteX${index}` }, y: { key: "y", value: `connsiteY${index}` } },
            }),
        ],
    });
/* cspell:enable */

const textAreaGuides = (textArea: CustomGeometryBox | undefined, width: number, height: number): readonly Guide[] =>
    textArea === undefined
        ? []
        : [
              shareGuide("textAreaLeft", textArea.left, "w", width),
              shareGuide("textAreaTop", textArea.top, "h", height),
              shareGuide("textAreaRight", textArea.right, "w", width),
              shareGuide("textAreaBottom", textArea.bottom, "h", height),
          ];

const createPath = (path: CustomGeometryPath, width: number, height: number): XmlComponent =>
    new BuilderElement<{ readonly width: number; readonly height: number; readonly fill?: PathFillMode; readonly stroke?: boolean }>({
        name: "a:path",
        attributes: {
            width: { key: "w", value: width },
            height: { key: "h", value: height },
            // Only what differs from the defaults is written
            fill: { key: "fill", value: path.fill === "norm" ? undefined : path.fill },
            stroke: { key: "stroke", value: path.stroke ? undefined : false },
        },
        children: path.segments.map(createPathSegment),
    });

/**
 * Creates an `a:custGeom` element for a custom shape.
 *
 * The connection sites and text area are guides that keep their share of the shape's width and height, so they stay
 * in place when the shape is resized. Without a text area, the text uses the whole of the shape's box.
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
export const createCustomGeometry = ({ width, height, paths, sites, textArea }: CustomGeometry): XmlComponent =>
    new BuilderElement({
        name: "a:custGeom",
        children: [
            new BuilderElement({ name: "a:avLst" }),
            new BuilderElement({
                name: "a:gdLst",
                children: [...siteGuides(sites, width, height), ...textAreaGuides(textArea, width, height)].map(createGuide),
            }),
            new BuilderElement({ name: "a:ahLst" }),
            new BuilderElement({ name: "a:cxnLst", children: sites.map(createConnectionSite) }),
            new BuilderElement<{ readonly left: string; readonly top: string; readonly right: string; readonly bottom: string }>({
                name: "a:rect",
                attributes: textArea
                    ? {
                          left: { key: "l", value: "textAreaLeft" },
                          top: { key: "t", value: "textAreaTop" },
                          right: { key: "r", value: "textAreaRight" },
                          bottom: { key: "b", value: "textAreaBottom" },
                      }
                    : {
                          left: { key: "l", value: "l" },
                          top: { key: "t", value: "t" },
                          right: { key: "r", value: "r" },
                          bottom: { key: "b", value: "b" },
                      },
            }),
            new BuilderElement({ name: "a:pathLst", children: paths.map((path) => createPath(path, width, height)) }),
        ],
    });
