/**
 * Lays out the children of a ShapeGroupRun or ShapeCanvasRun: positions the shapes, pictures and groups inside it,
 * gives each one a drawing id and a name, and routes the connectors between them. Not part of the public API.
 *
 * @module
 */
// cspell:ignore Liang
import {
    type DocPropertiesOptions,
    type DrawingLinkOptions,
    type EffectExtentAttributes,
    type ICropOptions,
    type IMediaDataTransformation,
    type IMediaTransformation,
    type Paragraph,
    docPropertiesUniqueNumericId,
} from "docx";

import {
    type Bounds,
    type ConnectionSite,
    type ConnectorEndpoint,
    type ConnectorGeometry,
    type ConnectorRoute,
    type Point,
    countRouteCrossings,
    fitElbowConnector,
    getConnectionSites,
    routeConnector,
    separateChannels,
} from "./connector";
import { createCustomGeometryPath, outwardAngle } from "./custom-geometry";
import type { ShapeDrawingChildMediaData } from "./drawing/shape-drawing-child";
import type { ImageSource } from "./picture/image-data";
import type { ShapePictureCoreOptions } from "./picture/shape-picture";
import {
    type PresetShapeCoreOptions,
    type PresetShapeNonVisualProperties,
    type ShapeEffects,
    type ShapeFill,
    type ShapeLine,
    createShapeGuides,
    getShapeEffectsOverhang,
    getShapeLineOverhang,
} from "./preset-shape";
import type { ConnectorEnd, ConnectorLabel, ConnectorSide, IShapeConnectorOptions } from "./shape-connector";
import { type ShapeLane, type ShapeLayout, type ShapeLayoutDirection, layoutItems } from "./shape-layout";
import { type ShapeBaseOptions, type WithPresetShape, createPresetShapeData, getShapeOverhang } from "./shape-run-data";
import { createTextParagraphs, resolveShapeSize } from "./shape-text-size";
import { type TextStyles, WORD_DEFAULT_STYLES, readTextParagraphs } from "./shape-text-styles";
import { measureText } from "./text-metrics";

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
    /** The lane of the flow the picture goes in, by its name. See `ShapeFlowLayout.lanes` */
    readonly lane?: string;
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
    /** Places the children that have no `offset`, such as in a flowchart, tree or grid */
    readonly layout?: ShapeLayout;
    /** The lane of the flow the group goes in, by its name. See `ShapeFlowLayout.lanes` */
    readonly lane?: string;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * A shape, picture, group or connector inside a {@link ShapeGroupRun} or {@link ShapeCanvasRun}.
 *
 * A shape takes the options of a {@link ShapeRun} except `floating`. `transformation.offset` positions it,
 * in pixels, unless a `layout` places it, and `id` names it so connectors can attach to it.
 *
 * @publicApi
 */
export type IShapeGroupChildOptions =
    | WithPresetShape<
          ShapeBaseOptions & {
              /** A name that connectors use to attach to this shape. It must be unique within the group or canvas */
              readonly id?: string;
              /** The lane of the flow the shape goes in, by its name. See `ShapeFlowLayout.lanes` */
              readonly lane?: string;
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
          /** The drawing ids of the band and header of each lane of the group's layout */
          readonly laneIds: readonly LaneIds[];
      };

/** The drawing ids of a lane's band and header */
type LaneIds = readonly [number, number];

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
    /** The straight part of each of its sides, where the ends of several connectors can be spread out */
    readonly straightSides: StraightSides;
};

/**
 * The straight part of each side of a shape, in the shape's own coordinates: where along the side it starts and ends.
 */
type StraightSides = Partial<Record<ConnectorSide, readonly [number, number]>>;

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
const PIXELS_PER_POINT = 4 / 3;
// How far an elbow or curved connector goes past a shape before turning: a quarter of an inch
const DEFAULT_CONNECTOR_MARGIN = 24;
// Space around a connector label's text, in pixels
const LABEL_PADDING = { width: 8, height: 4 };
// How far a label at the start or end of a connector is from the shape, and how far it moves at a time to get off a shape, in pixels
const LABEL_GAP = 4;
const LABEL_STEP = 4;
// How far apart elbow connectors that would lie on top of each other are moved, in pixels
const CHANNEL_SPACING = 6;
// Space around the name in a lane's header, in pixels
const LANE_PADDING = 6;
// A lane's line, unless it is given one: a thin grey line
const LANE_LINE: ShapeLine = { color: "A5A5A5", width: 0.75 };
// A lane's header's background, unless it is given one
const LANE_HEADER_FILL: ShapeFill = "F2F2F2";

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

// Where an offset puts a shape, in EMUs, or nothing without an offset
const offsetOf = (offset: IMediaTransformation["offset"]): Point | undefined =>
    offset && { x: Math.round((offset.left ?? 0) * EMUS_PER_PIXEL), y: Math.round((offset.top ?? 0) * EMUS_PER_PIXEL) };

const boxAt = (position: Point, { width, height }: Pick<IMediaTransformation, "width" | "height">): Box => ({
    ...position,
    width: Math.round(width * EMUS_PER_PIXEL),
    height: Math.round(height * EMUS_PER_PIXEL),
});

const leafBounds = ({ matrix, width, height }: Leaf): Bounds => transformBounds(matrix, { left: 0, top: 0, right: width, bottom: height });

const centreOf = ({ left, top, right, bottom }: Bounds): Point => ({ x: (left + right) / 2, y: (top + bottom) / 2 });

const overlaps = (a: Bounds, b: Bounds): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const overlapArea = (a: Bounds, b: Bounds): number =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

const shrink = ({ left, top, right, bottom }: Bounds, by: number): Bounds => ({
    left: left + by,
    top: top + by,
    right: right - by,
    bottom: bottom - by,
});

// A direction, once transformed
const transformDirection = ({ a, b, c, d }: Matrix, { x, y }: Point): Point => ({ x: a * x + c * y, y: b * x + d * y });

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

const allSides = (width: number, height: number): StraightSides => ({
    top: [0, width],
    right: [0, height],
    bottom: [0, width],
    left: [0, height],
});

const roundedSides = (width: number, height: number, radius: number): StraightSides => ({
    top: [radius, width - radius],
    right: [radius, height - radius],
    bottom: [radius, width - radius],
    left: [radius, height - radius],
});

/**
 * The straight parts of the sides of shapes whose sides are mostly straight, from their preset definitions. Other
 * shapes have none, and connectors that meet them at the same connection site stay together.
 */
const straightSidesOf = (options: ShapeChildOptions, width: number, height: number): StraightSides => {
    switch (options.type) {
        case "rectangle":
        case "flowChartProcess":
        case "flowChartPredefinedProcess":
        case "flowChartInternalStorage":
            return allSides(width, height);
        case "roundedRectangle":
            return roundedSides(
                width,
                height,
                (Math.min(width, height) * (createShapeGuides(options.type, options.adjustments).adj ?? 16667)) / 100000,
            );
        case "flowChartAlternateProcess":
            return roundedSides(width, height, Math.min(width, height) / 6);
        case "flowChartTerminator": {
            const end = (width * 3475) / 21600;
            return { top: [end, width - end], bottom: [end, width - end] };
        }
        case "flowChartDocument":
            return { top: [0, width], right: [0, (height * 17322) / 21600], left: [0, (height * 20172) / 21600] };
        default:
            return {};
    }
};

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
 * Gives the band and header of each lane of a layout drawing ids.
 */
const assignLaneIds = (layout?: ShapeLayout): readonly LaneIds[] =>
    layout?.type === "flow"
        ? (layout.lanes ?? []).map(() => [docPropertiesUniqueNumericId(), docPropertiesUniqueNumericId()] as const)
        : [];

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
                // A group's lanes are drawn first, behind its children
                const laneIds = assignLaneIds(options.layout);
                return { kind: "group", options, drawingId, laneIds, children: assignIds(options.children) };
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

/**
 * Places a shape with its box's top-left corner at `position`.
 *
 * @param transformation - The shape's transformation, with its size worked out if it fits its text
 */
const layoutShape = (
    options: ShapeChildOptions,
    transformation: IMediaTransformation,
    drawingId: number,
    position: Point,
    styles: TextStyles,
): PlacedShape => {
    const { rotation: degrees, flip } = transformation;
    const box = boxAt(position, transformation);
    const matrix = placement(box, degrees, flip);
    const sites = shapeSites(options, box.width, box.height);
    const leaf = {
        id: options.id,
        drawingId,
        width: box.width,
        height: box.height,
        sites: sites.length > 0 ? sites : sideMiddles(box.width, box.height),
        matrix,
        straightSides: straightSidesOf(options, box.width, box.height),
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
                    ...createPresetShapeData(options, styles),
                    nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, kind, options),
                },
            },
            box: boundsOfBox(box),
            reach: expand(leafBounds(leaf), getShapeOverhang({ ...options, transformation })),
        },
        leaves: [leaf],
    };
};

const layoutPicture = (options: IShapePictureOptions, drawingId: number, position: Point): PlacedShape => {
    const { rotation: degrees, flip } = options.transformation;
    const box = boxAt(position, options.transformation);
    const leaf = {
        id: options.id,
        drawingId,
        width: box.width,
        height: box.height,
        // A picture is a rectangle, with a rectangle's connection sites
        sites: getConnectionSites("rectangle", box.width, box.height).map((site, index) => ({ ...site, index })),
        matrix: placement(box, degrees, flip),
        straightSides: allSides(box.width, box.height),
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

const pathLength = (points: readonly Point[]): number =>
    points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);

/**
 * The point a distance along a path, and the direction of the path there as a unit vector.
 */
const pointAlong = (points: readonly Point[], distance: number): { readonly point: Point; readonly direction: Point } => {
    const segments = points
        .slice(1)
        .map((end, index) => ({ start: points[index], end, size: Math.hypot(end.x - points[index].x, end.y - points[index].y) }))
        .filter(({ size }) => size > 0);
    if (segments.length === 0) {
        return { point: points[0], direction: { x: 1, y: 0 } };
    }
    const directionOf = ({ start, end, size }: (typeof segments)[number]): Point => ({
        x: (end.x - start.x) / size,
        y: (end.y - start.y) / size,
    });
    // The segment the distance ends in, and how far along it
    const ends = segments.map((_, index) => segments.slice(0, index + 1).reduce((total, { size }) => total + size, 0));
    const within = Math.min(distance, ends[ends.length - 1]);
    const found = ends.findIndex((end) => within <= end);
    const segment = segments[found];
    const along = within - (ends[found] - segment.size);
    const direction = directionOf(segment);
    return { point: { x: segment.start.x + direction.x * along, y: segment.start.y + direction.y * along }, direction };
};

/**
 * The paragraphs a label is written with: centred lines of text given as a string, or the paragraphs it is given.
 */
const labelParagraphs = (label: string | ConnectorLabel, styles: TextStyles): readonly Paragraph[] => {
    const text = typeof label === "string" ? label : label.text;
    return typeof text === "string" ? createTextParagraphs(text, styles) : text;
};

/**
 * The size of a connector's label in pixels: as big as its text, unless it is given a size.
 *
 * @param paragraphs - The label's paragraphs, as they are written
 */
const labelSize = (
    label: string | ConnectorLabel,
    paragraphs: readonly Paragraph[],
    styles: TextStyles,
): { readonly width: number; readonly height: number } => {
    const { width, height } = typeof label === "string" ? { width: undefined, height: undefined } : label;
    const measured =
        width === undefined || height === undefined ? measureText(readTextParagraphs(paragraphs, styles)) : { width: 0, height: 0 };
    return {
        width: width ?? Math.ceil(measured.width * PIXELS_PER_POINT) + LABEL_PADDING.width,
        height: height ?? Math.ceil(measured.height * PIXELS_PER_POINT) + LABEL_PADDING.height,
    };
};

/**
 * A connector's label: a text box without a line, centred on the connector's route. At the start or end of the
 * route it is just clear of the shape, and it moves along the route until it is off every shape and label, if it can,
 * or else beside the route.
 */
const layoutLabel = (
    label: string | ConnectorLabel,
    points: readonly Point[],
    drawingId: number,
    avoid: { readonly boxes: readonly Bounds[]; readonly lines: readonly (readonly Point[])[] },
    styles: TextStyles,
): Placed => {
    const { fill = "none", line = "none", position = "middle" } = typeof label === "string" ? {} : label;
    const paragraphs = labelParagraphs(label, styles);
    const size = labelSize(label, paragraphs, styles);
    const half = { x: (size.width * EMUS_PER_PIXEL) / 2, y: (size.height * EMUS_PER_PIXEL) / 2 };
    // How far the label reaches from its centre in a direction, and a little more
    const reach = ({ x, y }: Point): number => Math.abs(x) * half.x + Math.abs(y) * half.y + LABEL_GAP * EMUS_PER_PIXEL;

    // How far along the route the label is centred: far enough from an end for the label to clear the shape there
    const total = pathLength(points);
    const wanted = {
        start: Math.min(total / 2, reach(pointAlong(points, 0).direction)),
        middle: total / 2,
        end: Math.max(total / 2, total - reach(pointAlong(points, total).direction)),
    }[position];
    const labelBox = (distance: number, side: number): Box => {
        const { point, direction } = pointAlong(points, distance);
        const across = { x: -direction.y, y: direction.x };
        const offset = side * reach(across);
        return {
            x: Math.round(point.x + across.x * offset - half.x),
            y: Math.round(point.y + across.y * offset - half.y),
            width: Math.round(half.x * 2),
            height: Math.round(half.y * 2),
        };
    };
    // Places further and further along the route, either way, then the same beside the route: first on the side
    // further from the shapes and labels
    const step = LABEL_STEP * EMUS_PER_PIXEL;
    const distances = [
        wanted,
        ...Array.from({ length: Math.ceil(total / step) }, (_, index) => [wanted + (index + 1) * step, wanted - (index + 1) * step]).flat(),
    ].filter((distance) => distance >= 0 && distance <= total);
    // How much of the space around a place beside the route, as far again as the label is big, is taken up
    const crowding = (side: number): number => {
        const { x, y, width, height } = labelBox(wanted, side);
        const around = { left: x - width, top: y - height, right: x + 2 * width, bottom: y + 2 * height };
        return avoid.boxes.reduce((taken, other) => taken + overlapArea(around, other), 0);
    };
    const sides = [0, ...(crowding(-1) < crowding(1) ? [-1, 1] : [1, -1])];
    const places = sides.flatMap((side) => distances.map((distance) => labelBox(distance, side)));
    const isClear = (place: Box): boolean =>
        !avoid.boxes.some((other) => overlaps(shrink(boundsOfBox(place), 1), other)) &&
        !avoid.lines.some((route) => route.slice(1).some((to, index) => crossesBox(route[index], to, boundsOfBox(place))));
    const box = places.find(isClear) ?? places[0];

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
 * One end of a connector, once the shape and connection site it attaches to are known.
 */
type ResolvedEnd = {
    readonly leaf: Leaf;
    readonly site: PageSite;
    /** Whether the end was given as a point, which keeps it where it is */
    readonly byPoint: boolean;
    /** Whether the end has an arrowhead */
    readonly arrow: boolean;
};

type ResolvedConnector = {
    readonly node: ConnectorNode;
    readonly ends: readonly [ResolvedEnd, ResolvedEnd];
};

const hasArrow = (line: ShapeLine | undefined, end: "startArrow" | "endArrow"): boolean =>
    typeof line === "object" && line[end] !== undefined;

/**
 * Finds the shapes and connection sites a connector attaches to.
 *
 * @throws If an end names a shape that doesn't exist or isn't in the connector's group, or gives both a side and a point
 */
const resolveConnector = (
    node: ConnectorNode,
    leaves: readonly Leaf[],
    allIds: ReadonlySet<string>,
    sides: { readonly from?: ConnectorSide; readonly to?: ConnectorSide } = {},
): ResolvedConnector => {
    const { options: connector } = node;
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
    const endOf = (end: typeof from, other: typeof from, arrow: boolean, side?: ConnectorSide): ResolvedEnd => ({
        leaf: end.leaf,
        site: end.point
            ? pickNearestSite(end.leaf, end.point)
            : pickSite(end.leaf, end.side ?? side ?? facingSide(leafBounds(end.leaf), leafBounds(other.leaf))),
        byPoint: end.point !== undefined,
        arrow,
    });
    return {
        node,
        ends: [
            endOf(from, to, hasArrow(connector.line, "startArrow"), sides.from),
            endOf(to, from, hasArrow(connector.line, "endArrow"), sides.to),
        ],
    };
};

// The side of a shape a connection site is on, in the shape's own coordinates
const localSideOf = ({ x, y }: LocalSite, { width, height }: Leaf): ConnectorSide | undefined => {
    if (Math.abs(y) < 1) {
        return "top";
    }
    if (Math.abs(y - height) < 1) {
        return "bottom";
    }
    if (Math.abs(x) < 1) {
        return "left";
    }
    return Math.abs(x - width) < 1 ? "right" : undefined;
};

/**
 * Spreads out the ends of connectors that meet at the same connection site along the straight part of its side, so
 * arrowheads don't sit on top of each other, and connectors that join the same two shapes don't overlap. The ends are
 * ordered by where the connectors go, so they don't cross. Ends without arrowheads that fan out to different shapes
 * stay together, as the lines from a box in an org chart do.
 *
 * The ends keep their connection sites, so Word joins them at the site again if a shape is moved.
 */
const spreadEnds = (connectors: readonly ResolvedConnector[]): readonly ResolvedConnector[] => {
    const ends = connectors.flatMap((connector, index) =>
        connector.ends.map((end, which) => ({ key: `${index}:${which}`, index, end, other: connector.ends[1 - which] })),
    );
    const groups = ends
        .filter(({ end }) => !end.byPoint && end.site.index !== undefined)
        .reduce((all, end) => {
            const key = `${end.end.leaf.drawingId}:${end.end.site.index}`;
            return new Map([...all, [key, [...(all.get(key) ?? []), end]]]);
        }, new Map<string, readonly (typeof ends)[number][]>());

    const moved = new Map(
        [...groups.values()].flatMap((members) => {
            const { leaf, site } = members[0].end;
            const local = leaf.sites.find(({ index }) => index === site.index)!;
            const side = localSideOf(local, leaf);
            const straight = side && leaf.straightSides[side];
            const needed =
                members.some(({ end }) => end.arrow) ||
                members.some((member, index) =>
                    members.some((other, otherIndex) => otherIndex !== index && other.other.leaf === member.other.leaf),
                );
            if (members.length < 2 || !straight || !needed) {
                return [];
            }
            // Order the ends along the side by where their other ends are, then by the order of the connectors
            const alongSide = side === "top" || side === "bottom" ? { x: 1, y: 0 } : { x: 0, y: 1 };
            const direction = transformDirection(leaf.matrix, alongSide);
            const towards = ({ end, other }: (typeof members)[number]): number =>
                (other.site.point.x - end.site.point.x) * direction.x + (other.site.point.y - end.site.point.y) * direction.y;
            const ordered = [...members].sort((a, b) =>
                Math.abs(towards(a) - towards(b)) >= 1 ? towards(a) - towards(b) : a.index - b.index,
            );
            return ordered.map(({ key, end }, index): readonly [string, PageSite] => {
                const at = straight[0] + ((straight[1] - straight[0]) * (index + 1)) / (ordered.length + 1);
                const point = side === "top" || side === "bottom" ? { x: at, y: local.y } : { x: local.x, y: at };
                return [key, { ...end.site, point: transformPoint(leaf.matrix, point) }];
            });
        }),
    );

    return connectors.map((connector, index) => ({
        ...connector,
        ends: [
            { ...connector.ends[0], site: moved.get(`${index}:0`) ?? connector.ends[0].site },
            { ...connector.ends[1], site: moved.get(`${index}:1`) ?? connector.ends[1].site },
        ],
    }));
};

/**
 * Whether a straight line passes through a box. A line that only touches its edge, as a connector does where it
 * meets a shape, doesn't.
 */
const crossesBox = (from: Point, to: Point, bounds: Bounds): boolean => {
    const { left, top, right, bottom } = shrink(bounds, EMUS_PER_PIXEL);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // Liang–Barsky clipping: the part of the line inside the box runs from `low` to `high`
    let low = 0;
    let high = 1;
    for (const [step, room] of [
        [-dx, from.x - left],
        [dx, right - from.x],
        [-dy, from.y - top],
        [dy, bottom - from.y],
    ]) {
        if (step === 0) {
            if (room < 0) {
                return false;
            }
            continue;
        }
        const ratio = room / step;
        if (step < 0) {
            low = Math.max(low, ratio);
        } else {
            high = Math.min(high, ratio);
        }
    }
    return left < right && top < bottom && low < high;
};

/**
 * A connector with its route.
 */
type RoutedConnector = ResolvedConnector & {
    readonly route: ConnectorRoute;
    readonly geometry: ConnectorGeometry;
};

/**
 * Routes a connector between the shapes it joins. A connector without a `route` is straight, unless a straight line
 * would go through another shape, when it bends around it.
 */
const routeResolved = (connector: ResolvedConnector, leaves: readonly Leaf[]): RoutedConnector => {
    const {
        node: { options },
        ends: [start, finish],
    } = connector;
    const others = leaves.filter((leaf) => leaf !== start.leaf && leaf !== finish.leaf).map(leafBounds);
    const route = options.route ?? (others.some((shape) => crossesBox(start.site.point, finish.site.point, shape)) ? "elbow" : "straight");
    return {
        ...connector,
        route,
        geometry: routeConnector(route, start.site, finish.site, { margin: marginOf(options), obstacles: leaves.map(leafBounds) }),
    };
};

const marginOf = ({ margin }: IShapeConnectorOptions): number => (margin ?? DEFAULT_CONNECTOR_MARGIN) * EMUS_PER_PIXEL;

/**
 * Moves apart the lines of elbow connectors that would lie on top of each other, unless moving one would take it
 * through more shapes.
 */
const separateRoutes = (routed: readonly RoutedConnector[], leaves: readonly Leaf[]): readonly RoutedConnector[] => {
    const obstacles = leaves.map(leafBounds);
    const separated = separateChannels(
        routed.map(({ route, geometry }) => ({ points: geometry.points, movable: route === "elbow" })),
        CHANNEL_SPACING * EMUS_PER_PIXEL,
    );
    return routed.map((connector, index) => {
        const points = separated[index];
        if (points === connector.geometry.points) {
            return connector;
        }
        const [start, finish] = connector.ends;
        const geometry = fitElbowConnector(start.site, finish.site, points, marginOf(connector.node.options));
        return countRouteCrossings(geometry.points, obstacles) > countRouteCrossings(connector.geometry.points, obstacles)
            ? connector
            : { ...connector, geometry };
    });
};

/**
 * Writes a routed connector, and places its label clear of the shapes, of `labels` and of the other connectors' `lines`.
 * A connector without a `route` is straight, unless a straight line would go through another shape, when it bends
 * around it.
 */
const layoutConnector = (
    { node, ends: [start, finish], route, geometry }: RoutedConnector,
    leaves: readonly Leaf[],
    avoid: { readonly labels: readonly Bounds[]; readonly lines: readonly (readonly Point[])[] },
    styles: TextStyles,
): readonly Placed[] => {
    const { options: connector, drawingId, labelId } = node;
    const obstacles = leaves.map(leafBounds);

    const path = boundsOf(geometry.points);
    const data: PresetShapeCoreOptions =
        geometry.type === "freeform"
            ? {
                  // A route with more bends than the connector presets have is a line that isn't attached to the shapes
                  geometry: {
                      type: "custom",
                      path: geometry.points
                          .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x - path.left} ${y - path.top}`)
                          .join(" "),
                  },
                  line: connector.line,
                  nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "freeform", connector),
              }
            : {
                  geometry: { type: geometry.type, adjustments: geometry.adjustments },
                  line: connector.line,
                  // Attach the connector to shapes with connection sites
                  connections: {
                      start: start.site.index === undefined ? undefined : { id: start.leaf.drawingId, index: start.site.index },
                      end: finish.site.index === undefined ? undefined : { id: finish.leaf.drawingId, index: finish.site.index },
                  },
                  nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, ROUTE_NAMES[route], connector),
              };
    const placed: Placed = {
        child: {
            type: "wps",
            box: { ...geometry.offset, width: geometry.width, height: geometry.height },
            rotation: geometry.rotation,
            flip: { horizontal: geometry.flip.horizontal || undefined, vertical: geometry.flip.vertical || undefined },
            data,
        },
        box: path,
        reach: expand(path, uniformExtent(getShapeLineOverhang(connector.line))),
    };

    return connector.label && labelId !== undefined
        ? [
              placed,
              layoutLabel(
                  connector.label,
                  geometry.points,
                  labelId,
                  { boxes: [...obstacles, ...avoid.labels], lines: avoid.lines },
                  styles,
              ),
          ]
        : [placed];
};

/**
 * A group inside the drawing, with its children laid out, before it is placed.
 */
type InnerGroup = {
    readonly layout: GroupLayout;
    readonly childOffset: Point;
    readonly childExtent: Point;
    /** The group's size in EMUs */
    readonly width: number;
    readonly height: number;
};

const layoutInnerGroup = (node: Extract<Node, { readonly kind: "group" }>, allIds: ReadonlySet<string>, styles: TextStyles): InnerGroup => {
    const inner = layoutGroup(node.children, allIds, styles, node.options.layout, node.laneIds);
    const childOffset = { x: Math.round(inner.box.left), y: Math.round(inner.box.top) };
    const childExtent = { x: Math.round(inner.box.right) - childOffset.x, y: Math.round(inner.box.bottom) - childOffset.y };
    const { width, height } = node.options.transformation ?? {};
    return {
        layout: inner,
        childOffset,
        childExtent,
        width: width === undefined ? childExtent.x : Math.round(width * EMUS_PER_PIXEL),
        height: height === undefined ? childExtent.y : Math.round(height * EMUS_PER_PIXEL),
    };
};

/**
 * Places a group inside the drawing, in the coordinates of the group it is in.
 */
const layoutNestedGroup = (node: Extract<Node, { readonly kind: "group" }>, inner: InnerGroup, position: Point): PlacedShape => {
    const { options, drawingId } = node;
    const { layout, childOffset, childExtent } = inner;
    const { rotation: degrees, flip } = options.transformation ?? {};
    const box = { ...position, width: inner.width, height: inner.height };
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
                children: layout.children,
                nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, "group", options),
            },
            box: boundsOfBox(box),
            reach: transformBounds(matrix, layout.reach),
        },
        leaves: layout.leaves.map((leaf) => ({ ...leaf, matrix: compose(matrix, leaf.matrix) })),
    };
};

/**
 * A shape, picture or group before it is placed: where its `offset` puts it, if it has one, and its size and rotation.
 */
type Sized = {
    readonly node: Exclude<Node, ConnectorNode>;
    readonly offset?: Point;
    /** Size before rotation, in EMUs */
    readonly width: number;
    readonly height: number;
    readonly rotation?: number;
    /** A shape's transformation, with its size worked out if it fits its text */
    readonly transformation?: IMediaTransformation;
    /** A group's children, laid out */
    readonly inner?: InnerGroup;
};

/**
 * Places a shape, picture or group with the top-left corner of its box, before rotation, at a point.
 */
const placeSized = ({ node, transformation, inner }: Sized, position: Point, styles: TextStyles): PlacedShape => {
    switch (node.kind) {
        case "shape":
            return layoutShape(node.options, transformation!, node.drawingId, position, styles);
        case "picture":
            return layoutPicture(node.options, node.drawingId, position);
        default:
            return layoutNestedGroup(node, inner!, position);
    }
};

const sizeNode = (node: Exclude<Node, ConnectorNode>, allIds: ReadonlySet<string>, styles: TextStyles): Sized => {
    switch (node.kind) {
        case "shape": {
            const transformation = resolveShapeSize(node.options, styles);
            const { width, height } = boxAt({ x: 0, y: 0 }, transformation);
            return {
                node,
                offset: offsetOf(transformation.offset),
                width,
                height,
                rotation: transformation.rotation,
                transformation,
            };
        }
        case "picture": {
            const { width, height } = boxAt({ x: 0, y: 0 }, node.options.transformation);
            return {
                node,
                offset: offsetOf(node.options.transformation.offset),
                width,
                height,
                rotation: node.options.transformation.rotation,
            };
        }
        default: {
            const inner = layoutInnerGroup(node, allIds, styles);
            return {
                node,
                offset: offsetOf(node.options.transformation?.offset),
                width: inner.width,
                height: inner.height,
                rotation: node.options.transformation?.rotation,
                inner,
            };
        }
    }
};

/**
 * Where each shape, picture and group goes, and which level of a flow or tree the layout put it on.
 */
type Arrangement = {
    readonly positions: readonly Point[];
    /** The level of each child the layout placed in a flow or tree */
    readonly levels: ReadonlyMap<Sized["node"], number>;
    /** The lanes of a flow, with where their bands and headers go */
    readonly lanes: readonly PlacedLane[];
};

type PlacedLane = {
    readonly lane: ShapeLane;
    readonly band: Box;
    readonly header: Box;
    /** The lane's name, written in its header */
    readonly paragraphs: readonly Paragraph[];
};

/**
 * Where to place each shape, picture and group: at its `offset`, or where the layout puts it. The layout places the
 * box around each rotated child, and follows the connectors between the children it places.
 */
const arrange = (sized: readonly Sized[], connectors: readonly ConnectorNode[], styles: TextStyles, layout?: ShapeLayout): Arrangement => {
    const origin = { x: 0, y: 0 };
    const lanes = lanesOf(layout);
    const laneIndex = ({ node }: Sized): number => {
        const { lane } = node.options;
        const index = lane === undefined ? 0 : lanes.findIndex(({ name }) => name === lane);
        if (index === -1) {
            throw new Error(`Invalid lane "${lane}". The layout has no lane with that name`);
        }
        return index;
    };
    sized.forEach(laneIndex);
    if (!layout) {
        return { positions: sized.map(({ offset }) => offset ?? origin), levels: new Map(), lanes: [] };
    }
    // A connector to a shape inside a group follows the group
    const has = (item: Sized, connectorEnd: ConnectorEnd): boolean => idsOf(item.node).includes(endId(connectorEnd));
    const free = sized.filter((item) => item.offset === undefined);
    // Shapes with an offset that connect to shapes the layout places take part in it, and the layout is placed around them
    const anchors = sized.filter(
        (item) =>
            item.offset !== undefined &&
            connectors.some(
                ({ options: { from, to } }) =>
                    (has(item, from) && free.some((other) => has(other, to))) || (has(item, to) && free.some((other) => has(other, from))),
            ),
    );
    const placed = sized.filter((item) => item.offset === undefined || anchors.includes(item));
    const turned = placed.map((item) => {
        const radians = ((item.rotation ?? 0) * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        return { width: item.width * cos + item.height * sin, height: item.width * sin + item.height * cos, lane: laneIndex(item) };
    });
    const itemWith = (connectorEnd: ConnectorEnd): number => placed.findIndex((item) => has(item, connectorEnd));
    // The levels of a flow or tree leave room for labels along the direction they run in
    const vertical = layout.type === "grid" || layout.direction === undefined || layout.direction === "down" || layout.direction === "up";
    const labelLength = ({ label }: IShapeConnectorOptions): number | undefined => {
        if (label === undefined) {
            return undefined;
        }
        const size = labelSize(label, labelParagraphs(label, styles), styles);
        return (vertical ? size.height : size.width) * EMUS_PER_PIXEL;
    };
    const edges = connectors
        .map(({ options }) => ({
            from: itemWith(options.from),
            to: itemWith(options.to),
            across: layout.type === "grid" ? undefined : sideAcross(options, layout.direction),
            labelLength: layout.type === "grid" ? undefined : labelLength(options),
        }))
        .filter(({ from, to }) => from !== -1 && to !== -1);
    // A lane's header fits its name: when the flow runs down, the header is as long as the name is tall and the lane at
    // least as wide as the name, and when it runs across, the header is as long as the longest name
    const headerParagraphs = lanes.map(({ name }) => createTextParagraphs(name, styles));
    const headerSizes = headerParagraphs.map((paragraphs) => {
        const { width, height } = measureText(readTextParagraphs(paragraphs, styles));
        const [along, across] = vertical ? [height, width] : [width, height];
        return {
            along: (Math.ceil(along * PIXELS_PER_POINT) + 2 * LANE_PADDING) * EMUS_PER_PIXEL,
            across: (Math.ceil(across * PIXELS_PER_POINT) + 2 * LANE_PADDING) * EMUS_PER_PIXEL,
        };
    });
    const headers = { length: Math.max(0, ...headerSizes.map(({ along }) => along)), widths: headerSizes.map(({ across }) => across) };
    const { positions, levels, lanes: laneBoxes = [] } = layoutItems(layout, turned, edges, headers);

    // Centred on whole pixels, with the box before rotation centred in the box around the rotated child
    const snap = (centre: number, length: number): number => Math.round(Math.round(centre / EMUS_PER_PIXEL) * EMUS_PER_PIXEL - length / 2);
    const laidOut = new Map(
        placed.map((item, index) => [
            item,
            {
                x: snap(positions[index].x + turned[index].width / 2, item.width),
                y: snap(positions[index].y + turned[index].height / 2, item.height),
            },
        ]),
    );
    // Moved, by whole pixels, so the shapes with an offset are where it puts them, or as near as they can all be
    const shiftBy = (axis: "x" | "y"): number =>
        Math.round((mean(anchors.map((item) => item.offset![axis] - laidOut.get(item)![axis])) ?? 0) / EMUS_PER_PIXEL) * EMUS_PER_PIXEL;
    const shift = { x: shiftBy("x"), y: shiftBy("y") };
    const shifted = ({ x, y, width, height }: Box): Box => ({ x: Math.round(x + shift.x), y: Math.round(y + shift.y), width, height });
    return {
        positions: sized.map((item) => {
            const position = laidOut.get(item);
            return item.offset ?? { x: position!.x + shift.x, y: position!.y + shift.y };
        }),
        levels: new Map(levels ? placed.map((item, index) => [item.node, levels[index]]) : []),
        lanes: laneBoxes.map(({ band, header }, index) => ({
            lane: lanes[index],
            band: shifted(band),
            header: shifted(header),
            paragraphs: headerParagraphs[index],
        })),
    };
};

const mean = (values: readonly number[]): number | undefined =>
    values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : undefined;

/**
 * The lanes of a flow, with a name for each.
 *
 * @throws If two lanes have the same name
 */
const lanesOf = (layout?: ShapeLayout): readonly ShapeLane[] => {
    const lanes = layout?.type === "flow" ? (layout.lanes ?? []).map((lane) => (typeof lane === "string" ? { name: lane } : lane)) : [];
    const repeated = lanes.find(({ name }, index) => lanes.findIndex((other) => other.name === name) !== index);
    if (repeated) {
        throw new Error(`Invalid lane "${repeated.name}". Each lane in a layout needs a different name`);
    }
    return lanes;
};

/**
 * A lane's band, drawn behind the shapes in it, and its header, with its name in it.
 */
const layoutLane = ({ lane, band, header, paragraphs }: PlacedLane, [bandId, headerId]: LaneIds, styles: TextStyles): readonly Placed[] => {
    const line = lane.line ?? LANE_LINE;
    const overhang = uniformExtent(getShapeLineOverhang(line));
    const pixels = ({ width, height }: Box): { readonly width: number; readonly height: number } => ({
        width: width / EMUS_PER_PIXEL,
        height: height / EMUS_PER_PIXEL,
    });
    return [
        {
            child: {
                type: "wps",
                box: band,
                data: {
                    ...createPresetShapeData({ type: "rectangle", transformation: pixels(band), fill: lane.fill, line }, styles),
                    // Screen readers read the lane's name in its header, and skip its band
                    nonVisualDrawingProperties: createNonVisualDrawingProperties(bandId, "rectangle", {
                        altText: { name: lane.name },
                        decorative: true,
                    }),
                },
            },
            box: boundsOfBox(band),
            reach: expand(boundsOfBox(band), overhang),
        },
        {
            child: {
                type: "wps",
                box: header,
                data: {
                    ...createPresetShapeData(
                        {
                            type: "rectangle",
                            transformation: pixels(header),
                            fill: lane.headerFill ?? LANE_HEADER_FILL,
                            line,
                            children: paragraphs,
                            textOptions: { margins: { top: 0, right: 0, bottom: 0, left: 0 }, wrap: false, verticalAlignment: "center" },
                        },
                        styles,
                    ),
                    nonVisualDrawingProperties: createNonVisualDrawingProperties(headerId, "textBox", {}),
                },
            },
            box: boundsOfBox(header),
            reach: expand(boundsOfBox(header), overhang),
        },
    ];
};

/**
 * Which way across the levels a connector with a side goes: leaving the right of a shape in a flow that runs down puts
 * the shape it leads to on the right, and so does arriving at the left of it.
 */
const sideAcross = (connector: IShapeConnectorOptions, direction: ShapeLayoutDirection = "down"): -1 | 1 | undefined => {
    const [before, after]: readonly [ConnectorSide, ConnectorSide] =
        direction === "down" || direction === "up" ? ["left", "right"] : ["top", "bottom"];
    const sideOf = (connectorEnd: ConnectorEnd): ConnectorSide | undefined =>
        typeof connectorEnd === "string" ? undefined : connectorEnd.side;
    const from = sideOf(connector.from);
    if (from === before || from === after) {
        return from === after ? 1 : -1;
    }
    const to = sideOf(connector.to);
    if (to === before || to === after) {
        return to === before ? 1 : -1;
    }
    return undefined;
};

// The sides connectors leave and arrive at between levels of a flow or tree, and the side connectors that lead back use
const LEVEL_SIDES: Readonly<
    Record<ShapeLayoutDirection, { readonly leave: ConnectorSide; readonly arrive: ConnectorSide; readonly back: ConnectorSide }>
> = {
    down: { leave: "bottom", arrive: "top", back: "right" },
    up: { leave: "top", arrive: "bottom", back: "right" },
    right: { leave: "right", arrive: "left", back: "bottom" },
    left: { leave: "left", arrive: "right", back: "bottom" },
};

const endId = (connectorEnd: ConnectorEnd): string => (typeof connectorEnd === "string" ? connectorEnd : connectorEnd.id);

/**
 * The sides a connector between levels of a flow or tree attaches to, unless it gives its own: it leaves one level
 * towards the next and arrives from the one before. A connector back to the level before goes the other way between
 * the same sides, and one that leads further back goes out of the side of both shapes and loops round.
 */
const levelSides = (
    connector: IShapeConnectorOptions,
    levelOf: (id: string) => number | undefined,
    direction: ShapeLayoutDirection = "down",
): { readonly from?: ConnectorSide; readonly to?: ConnectorSide } => {
    const from = levelOf(endId(connector.from));
    const to = levelOf(endId(connector.to));
    if (from === undefined || to === undefined || from === to) {
        return {};
    }
    const sides = LEVEL_SIDES[direction];
    if (to > from) {
        return { from: sides.leave, to: sides.arrive };
    }
    return to === from - 1 ? { from: sides.arrive, to: sides.leave } : { from: sides.back, to: sides.back };
};

/**
 * Lays out the children of a group: first the shapes, pictures and groups, then the connectors between them.
 */
const layoutGroup = (
    nodes: readonly Node[],
    allIds: ReadonlySet<string>,
    styles: TextStyles,
    layout?: ShapeLayout,
    laneIds: readonly LaneIds[] = [],
): GroupLayout => {
    if (nodes.length === 0) {
        throw new Error("Invalid shape group. Expected at least 1 child shape");
    }

    // Shapes, pictures and groups first, so connectors can attach to any of them
    const connectors = nodes.filter((node): node is ConnectorNode => node.kind === "connector");
    const sized = nodes
        .filter((node): node is Exclude<Node, ConnectorNode> => node.kind !== "connector")
        .map((node) => sizeNode(node, allIds, styles));
    const { positions, levels, lanes } = arrange(sized, connectors, styles, layout);
    const shapes = new Map(sized.map((item, index) => [item.node, placeSized(item, positions[index], styles)] as const));
    const leaves = [...shapes.values()].flatMap(({ leaves: shapeLeaves }) => shapeLeaves);
    const levelOf = (id: string): number | undefined => {
        const item = sized.find(({ node }) => idsOf(node).includes(id));
        return item && levels.get(item.node);
    };
    const resolved = spreadEnds(
        connectors.map((connector) =>
            resolveConnector(
                connector,
                leaves,
                allIds,
                layout && layout.type !== "grid" ? levelSides(connector.options, levelOf, layout.direction) : {},
            ),
        ),
    );
    // Connectors are routed, then moved apart where they lie on top of each other, and each label keeps clear of the
    // other connectors and the labels before it
    const separated = separateRoutes(
        resolved.map((connector) => routeResolved(connector, leaves)),
        leaves,
    );
    const routed = separated.reduce(
        ({ connectors: done, labels }, connector) => {
            const lines = separated.filter((other) => other !== connector).map(({ geometry }) => geometry.points);
            const pieces = layoutConnector(connector, leaves, { labels, lines }, styles);
            return {
                connectors: new Map([...done, [connector.node, pieces]]),
                labels: [...labels, ...pieces.slice(1).map(({ box }) => box)],
            };
        },
        { connectors: new Map<ConnectorNode, readonly Placed[]>(), labels: [] as readonly Bounds[] },
    ).connectors;

    // The lanes are drawn first, then everything in the order it is given
    const placed = [
        ...lanes.flatMap((lane, index) => layoutLane(lane, laneIds[index], styles)),
        ...nodes.flatMap((node) => (node.kind === "connector" ? routed.get(node)! : [shapes.get(node)!.placed])),
    ];
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
 * The children of a group or canvas, with the drawing ids they are written with.
 */
export type ShapeDrawingNodes = {
    readonly nodes: readonly Node[];
    /** The `id` of every shape and picture */
    readonly ids: ReadonlySet<string>;
    /** The drawing ids of the band and header of each lane of the layout */
    readonly laneIds: readonly LaneIds[];
};

/**
 * Gives the children of a group or canvas their drawing ids. Every shape, picture, group and connector identifies
 * itself with a cNvPr, which needs an id that is unique in the document.
 *
 * @throws If two shapes or pictures have the same `id`
 */
export const createShapeDrawingNodes = (children: readonly IShapeGroupChildOptions[], layout?: ShapeLayout): ShapeDrawingNodes => {
    // The lanes are drawn first, behind the children
    const laneIds = assignLaneIds(layout);
    const nodes = assignIds(children);
    return { nodes, ids: collectIds(nodes), laneIds };
};

/**
 * Lays out the shapes, pictures, groups and connectors of a group or canvas. They are drawn in the order given,
 * and connectors can attach to shapes that come after them.
 *
 * @param children - The children, or the children with their drawing ids
 * @param options.keepPositive - Moves everything right and down, if needed, so nothing that is drawn is above or to the left of (0, 0)
 * @param options.layout - Places the children that have no `offset`
 * @param options.styles - The document's styles, which text is measured in. Default is Word's own defaults
 * @throws If a group has no children, two shapes have the same `id`, a connector refers to an `id` no shape in its group has, or a shape to a lane the layout doesn't have
 */
export const layoutShapeDrawing = (
    children: readonly IShapeGroupChildOptions[] | ShapeDrawingNodes,
    {
        keepPositive = false,
        layout: shapeLayout,
        styles = WORD_DEFAULT_STYLES,
    }: { readonly keepPositive?: boolean; readonly layout?: ShapeLayout; readonly styles?: TextStyles } = {},
): ShapeDrawingLayout => {
    const { nodes, ids, laneIds } = "nodes" in children ? children : createShapeDrawingNodes(children, shapeLayout);
    const layout = layoutGroup(nodes, ids, styles, shapeLayout, laneIds);
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
 * The paragraphs of text in a shape whose size or text depends on the document's styles, or nothing if they don't:
 * its size fits its text, or its `text` is written to suit them.
 */
export const shapeStyledParagraphs = ({
    transformation,
    text,
    children = [],
}: Pick<ShapeBaseOptions, "transformation" | "text" | "children">): readonly Paragraph[] | undefined =>
    transformation.width === "fitText" || transformation.height === "fitText" || text !== undefined ? children : undefined;

/**
 * The paragraphs of text in a group or canvas whose layout depends on the document's styles, or nothing if it doesn't:
 * a shape in it fits its text or has `text`, a label is sized to its text or has text given as a string, or its layout
 * has lanes, whose headers fit their names.
 */
export const drawingStyledParagraphs = (
    children: readonly IShapeGroupChildOptions[],
    layout?: ShapeLayout,
): readonly Paragraph[] | undefined => {
    const found = children.map((child): readonly Paragraph[] | undefined => {
        switch (child.type) {
            case "connector": {
                const label = typeof child.label === "string" ? { text: child.label } : child.label;
                if (label === undefined || (typeof label.text !== "string" && label.width !== undefined && label.height !== undefined)) {
                    return undefined;
                }
                return typeof label.text === "string" ? [] : label.text;
            }
            case "picture":
                return undefined;
            case "group":
                return drawingStyledParagraphs(child.children, child.layout);
            default:
                return shapeStyledParagraphs(child);
        }
    });
    const hasLanes = layout?.type === "flow" && layout.lanes !== undefined && layout.lanes.length > 0;
    return hasLanes || found.some((paragraphs) => paragraphs !== undefined) ? found.flatMap((paragraphs) => paragraphs ?? []) : undefined;
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
