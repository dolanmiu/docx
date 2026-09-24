/**
 * Lays out the children of a ShapeGroupRun or ShapeCanvasRun: positions the shapes, pictures and groups inside it,
 * gives each one a drawing id and a name, and routes the connectors between them. Not part of the public API.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { DrawingLinkOptions } from "@file/drawing/doc-properties/non-visual-drawing-properties";
import type { EffectExtentAttributes } from "@file/drawing/effect-extent/effect-extent";
import type { ICropOptions } from "@file/drawing/inline/graphic/graphic-data/pic/blip/source-rectangle";
import {
    type Bounds,
    type ConnectionSite,
    type ConnectorEndpoint,
    type Point,
    type PresetShapeCoreOptions,
    type PresetShapeNonVisualProperties,
    type ShapeEffects,
    type ShapeLine,
    type ShapePictureCoreOptions,
    createCustomGeometryPath,
    createShapeGuides,
    getConnectionSites,
    getShapeEffectsOverhang,
    getShapeLineOverhang,
    outwardAngle,
    routeConnector,
} from "@file/drawing/inline/graphic/graphic-data/wps";
import type { IMediaDataTransformation, IMediaTransformation, ShapeDrawingChildMediaData } from "@file/media";
import type { ImageSource } from "@file/media/image-data";
import { docPropertiesUniqueNumericId } from "@util/convenience-functions";

import { AlignmentType } from "../formatting/alignment";
import { Paragraph } from "../paragraph";
import type { ConnectorEnd, ConnectorLabel, ConnectorSide, IShapeConnectorOptions } from "./shape-connector";
import { type ShapeBaseOptions, type WithPresetShape, createPresetShapeData, getShapeOverhang } from "./shape-run-data";
import { TextRun } from "./text-run";

/**
 * A picture in a {@link ShapeGroupRun} or {@link ShapeCanvasRun}. Connectors can attach to the middle of its sides.
 *
 * @publicApi
 */
export type IShapePictureOptions = DrawingLinkOptions & {
    readonly type: "picture";
    /** The picture: its format and data, as for an `ImageRun`, such as `{ type: "png", data: fs.readFileSync("logo.png") }` */
    readonly image: ImageSource;
    /** Size in pixels, with optional rotation (degrees) and flip. `offset` positions the picture, in pixels */
    readonly transformation: IMediaTransformation;
    /** A name that connectors use to attach to this picture. It must be unique within the group or canvas */
    readonly id?: string;
    /** Crops the picture by a percentage of each side, from 0 to 100 */
    readonly crop?: ICropOptions;
    /** An outline around the picture. Default is none */
    readonly line?: ShapeLine;
    /** Shadows, glow, soft edges and reflection */
    readonly effects?: ShapeEffects;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * A group of shapes inside a {@link ShapeGroupRun} or {@link ShapeCanvasRun}, which moves, scales and rotates as one.
 *
 * Its children are positioned relative to each other, like the children of a `ShapeGroupRun`, and `transformation.offset`
 * places the group's top-left corner. Connectors in the group can only join shapes in the group, but connectors
 * outside it can attach to the shapes in it.
 *
 * @publicApi
 */
export type IShapeNestedGroupOptions = DrawingLinkOptions & {
    readonly type: "group";
    /** The shapes, pictures, groups and connectors in the group */
    readonly children: readonly IShapeGroupChildOptions[];
    /**
     * Position and size of the group in pixels, with optional rotation (degrees) and flip. The size defaults to the
     * box around the children, and a different size scales every child
     */
    readonly transformation?: Omit<IMediaTransformation, "width" | "height"> & {
        readonly width?: number;
        readonly height?: number;
    };
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * A shape, picture, group or connector inside a {@link ShapeGroupRun} or {@link ShapeCanvasRun}.
 *
 * A shape takes the options of a {@link ShapeRun} except `floating`. `transformation.offset` positions it,
 * in pixels, and `id` names it so connectors can attach to it.
 *
 * @publicApi
 */
export type IShapeGroupChildOptions =
    | WithPresetShape<
          ShapeBaseOptions & {
              /** A name that connectors use to attach to this shape. It must be unique within the group or canvas */
              readonly id?: string;
          }
      >
    | IShapeConnectorOptions
    | IShapePictureOptions
    | IShapeNestedGroupOptions;

type ShapeChildOptions = Exclude<IShapeGroupChildOptions, IShapeConnectorOptions | IShapePictureOptions | IShapeNestedGroupOptions>;

/**
 * A child with the drawing ids it is written with, given before anything is laid out so connectors can
 * refer to shapes that come after them.
 */
type Node =
    | { readonly kind: "shape"; readonly options: ShapeChildOptions; readonly drawingId: number }
    | { readonly kind: "picture"; readonly options: IShapePictureOptions; readonly drawingId: number }
    | { readonly kind: "connector"; readonly options: IShapeConnectorOptions; readonly drawingId: number; readonly labelId?: number }
    | {
          readonly kind: "group";
          readonly options: IShapeNestedGroupOptions;
          readonly drawingId: number;
          readonly children: readonly Node[];
      };

type Box = {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
};

/**
 * An affine transform: `x' = a x + c y + e` and `y' = b x + d y + f`.
 */
type Matrix = {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
    readonly e: number;
    readonly f: number;
};

/** A connection site of a shape, before the shape is placed. `index` is missing for points that aren't connection sites */
type LocalSite = ConnectionSite & { readonly index?: number };

/**
 * A shape or picture that connectors can attach to and are routed around, placed in the coordinates of the group being laid out.
 */
type Leaf = {
    readonly id?: string;
    /** The shape's `wps:cNvPr` id */
    readonly drawingId: number;
    /** The shape's size in EMUs */
    readonly width: number;
    readonly height: number;
    /** Where connectors can attach, in the shape's own coordinates */
    readonly sites: readonly LocalSite[];
    /** Moves the shape's own coordinates to the group's: its flips and rotation, and those of any groups it is in */
    readonly matrix: Matrix;
};

/** A connection site in the group's coordinates. `index` is missing for points that aren't connection sites */
type PageSite = ConnectorEndpoint & { readonly index?: number };

/**
 * A shape, picture or group positioned in EMUs in its group's coordinates, before it is written.
 */
type LaidOutChild = {
    /** Position and size before rotation. Connectors can be positioned between whole EMUs */
    readonly box: Box;
    /** Clockwise rotation in degrees */
    readonly rotation?: number;
    readonly flip?: { readonly horizontal?: boolean; readonly vertical?: boolean };
} & (
    | { readonly type: "wps"; readonly data: PresetShapeCoreOptions }
    | { readonly type: "picture"; readonly data: ShapePictureCoreOptions }
    | {
          readonly type: "group";
          readonly childOffset: Point;
          readonly childExtent: Point;
          readonly children: readonly LaidOutChild[];
          readonly nonVisualDrawingProperties: PresetShapeNonVisualProperties;
      }
);

type Placed = {
    readonly child: LaidOutChild;
    /** The part of the child the group's box goes around: its box before rotation, or a connector's path */
    readonly box: Bounds;
    /** Everything drawn for the child, including rotation, lines, arrowheads and effects */
    readonly reach: Bounds;
};

type GroupLayout = {
    readonly children: readonly LaidOutChild[];
    readonly box: Bounds;
    readonly reach: Bounds;
    /** The shapes and pictures in the group and in the groups inside it */
    readonly leaves: readonly Leaf[];
};

export type ShapeDrawingLayout = {
    readonly children: readonly ShapeDrawingChildMediaData[];
    /** The box around the shapes, pictures, groups and connectors, before rotation, in EMUs */
    readonly bounds: Bounds;
    /** The box around everything that is drawn, including rotated shapes, lines, arrowheads and effects, in EMUs */
    readonly reach: Bounds;
};

const EMUS_PER_PIXEL = 9525;
// How far an elbow or curved connector goes past a shape before turning: a quarter of an inch
const DEFAULT_CONNECTOR_MARGIN = 24;
// Estimated size of a connector label's text: about 7 pixels a character, and one line
const LABEL_CHARACTER_WIDTH = 7;
const LABEL_PADDING = 8;
const DEFAULT_LABEL_HEIGHT = 20;
const DEFAULT_LABEL_WIDTH = 100;

const SIDE_ANGLES: Readonly<Record<ConnectorSide, number>> = { right: 0, bottom: 90, left: 180, top: 270 };

const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

// Applies `second` after `first`
const compose = (second: Matrix, first: Matrix): Matrix => ({
    a: second.a * first.a + second.c * first.b,
    b: second.b * first.a + second.d * first.b,
    c: second.a * first.c + second.c * first.d,
    d: second.b * first.c + second.d * first.d,
    e: second.a * first.e + second.c * first.f + second.e,
    f: second.b * first.e + second.d * first.f + second.f,
});

const translation = (x: number, y: number): Matrix => ({ ...IDENTITY, e: x, f: y });

const scaling = (x: number, y: number): Matrix => ({ ...IDENTITY, a: x, d: y });

// Clockwise, as the page's y axis points down
const rotation = (degrees: number): Matrix => {
    const radians = (degrees * Math.PI) / 180;
    return { a: Math.cos(radians), b: Math.sin(radians), c: -Math.sin(radians), d: Math.cos(radians), e: 0, f: 0 };
};

const transformPoint = ({ a, b, c, d, e, f }: Matrix, { x, y }: Point): Point => ({ x: a * x + c * y + e, y: b * x + d * y + f });

// The direction an angle points in, once transformed
const transformAngle = ({ a, b, c, d }: Matrix, angle: number): number => {
    const radians = (angle * Math.PI) / 180;
    return (Math.atan2(b * Math.cos(radians) + d * Math.sin(radians), a * Math.cos(radians) + c * Math.sin(radians)) * 180) / Math.PI;
};

/**
 * Places something of the box's size: flips it about its centre, rotates it about its centre, then moves it into the box.
 */
const placement = (box: Box, degrees = 0, flip?: LaidOutChild["flip"]): Matrix =>
    [
        translation(-box.width / 2, -box.height / 2),
        scaling(flip?.horizontal ? -1 : 1, flip?.vertical ? -1 : 1),
        rotation(degrees),
        translation(box.x + box.width / 2, box.y + box.height / 2),
    ].reduce((matrix, step) => compose(step, matrix), IDENTITY);

const boundsOf = (points: readonly Point[]): Bounds => ({
    left: Math.min(...points.map(({ x }) => x)),
    top: Math.min(...points.map(({ y }) => y)),
    right: Math.max(...points.map(({ x }) => x)),
    bottom: Math.max(...points.map(({ y }) => y)),
});

const union = (all: readonly Bounds[]): Bounds => ({
    left: Math.min(...all.map(({ left }) => left)),
    top: Math.min(...all.map(({ top }) => top)),
    right: Math.max(...all.map(({ right }) => right)),
    bottom: Math.max(...all.map(({ bottom }) => bottom)),
});

const cornersOf = ({ left, top, right, bottom }: Bounds): readonly Point[] => [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
];

// The box around a box once it is transformed
const transformBounds = (matrix: Matrix, bounds: Bounds): Bounds =>
    boundsOf(cornersOf(bounds).map((corner) => transformPoint(matrix, corner)));

const expand = (bounds: Bounds, extent: EffectExtentAttributes): Bounds => ({
    left: bounds.left - extent.left,
    top: bounds.top - extent.top,
    right: bounds.right + extent.right,
    bottom: bounds.bottom + extent.bottom,
});

const uniformExtent = (overhang: number): EffectExtentAttributes => ({ top: overhang, right: overhang, bottom: overhang, left: overhang });

const boundsOfBox = ({ x, y, width, height }: Box): Bounds => ({ left: x, top: y, right: x + width, bottom: y + height });

const boxOf = ({ offset, width, height }: Pick<IMediaTransformation, "offset" | "width" | "height">): Box => ({
    x: Math.round((offset?.left ?? 0) * EMUS_PER_PIXEL),
    y: Math.round((offset?.top ?? 0) * EMUS_PER_PIXEL),
    width: Math.round(width * EMUS_PER_PIXEL),
    height: Math.round(height * EMUS_PER_PIXEL),
});

const leafBounds = ({ matrix, width, height }: Leaf): Bounds => transformBounds(matrix, { left: 0, top: 0, right: width, bottom: height });

const centreOf = ({ left, top, right, bottom }: Bounds): Point => ({ x: (left + right) / 2, y: (top + bottom) / 2 });

/**
 * A name for a shape, as Word gives them: what it is, then its drawing id, such as "Rounded Rectangle 4".
 */
const defaultName = (kind: string, drawingId: number): string =>
    `${kind.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/^./, (first) => first.toUpperCase())} ${drawingId}`;

const createNonVisualDrawingProperties = (
    drawingId: number,
    kind: string,
    { altText, link, decorative }: DrawingLinkOptions & { readonly altText?: DocPropertiesOptions },
): PresetShapeNonVisualProperties => ({
    id: drawingId,
    name: altText?.name ?? defaultName(kind, drawingId),
    description: altText?.description,
    title: altText?.title,
    link,
    decorative,
});

// The middle of each side, for shapes without connection sites, numbered as a rectangle's are
const sideMiddles = (width: number, height: number): readonly LocalSite[] => [
    { x: width / 2, y: 0, angle: 270 },
    { x: 0, y: height / 2, angle: 180 },
    { x: width / 2, y: height, angle: 90 },
    { x: width, y: height / 2, angle: 0 },
];

/**
 * A shape's connection sites, numbered as OOXML numbers them (`a:stCxn/@idx`).
 */
const shapeSites = (options: ShapeChildOptions, width: number, height: number): readonly LocalSite[] => {
    const sites =
        options.type === "custom"
            ? createCustomGeometryPath(options.path, width, height).sites
            : getConnectionSites(options.type, width, height, createShapeGuides(options.type, options.adjustments));
    return sites.map((site, index) => ({ ...site, index }));
};

/**
 * Gives every shape, picture, group, connector and label a drawing id, in the order they are written.
 */
const assignIds = (children: readonly IShapeGroupChildOptions[]): readonly Node[] =>
    children.map((options): Node => {
        switch (options.type) {
            case "connector": {
                const drawingId = docPropertiesUniqueNumericId();
                return { kind: "connector", options, drawingId, labelId: options.label ? docPropertiesUniqueNumericId() : undefined };
            }
            case "picture":
                return { kind: "picture", options, drawingId: docPropertiesUniqueNumericId() };
            case "group": {
                const drawingId = docPropertiesUniqueNumericId();
                return { kind: "group", options, drawingId, children: assignIds(options.children) };
            }
            default:
                return { kind: "shape", options, drawingId: docPropertiesUniqueNumericId() };
        }
    });

/**
 * The `id` of every shape and picture in the drawing.
 *
 * @throws If two shapes or pictures have the same `id`
 */
const idsOf = (node: Node): readonly string[] => {
    if (node.kind === "group") {
        return node.children.flatMap(idsOf);
    }
    return node.kind !== "connector" && node.options.id !== undefined ? [node.options.id] : [];
};

const collectIds = (nodes: readonly Node[]): ReadonlySet<string> => {
    const ids = nodes.flatMap(idsOf);
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated !== undefined) {
        throw new Error(`Invalid shape id "${repeated}". Each shape in a group or canvas needs a different id`);
    }
    return new Set(ids);
};

/**
 * A shape, picture or group once it is placed, with the shapes and pictures in it that connectors can attach to.
 */
type PlacedShape = {
    readonly placed: Placed;
    readonly leaves: readonly Leaf[];
};

type ConnectorNode = Extract<Node, { readonly kind: "connector" }>;

const layoutShape = (options: ShapeChildOptions, drawingId: number): PlacedShape => {
    const { rotation: degrees, flip } = options.transformation;
    const box = boxOf(options.transformation);
    const matrix = placement(box, degrees, flip);
    const sites = shapeSites(options, box.width, box.height);
    const leaf = {
        id: options.id,
        drawingId,
        width: box.width,
        height: box.height,
        sites: sites.length > 0 ? sites : sideMiddles(box.width, box.height),
        matrix,
    };
    const kind = options.type === "custom" ? "freeform" : options.type;
    return {
        placed: {
            child: {
                type: "wps",
                box,
                rotation: degrees,
                flip,
                data: {
                    ...createPresetShapeData(options),
                    nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, kind, options),
                },
            },
            box: boundsOfBox(box),
            reach: expand(leafBounds(leaf), getShapeOverhang(options)),
        },
        leaves: [leaf],
    };
};

const layoutPicture = (options: IShapePictureOptions, drawingId: number): PlacedShape => {
    const { rotation: degrees, flip } = options.transformation;
    const box = boxOf(options.transformation);
    const leaf = {
        id: options.id,
        drawingId,
        width: box.width,
        height: box.height,
        // A picture is a rectangle, with a rectangle's connection sites
        sites: getConnectionSites("rectangle", box.width, box.height).map((site, index) => ({ ...site, index })),
        matrix: placement(box, degrees, flip),
    };
    const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;
    const effectsOverhang = getShapeEffectsOverhang(options.effects, box.height, degrees);
    return {
        placed: {
            child: {
                type: "picture",
                box,
                rotation: degrees,
                flip,
                data: {
                    image: options.image,
                    crop: options.crop,
                    line: options.line,
                    effects: options.effects,
                    nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "picture", options),
                },
            },
            box: boundsOfBox(box),
            reach: expand(leafBounds(leaf), {
                top: lineOverhang + effectsOverhang.top,
                right: lineOverhang + effectsOverhang.right,
                bottom: lineOverhang + effectsOverhang.bottom,
                left: lineOverhang + effectsOverhang.left,
            }),
        },
        leaves: [leaf],
    };
};

/**
 * The side of `from` that faces `to`.
 */
const facingSide = (from: Bounds, to: Bounds): ConnectorSide => {
    const a = centreOf(from);
    const b = centreOf(to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? "right" : "left";
    }
    return dy >= 0 ? "bottom" : "top";
};

const angleBetween = (a: number, b: number): number => {
    const difference = (((a - b) % 360) + 360) % 360;
    return Math.min(difference, 360 - difference);
};

const toPageSite = (leaf: Leaf, { x, y, angle, index }: LocalSite): PageSite => ({
    point: transformPoint(leaf.matrix, { x, y }),
    angle: transformAngle(leaf.matrix, angle),
    index,
});

/**
 * The connection site on a side of a shape: the one facing most nearly that way, then the one
 * furthest out on that side, then the one nearest the middle of the side.
 */
const pickSite = (leaf: Leaf, side: ConnectorSide): PageSite => {
    const sites = leaf.sites.map((site) => toPageSite(leaf, site));
    const angle = SIDE_ANGLES[side];
    const direction = { x: Math.round(Math.cos((angle * Math.PI) / 180)), y: Math.round(Math.sin((angle * Math.PI) / 180)) };
    const centre = centreOf(leafBounds(leaf));
    const along = ({ point }: PageSite): number => (point.x - centre.x) * direction.x + (point.y - centre.y) * direction.y;
    const across = ({ point }: PageSite): number => Math.abs((point.x - centre.x) * direction.y - (point.y - centre.y) * direction.x);

    const isBetter = (site: PageSite, best: PageSite): boolean => {
        const angleDifference = angleBetween(site.angle, angle) - angleBetween(best.angle, angle);
        if (Math.abs(angleDifference) > 0.01) {
            return angleDifference < 0;
        }
        const alongDifference = along(site) - along(best);
        if (Math.abs(alongDifference) > 1) {
            return alongDifference > 0;
        }
        return across(site) < across(best);
    };

    return sites.reduce((best, site) => (isBetter(site, best) ? site : best));
};

/**
 * The connection site nearest a point given as percentages of the shape's width and height. A shape without
 * connection sites is connected at the point itself, leaving in the direction, right, down, left or up, that the
 * point is furthest from the shape's middle in.
 */
const pickNearestSite = (leaf: Leaf, point: { readonly x: number; readonly y: number }): PageSite => {
    if (!(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100)) {
        throw new Error(`Invalid connector point { x: ${point.x}, y: ${point.y} }. Expected percentages from 0 to 100`);
    }
    const target = { x: (point.x / 100) * leaf.width, y: (point.y / 100) * leaf.height };
    const sites = leaf.sites.filter((site) => site.index !== undefined);
    if (sites.length === 0) {
        return toPageSite(leaf, { ...target, angle: outwardAngle(target.x, target.y, leaf.width, leaf.height) });
    }
    const distance = (site: LocalSite): number => Math.hypot(site.x - target.x, site.y - target.y);
    return toPageSite(
        leaf,
        sites.reduce((nearest, site) => (distance(site) < distance(nearest) ? site : nearest)),
    );
};

// The point half way along a path
const midpointOf = (points: readonly Point[]): Point => {
    const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
    let remaining = lengths.reduce((total, length) => total + length, 0) / 2;
    for (const [index, length] of lengths.entries()) {
        if (remaining <= length && length > 0) {
            const from = points[index];
            const to = points[index + 1];
            return { x: from.x + ((to.x - from.x) * remaining) / length, y: from.y + ((to.y - from.y) * remaining) / length };
        }
        remaining -= length;
    }
    return points[0];
};

/**
 * A connector's label: a text box without a line, centred on the middle of the connector's route.
 */
const layoutLabel = (label: string | ConnectorLabel, points: readonly Point[], drawingId: number): Placed => {
    const {
        text,
        width,
        height = DEFAULT_LABEL_HEIGHT,
        fill = "none",
        line = "none",
    } = typeof label === "string" ? { text: label } : label;
    const paragraphs =
        typeof text === "string" ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(text)] })] : text;
    const size = {
        width: width ?? (typeof text === "string" ? text.length * LABEL_CHARACTER_WIDTH + LABEL_PADDING : DEFAULT_LABEL_WIDTH),
        height,
    };
    const middle = midpointOf(points);
    const box = {
        x: Math.round(middle.x - (size.width * EMUS_PER_PIXEL) / 2),
        y: Math.round(middle.y - (size.height * EMUS_PER_PIXEL) / 2),
        width: Math.round(size.width * EMUS_PER_PIXEL),
        height: Math.round(size.height * EMUS_PER_PIXEL),
    };
    return {
        child: {
            type: "wps",
            box,
            data: {
                ...createPresetShapeData({
                    type: "rectangle",
                    transformation: size,
                    fill,
                    line,
                    children: paragraphs,
                    // The text stays on one line, centred on the box, even if the box is too small for it
                    textOptions: { margins: { top: 0, right: 0, bottom: 0, left: 0 }, wrap: false, verticalAlignment: "center" },
                }),
                nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "textBox", {}),
            },
        },
        box: boundsOfBox(box),
        reach: expand(boundsOfBox(box), uniformExtent(line === "none" ? 0 : getShapeLineOverhang(line))),
    };
};

const ROUTE_NAMES = { straight: "straightConnector", elbow: "elbowConnector", curved: "curvedConnector" } as const;

/**
 * Routes a connector between the shapes it joins, and places its label.
 *
 * @throws If an end names a shape that doesn't exist or isn't in the connector's group, or gives both a side and a point
 */
const layoutConnector = (node: ConnectorNode, leaves: readonly Leaf[], allIds: ReadonlySet<string>): readonly Placed[] => {
    const { options: connector, drawingId, labelId } = node;
    const resolve = (connectorEnd: ConnectorEnd): { readonly leaf: Leaf; readonly side?: ConnectorSide; readonly point?: Point } => {
        const { id, side, point } =
            typeof connectorEnd === "string" ? { id: connectorEnd, side: undefined, point: undefined } : connectorEnd;
        const leaf = leaves.find((candidate) => candidate.id === id);
        if (!leaf) {
            throw new Error(
                allIds.has(id)
                    ? `Invalid connector. The shape "${id}" is not in the connector's group. A connector in a group can only join shapes in that group`
                    : `Invalid connector. No shape has the id "${id}"`,
            );
        }
        if (side && point) {
            throw new Error(`Invalid connector end for "${id}". Give a side or a point, not both`);
        }
        return { leaf, side, point };
    };
    const from = resolve(connector.from);
    const to = resolve(connector.to);
    const endOf = (end: typeof from, other: typeof from): PageSite =>
        end.point
            ? pickNearestSite(end.leaf, end.point)
            : pickSite(end.leaf, end.side ?? facingSide(leafBounds(end.leaf), leafBounds(other.leaf)));
    const start = endOf(from, to);
    const finish = endOf(to, from);
    const route = connector.route ?? "straight";
    const geometry = routeConnector(route, start, finish, {
        margin: (connector.margin ?? DEFAULT_CONNECTOR_MARGIN) * EMUS_PER_PIXEL,
        obstacles: leaves.map(leafBounds),
    });

    const path = boundsOf(geometry.points);
    const placed: Placed = {
        child: {
            type: "wps",
            box: { ...geometry.offset, width: geometry.width, height: geometry.height },
            rotation: geometry.rotation,
            flip: { horizontal: geometry.flip.horizontal || undefined, vertical: geometry.flip.vertical || undefined },
            data: {
                geometry: { type: geometry.type, adjustments: geometry.adjustments },
                line: connector.line,
                // Attach the connector to shapes with connection sites
                connections: {
                    start: start.index === undefined ? undefined : { id: from.leaf.drawingId, index: start.index },
                    end: finish.index === undefined ? undefined : { id: to.leaf.drawingId, index: finish.index },
                },
                nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, ROUTE_NAMES[route], connector),
            },
        },
        box: path,
        reach: expand(path, uniformExtent(getShapeLineOverhang(connector.line))),
    };

    return connector.label && labelId !== undefined ? [placed, layoutLabel(connector.label, geometry.points, labelId)] : [placed];
};

/**
 * Lays out a group inside the drawing, in the coordinates of the group it is in.
 */
const layoutNestedGroup = (node: Extract<Node, { readonly kind: "group" }>, allIds: ReadonlySet<string>): PlacedShape => {
    const { options, drawingId } = node;
    const inner = layoutGroup(node.children, allIds);
    const childOffset = { x: Math.round(inner.box.left), y: Math.round(inner.box.top) };
    const childExtent = { x: Math.round(inner.box.right) - childOffset.x, y: Math.round(inner.box.bottom) - childOffset.y };
    const { offset, width, height, rotation: degrees, flip } = options.transformation ?? {};
    const box = {
        ...boxOf({ offset, width: 0, height: 0 }),
        width: width === undefined ? childExtent.x : Math.round(width * EMUS_PER_PIXEL),
        height: height === undefined ? childExtent.y : Math.round(height * EMUS_PER_PIXEL),
    };
    // The children's coordinates are scaled to fill the group's box, then flipped and rotated with it
    const matrix = compose(
        placement(box, degrees, flip),
        compose(
            scaling(childExtent.x === 0 ? 1 : box.width / childExtent.x, childExtent.y === 0 ? 1 : box.height / childExtent.y),
            translation(-childOffset.x, -childOffset.y),
        ),
    );

    return {
        placed: {
            child: {
                type: "group",
                box,
                rotation: degrees,
                flip,
                childOffset,
                childExtent,
                children: inner.children,
                nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "group", options),
            },
            box: boundsOfBox(box),
            reach: transformBounds(matrix, inner.reach),
        },
        leaves: inner.leaves.map((leaf) => ({ ...leaf, matrix: compose(matrix, leaf.matrix) })),
    };
};

/**
 * Lays out the children of a group: first the shapes, pictures and groups, then the connectors between them.
 */
const layoutGroup = (nodes: readonly Node[], allIds: ReadonlySet<string>): GroupLayout => {
    if (nodes.length === 0) {
        throw new Error("Invalid shape group. Expected at least 1 child shape");
    }

    // Shapes, pictures and groups first, so connectors can attach to any of them
    const items = nodes.map((node): { readonly connector: ConnectorNode } | PlacedShape => {
        switch (node.kind) {
            case "shape":
                return layoutShape(node.options, node.drawingId);
            case "picture":
                return layoutPicture(node.options, node.drawingId);
            case "group":
                return layoutNestedGroup(node, allIds);
            default:
                return { connector: node };
        }
    });
    const leaves = items.flatMap((item) => ("leaves" in item ? item.leaves : []));
    const placed = items.flatMap((item) => ("connector" in item ? layoutConnector(item.connector, leaves, allIds) : [item.placed]));

    return {
        children: placed.map(({ child }) => child),
        box: union(placed.map(({ box }) => box)),
        reach: union(placed.map(({ reach }) => reach)),
        leaves,
    };
};

const toMediaData = (child: LaidOutChild, shift: Point): ShapeDrawingChildMediaData => {
    const x = Math.round(child.box.x + shift.x);
    const y = Math.round(child.box.y + shift.y);
    const width = Math.round(child.box.width);
    const height = Math.round(child.box.height);
    const transformation: IMediaDataTransformation = {
        offset: { pixels: { x: Math.round(x / EMUS_PER_PIXEL), y: Math.round(y / EMUS_PER_PIXEL) }, emus: { x, y } },
        pixels: { x: Math.round(width / EMUS_PER_PIXEL), y: Math.round(height / EMUS_PER_PIXEL) },
        emus: { x: width, y: height },
        flip: child.flip,
        rotation: child.rotation ? child.rotation * 60000 : undefined,
    };
    switch (child.type) {
        case "wps":
            return { type: "wps", transformation, data: child.data };
        case "picture":
            return { type: "picture", transformation, data: child.data };
        default:
            return {
                type: "group",
                transformation,
                childOffset: child.childOffset,
                childExtent: child.childExtent,
                children: child.children.map((grandchild) => toMediaData(grandchild, { x: 0, y: 0 })),
                nonVisualDrawingProperties: child.nonVisualDrawingProperties,
            };
    }
};

/**
 * Lays out the shapes, pictures, groups and connectors of a group or canvas. They are drawn in the order given,
 * and connectors can attach to shapes that come after them.
 *
 * @param keepPositive - Moves everything right and down, if needed, so nothing that is drawn is above or to the left of (0, 0)
 * @throws If a group has no children, two shapes have the same `id`, or a connector refers to an `id` no shape in its group has
 */
export const layoutShapeDrawing = (children: readonly IShapeGroupChildOptions[], keepPositive = false): ShapeDrawingLayout => {
    // Every shape, picture, group and connector identifies itself with a cNvPr, which needs a unique id
    const nodes = assignIds(children);
    const layout = layoutGroup(nodes, collectIds(nodes));
    const shift = keepPositive ? { x: Math.max(0, -layout.reach.left), y: Math.max(0, -layout.reach.top) } : { x: 0, y: 0 };
    const move = ({ left, top, right, bottom }: Bounds): Bounds => ({
        left: left + shift.x,
        top: top + shift.y,
        right: right + shift.x,
        bottom: bottom + shift.y,
    });

    return {
        children: layout.children.map((child) => toMediaData(child, shift)),
        bounds: move(layout.box),
        reach: move(layout.reach),
    };
};

/**
 * How far, in EMUs, what a group draws reaches past each side of the group, once its children are scaled to the
 * group's size and the group is flipped and rotated.
 *
 * @param layout - The group's layout
 * @param childOffset - The top-left corner of the box its children are positioned in
 * @param childExtent - The size of the box its children are positioned in
 * @param transformation - The group's size in EMUs, rotation in degrees and flip
 */
export const getGroupEffectExtent = (
    { reach }: Pick<ShapeDrawingLayout, "reach">,
    childOffset: Point,
    childExtent: Point,
    { width, height, rotation: degrees, flip }: Omit<Box, "x" | "y"> & Pick<LaidOutChild, "rotation" | "flip">,
): EffectExtentAttributes => {
    const matrix = compose(
        placement({ x: 0, y: 0, width, height }, degrees, flip),
        compose(
            scaling(childExtent.x === 0 ? 1 : width / childExtent.x, childExtent.y === 0 ? 1 : height / childExtent.y),
            translation(-childOffset.x, -childOffset.y),
        ),
    );
    const drawn = transformBounds(matrix, reach);
    return {
        top: Math.max(0, Math.ceil(-drawn.top)),
        right: Math.max(0, Math.ceil(drawn.right - width)),
        bottom: Math.max(0, Math.ceil(drawn.bottom - height)),
        left: Math.max(0, Math.ceil(-drawn.left)),
    };
};
