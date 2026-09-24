/**
 * Routes a connector between two points on two shapes, as Word does: it picks the connector preset,
 * the box the connector is drawn in, the rotation and flips that point it the right way, and where it bends.
 *
 * Every connector preset runs from the top-left corner of its box to the bottom-right corner, so the box is
 * spanned by the two ends. An elbow connector's bends are adjustments, measured along the box. A bend can be
 * outside the box, which is how a connector loops around a shape.
 *
 * @module
 */
import type { PresetShapeType } from "../preset-shape/preset-shape-type";

/**
 * A point, in EMUs.
 */
export type Point = {
    readonly x: number;
    readonly y: number;
};

/**
 * One end of a connector.
 */
export type ConnectorEndpoint = {
    /** Where the connector meets the shape */
    readonly point: Point;
    /** The direction the connector leaves the shape in, in degrees clockwise from 3 o'clock. It is rounded to a multiple of 90 */
    readonly angle: number;
};

/**
 * How a connector gets from one shape to the other: in a straight line, with right-angled bends, or with curves.
 *
 * @publicApi
 */
export type ConnectorRoute = "straight" | "elbow" | "curved";

/**
 * The shape that draws a connector.
 */
export type ConnectorGeometry = {
    readonly type: PresetShapeType;
    /** Where the connector bends, as percentages of its box */
    readonly adjustments: Readonly<Record<string, number>>;
    /** Top-left corner of the box, before rotation */
    readonly offset: Point;
    /** Size of the box, before rotation */
    readonly width: number;
    readonly height: number;
    /** Clockwise rotation in degrees: 0, or 90 when the connector leaves its first shape vertically */
    readonly rotation: number;
    readonly flip: { readonly horizontal: boolean; readonly vertical: boolean };
    /** The ends and corners of the path */
    readonly points: readonly Point[];
};

// Right, down, left and up: the four directions a connector can leave a shape in
const DIRECTIONS: readonly Point[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
];

// How far an elbow connector goes past a shape before turning back: a quarter of an inch
const CONNECTOR_MARGIN = 228600;
// The shortest box side a bend outside the box can be measured along: one pixel
const MIN_BEND_LENGTH = 9525;

const PRESETS: Readonly<Record<Exclude<ConnectorRoute, "straight">, readonly PresetShapeType[]>> = {
    elbow: ["elbowConnectorOneBend", "elbowConnector", "elbowConnectorThreeBends", "elbowConnectorFourBends"],
    curved: ["curvedConnectorOneBend", "curvedConnector", "curvedConnectorThreeBends", "curvedConnectorFourBends"],
};

const dot = (a: Point, b: Point): number => a.x * b.x + a.y * b.y;
const negate = (a: Point): Point => ({ x: -a.x, y: -a.y });

const directionOf = (angle: number): Point => DIRECTIONS[(((Math.round(angle / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3];

/**
 * A path in the connector's own box: `ex` and `ey` are the page directions of the box's x and y axes,
 * and `points` are in box coordinates, from (0, 0) to (width, height).
 */
type BoxPath = {
    readonly ex: Point;
    readonly ey: Point;
    readonly width: number;
    readonly height: number;
    readonly points: readonly Point[];
    readonly adjustments: Readonly<Record<string, number>>;
};

const percentOf = (value: number, length: number): number => (length === 0 ? 50 : (value / length) * 100);

/**
 * The box an elbow connector is drawn in: the page directions of its x and y axes, its size, and whether the
 * connector leaves and arrives going forwards (+1) or backwards (-1) along the axis it leaves or arrives on.
 */
type BoxFrame = {
    readonly ex: Point;
    readonly ey: Point;
    readonly width: number;
    readonly height: number;
    readonly leavingSign: number;
    readonly arrivingSign: number;
};

// Leaving and arriving along the x axis in the same direction: go out past the start, across, and come back in past the end
const findDoubleBackPath = ({ ex, ey, width, height, leavingSign, arrivingSign }: BoxFrame): BoxPath => {
    const w = Math.max(width, MIN_BEND_LENGTH);
    const x1 = leavingSign * CONNECTOR_MARGIN;
    const x3 = w - arrivingSign * CONNECTOR_MARGIN;
    const y2 = height / 2;
    return {
        ex,
        ey,
        width: w,
        height,
        points: [
            { x: 0, y: 0 },
            { x: x1, y: 0 },
            { x: x1, y: y2 },
            { x: x3, y: y2 },
            { x: x3, y: height },
            { x: w, y: height },
        ],
        adjustments: { firstBendX: percentOf(x1, w), secondBendY: percentOf(y2, height), thirdBendX: percentOf(x3, w) },
    };
};

// Leaving and arriving along the x axis
const findParallelPath = (frame: BoxFrame): BoxPath => {
    const { ex, ey, width, height, leavingSign, arrivingSign } = frame;
    const facing = leavingSign === arrivingSign;
    if (facing && (leavingSign < 0 || width === 0)) {
        return findDoubleBackPath(frame);
    }

    // Facing ends bend halfway. Otherwise the connector loops past the shape it has to go around
    const w = facing ? width : Math.max(width, MIN_BEND_LENGTH);
    const loop = leavingSign > 0 ? w + CONNECTOR_MARGIN : -CONNECTOR_MARGIN;
    const x1 = facing ? w / 2 : loop;
    return {
        ex,
        ey,
        width: w,
        height,
        points: [
            { x: 0, y: 0 },
            { x: x1, y: 0 },
            { x: x1, y: height },
            { x: w, y: height },
        ],
        adjustments: { bendX: percentOf(x1, w) },
    };
};

// Leaving along the x axis and arriving along the y axis
const findRightAnglePath = ({ ex, ey, width, height, leavingSign, arrivingSign }: BoxFrame): BoxPath => {
    if (leavingSign > 0 && arrivingSign > 0) {
        return {
            ex,
            ey,
            width,
            height,
            points: [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: height },
            ],
            adjustments: {},
        };
    }

    // Go back past the start, or past the end, before turning
    const w = leavingSign > 0 ? width : Math.max(width, MIN_BEND_LENGTH);
    const h = arrivingSign > 0 ? height : Math.max(height, MIN_BEND_LENGTH);
    const x1 = leavingSign > 0 ? w / 2 : -CONNECTOR_MARGIN;
    const y2 = arrivingSign > 0 ? h / 2 : h + CONNECTOR_MARGIN;
    return {
        ex,
        ey,
        width: w,
        height: h,
        points: [
            { x: 0, y: 0 },
            { x: x1, y: 0 },
            { x: x1, y: y2 },
            { x: w, y: y2 },
            { x: w, y: h },
        ],
        adjustments: { firstBendX: percentOf(x1, w), secondBendY: percentOf(y2, h) },
    };
};

/**
 * Finds the path of an elbow connector in box coordinates. Its first segment always runs along the box's x axis.
 *
 * - When the ends leave and arrive in parallel directions, the path has 3 segments (1 bend position),
 *   or 5 (3 bend positions) when it has to double back to arrive from behind.
 * - When the directions are at right angles, it has 2 segments (no adjustments), or 4 (2 bend positions).
 */
const findElbowPath = (start: ConnectorEndpoint, end: ConnectorEndpoint): BoxPath => {
    const offset = { x: end.point.x - start.point.x, y: end.point.y - start.point.y };
    const leaving = directionOf(start.angle);
    const arriving = negate(directionOf(end.angle));

    // Point the box's axes towards the end, so its width and height are not negative
    const ex = dot(offset, leaving) >= 0 ? leaving : negate(leaving);
    const across = { x: -ex.y, y: ex.x };
    const ey = dot(offset, across) >= 0 ? across : negate(across);
    const parallel = dot(arriving, ex) !== 0;
    const frame = {
        ex,
        ey,
        width: dot(offset, ex),
        height: dot(offset, ey),
        leavingSign: dot(leaving, ex),
        arrivingSign: parallel ? dot(arriving, ex) : dot(arriving, ey),
    };

    return parallel ? findParallelPath(frame) : findRightAnglePath(frame);
};

const findStraightPath = (start: ConnectorEndpoint, end: ConnectorEndpoint): BoxPath => {
    const offset = { x: end.point.x - start.point.x, y: end.point.y - start.point.y };
    const width = Math.abs(offset.x);
    const height = Math.abs(offset.y);
    return {
        ex: { x: offset.x < 0 ? -1 : 1, y: 0 },
        ey: { x: 0, y: offset.y < 0 ? -1 : 1 },
        width,
        height,
        points: [
            { x: 0, y: 0 },
            { x: width, y: height },
        ],
        adjustments: {},
    };
};

/**
 * Finds the preset, box, rotation, flips and adjustments of a connector between two shapes.
 *
 * A straight connector joins the two points directly. Elbow and curved connectors leave and arrive
 * at right angles to the shapes, in the direction of each end's `angle`.
 */
export const routeConnector = (route: ConnectorRoute, start: ConnectorEndpoint, end: ConnectorEndpoint): ConnectorGeometry => {
    const path = route === "straight" ? findStraightPath(start, end) : findElbowPath(start, end);
    const { ex, ey, width, height } = path;
    const toPage = ({ x, y }: Point): Point => ({
        x: start.point.x + ex.x * x + ey.x * y,
        y: start.point.y + ex.y * x + ey.y * y,
    });

    // The box is written before it is flipped and rotated about its centre
    const centre = toPage({ x: width / 2, y: height / 2 });
    const vertical = ex.x === 0;

    return {
        type: route === "straight" ? "straightConnector" : PRESETS[route][path.points.length - 3],
        adjustments: path.adjustments,
        offset: { x: centre.x - width / 2, y: centre.y - height / 2 },
        width,
        height,
        rotation: vertical ? 90 : 0,
        // Rotating by 90 degrees turns the box's x axis downwards and its y axis to the left
        flip: vertical ? { horizontal: ex.y < 0, vertical: ey.x > 0 } : { horizontal: ex.x < 0, vertical: ey.y < 0 },
        points: path.points.map(toPage),
    };
};
