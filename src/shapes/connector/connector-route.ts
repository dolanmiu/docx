/**
 * Routes a connector between two points on two shapes, as Word does: it picks the connector preset,
 * the box the connector is drawn in, the rotation and flips that point it the right way, and where it bends.
 *
 * Every connector preset runs from the top-left corner of its box to the bottom-right corner, so the box is
 * spanned by the two ends. An elbow connector's bends are adjustments, measured along the box. A bend can be
 * outside the box, which is how a connector loops around a shape.
 *
 * When an elbow or curved connector's usual route would cross other shapes, the router looks for a route
 * with up to four bends that goes around them. An elbow connector that needs more bends is drawn as a freeform line.
 *
 * @module
 */
import { findOrthogonalRoute } from "./orthogonal-route";
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
 * A box on the page, in EMUs.
 */
export type Bounds = {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};

/**
 * Options for routing a connector.
 */
export type ConnectorRouteOptions = {
    /** How far, in EMUs, an elbow or curved connector goes past a shape before turning. Default is a quarter of an inch */
    readonly margin?: number;
    /** Shapes, in EMUs, that elbow and curved connectors go around when they can */
    readonly obstacles?: readonly Bounds[];
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
    /**
     * The connector preset, or a freeform line for an elbow route with more bends than the presets have. A freeform
     * line isn't attached to the shapes it joins
     */
    readonly type: PresetShapeType | "freeform";
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

// How far an elbow connector goes past a shape before turning back, unless told otherwise: a quarter of an inch
const DEFAULT_MARGIN = 228600;
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
    /** Whether the connector arrives along the x axis, as it leaves, rather than the y axis */
    readonly parallel: boolean;
    readonly margin: number;
};

// Leaving and arriving along the x axis in the same direction: go out past the start, across, and come back in past the end
const findDoubleBackPath = ({ ex, ey, width, height, leavingSign, arrivingSign, margin }: BoxFrame): BoxPath => {
    const w = Math.max(width, MIN_BEND_LENGTH);
    const x1 = leavingSign * margin;
    const x3 = w - arrivingSign * margin;
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
    const { ex, ey, width, height, leavingSign, arrivingSign, margin } = frame;
    const facing = leavingSign === arrivingSign;
    if (facing && (leavingSign < 0 || width === 0)) {
        return findDoubleBackPath(frame);
    }

    // Facing ends bend halfway. Otherwise the connector loops past the shape it has to go around
    const w = facing ? width : Math.max(width, MIN_BEND_LENGTH);
    const loop = leavingSign > 0 ? w + margin : -margin;
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
const findRightAnglePath = ({ ex, ey, width, height, leavingSign, arrivingSign, margin }: BoxFrame): BoxPath => {
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
    const x1 = leavingSign > 0 ? w / 2 : -margin;
    const y2 = arrivingSign > 0 ? h / 2 : h + margin;
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
const findElbowFrame = (start: ConnectorEndpoint, end: ConnectorEndpoint, margin: number): BoxFrame => {
    const offset = { x: end.point.x - start.point.x, y: end.point.y - start.point.y };
    const leaving = directionOf(start.angle);
    const arriving = negate(directionOf(end.angle));

    // Point the box's axes towards the end, so its width and height are not negative
    const ex = dot(offset, leaving) >= 0 ? leaving : negate(leaving);
    const across = { x: -ex.y, y: ex.x };
    const ey = dot(offset, across) >= 0 ? across : negate(across);
    const parallel = dot(arriving, ex) !== 0;
    return {
        ex,
        ey,
        width: dot(offset, ex),
        height: dot(offset, ey),
        leavingSign: dot(leaving, ex),
        arrivingSign: parallel ? dot(arriving, ex) : dot(arriving, ey),
        parallel,
        margin,
    };
};

const findElbowPath = (frame: BoxFrame): BoxPath => (frame.parallel ? findParallelPath(frame) : findRightAnglePath(frame));

/**
 * The obstacles a path goes through, or goes nearer to than `clearance`. A path that only touches an obstacle's edge,
 * as a connector does where it meets a shape, doesn't go through it.
 */
export const countRouteCrossings = (points: readonly Point[], obstacles: readonly Bounds[], clearance = 0): number =>
    obstacles.filter((obstacle) =>
        points.slice(1).some((to, index) => {
            const from = points[index];
            // Each segment is horizontal or vertical, so it crosses the obstacle if it overlaps its inside on both axes
            const overlaps = (a: number, b: number, low: number, high: number): boolean =>
                Math.max(Math.min(a, b), low + 1) < Math.min(Math.max(a, b), high - 1) || (a === b && a > low + 1 && a < high - 1);
            return (
                overlaps(from.x, to.x, obstacle.left - clearance, obstacle.right + clearance) &&
                overlaps(from.y, to.y, obstacle.top - clearance, obstacle.bottom + clearance)
            );
        }),
    ).length;

const pathLength = (points: readonly Point[]): number =>
    points.slice(1).reduce((length, to, index) => length + Math.abs(to.x - points[index].x) + Math.abs(to.y - points[index].y), 0);

const unique = (values: readonly number[]): readonly number[] => [...new Set(values.map((value) => Math.round(value)))];

// Keep the number of routes tried small enough to be quick, even with many shapes
const MAX_OBSTACLES_TRIED = 12;

/**
 * Finds an elbow path in the frame's box that goes through as few obstacles as it can, then is as short as it can be,
 * then bends as few times as it can.
 *
 * The path leaves along the box's x axis and arrives along the axis the frame gives. Its bends are tried on lines
 * a margin away from the ends and from each obstacle, and halfway between the ends.
 */
const findAvoidingPath = (frame: BoxFrame, obstacles: readonly Bounds[], toPage: (point: Point) => Point): BoxPath | undefined => {
    const { ex, ey, width, height, leavingSign, arrivingSign, parallel, margin } = frame;
    // Obstacles in box coordinates
    const origin = toPage({ x: 0, y: 0 });
    const inBox = obstacles.map((obstacle) => {
        const corners = [
            { x: obstacle.left, y: obstacle.top },
            { x: obstacle.right, y: obstacle.bottom },
        ].map((corner) => ({
            x: dot({ x: corner.x - origin.x, y: corner.y - origin.y }, ex),
            y: dot({ x: corner.x - origin.x, y: corner.y - origin.y }, ey),
        }));
        return {
            left: Math.min(corners[0].x, corners[1].x),
            right: Math.max(corners[0].x, corners[1].x),
            top: Math.min(corners[0].y, corners[1].y),
            bottom: Math.max(corners[0].y, corners[1].y),
        };
    });

    // Bends are tried around the obstacles nearest the middle of the box
    const distance = ({ left, right, top, bottom }: Bounds): number => Math.abs(left + right - width) + Math.abs(top + bottom - height);
    const nearest = [...inBox].sort((a, b) => distance(a) - distance(b)).slice(0, MAX_OBSTACLES_TRIED);
    const xs = unique([
        width / 2,
        -margin,
        margin,
        width - margin,
        width + margin,
        ...nearest.flatMap(({ left, right }) => [left - margin, right + margin]),
    ]);
    const ys = unique([
        height / 2,
        -margin,
        margin,
        height - margin,
        height + margin,
        ...nearest.flatMap(({ top, bottom }) => [top - margin, bottom + margin]),
    ]);

    const w = Math.max(width, MIN_BEND_LENGTH);
    const h = Math.max(height, MIN_BEND_LENGTH);
    const leaves = (x1: number): boolean => x1 * leavingSign > 0;
    const candidates: readonly BoxPath[] = parallel
        ? [
              ...xs
                  .filter((x1) => leaves(x1) && (w - x1) * arrivingSign > 0)
                  .map((x1) => ({
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
                  })),
              ...xs.filter(leaves).flatMap((x1) =>
                  ys.flatMap((y2) =>
                      xs
                          .filter((x3) => (w - x3) * arrivingSign > 0)
                          .map((x3) => ({
                              ex,
                              ey,
                              width: w,
                              // The middle bend is measured along the box's height, so the box can't be flat
                              height: h,
                              points: [
                                  { x: 0, y: 0 },
                                  { x: x1, y: 0 },
                                  { x: x1, y: y2 },
                                  { x: x3, y: y2 },
                                  { x: x3, y: h },
                                  { x: w, y: h },
                              ],
                              adjustments: {
                                  firstBendX: percentOf(x1, w),
                                  secondBendY: percentOf(y2, h),
                                  thirdBendX: percentOf(x3, w),
                              },
                          })),
                  ),
              ),
          ]
        : [
              ...(width * leavingSign > 0 && height * arrivingSign > 0
                  ? [
                        {
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
                        },
                    ]
                  : []),
              ...xs.filter(leaves).flatMap((x1) =>
                  ys
                      .filter((y2) => (h - y2) * arrivingSign > 0)
                      .map((y2) => ({
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
                      })),
              ),
          ];

    // Only obstacles within a margin of the box around every path can be crossed or passed
    const onPage = candidates.map((path) => ({ path, points: path.points.map(toPage) }));
    const reach = expandBounds(boundsOfPoints(onPage.flatMap(({ points }) => points)), margin);
    const near = obstacles.filter((obstacle) => boundsOverlap(obstacle, reach));

    // Fewest obstacles crossed, then fewest passed within a margin, then the shortest, counting each bend as a margin's
    // length. Each measure is only taken for the paths that are best by the ones before it
    type Candidate = (typeof onPage)[number];
    const measures: readonly ((candidate: Candidate) => number)[] = [
        ({ points }) => countRouteCrossings(points, near),
        ({ points }) => countRouteCrossings(points, near, margin),
        ({ path }) => pathLength(path.points) + (path.points.length - 2) * margin,
    ];
    const best = measures.reduce<readonly Candidate[]>((remaining, measure) => {
        const measured = remaining.map((candidate) => ({ candidate, value: measure(candidate) }));
        const least = Math.min(...measured.map(({ value }) => value));
        return measured.filter(({ value }) => value === least).map(({ candidate }) => candidate);
    }, onPage);
    return best[0]?.path;
};

const boundsOfPoints = (points: readonly Point[]): Bounds => ({
    left: Math.min(...points.map(({ x }) => x)),
    top: Math.min(...points.map(({ y }) => y)),
    right: Math.max(...points.map(({ x }) => x)),
    bottom: Math.max(...points.map(({ y }) => y)),
});

const expandBounds = ({ left, top, right, bottom }: Bounds, by: number): Bounds => ({
    left: left - by,
    top: top - by,
    right: right + by,
    bottom: bottom + by,
});

const boundsOverlap = (a: Bounds, b: Bounds): boolean => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;

const pageMapping =
    (start: ConnectorEndpoint, ex: Point, ey: Point): ((point: Point) => Point) =>
    ({ x, y }: Point): Point => ({
        x: start.point.x + ex.x * x + ey.x * y,
        y: start.point.y + ex.y * x + ey.y * y,
    });

/**
 * The usual elbow path between two ends, or one that goes around the obstacles the usual path goes through. An elbow
 * connector that can't get around them with four bends takes a route with more, if there is one.
 *
 * @returns The path in its box, or the corners of a route with more bends, on the page
 */
const findRoutedPath = (
    route: Exclude<ConnectorRoute, "straight">,
    start: ConnectorEndpoint,
    end: ConnectorEndpoint,
    margin: number,
    obstacles: readonly Bounds[],
): BoxPath | readonly Point[] => {
    const frame = findElbowFrame(start, end, margin);
    const path = findElbowPath(frame);
    const toPage = pageMapping(start, frame.ex, frame.ey);
    const crossings = countRouteCrossings(path.points.map(toPage), obstacles);
    if (crossings === 0) {
        return path;
    }

    const avoiding = findAvoidingPath(frame, obstacles, toPage);
    const best = avoiding && countRouteCrossings(avoiding.points.map(toPage), obstacles) < crossings ? avoiding : path;
    if (route === "curved" || countRouteCrossings(best.points.map(toPage), obstacles) === 0) {
        return best;
    }
    const detour = findOrthogonalRoute(start, end, margin, obstacles);
    if (!detour || countRouteCrossings(detour, obstacles) > 0) {
        return best;
    }
    return toBoxPath(frame, detour.map(toBox(start, frame))) ?? detour;
};

// Moves a point on the page into a connector's box
const toBox =
    (start: ConnectorEndpoint, { ex, ey }: BoxFrame): ((point: Point) => Point) =>
    (point: Point): Point => {
        const offset = { x: point.x - start.point.x, y: point.y - start.point.y };
        return { x: dot(offset, ex), y: dot(offset, ey) };
    };

// The adjustments of the elbow connector presets with two, three and four bends, in the order the bends come
const BEND_ADJUSTMENTS: Readonly<Record<number, readonly string[]>> = {
    2: ["bendX"],
    3: ["firstBendX", "secondBendY"],
    4: ["firstBendX", "secondBendY", "thirdBendX"],
};

/**
 * The elbow connector preset that draws a route with two to four bends. A route that leaves along the box's x axis and
 * arrives along the axis the frame gives bends as one of the presets does, with its bends where the preset's adjustments
 * put them. A route with one bend has its bend where the usual route does, so it is never a detour.
 *
 * @param points - The route's ends and corners, in box coordinates
 */
const toBoxPath = ({ ex, ey, width, height }: BoxFrame, points: readonly Point[]): BoxPath | undefined => {
    const corners = points.slice(1, -1);
    const names = BEND_ADJUSTMENTS[corners.length] as readonly string[] | undefined;
    if (!names) {
        return undefined;
    }
    // Bends are measured along the box, so the box can't be flat
    const w = Math.max(width, MIN_BEND_LENGTH);
    const h = Math.max(height, MIN_BEND_LENGTH);
    // The preset ends at the far corner of the box, and its last corner lines up with it
    const last = corners[corners.length - 1];
    return {
        ex,
        ey,
        width: w,
        height: h,
        points: [...points.slice(0, -2), corners.length % 2 === 0 ? { x: last.x, y: h } : { x: w, y: last.y }, { x: w, y: h }],
        adjustments: Object.fromEntries(
            names.map((name, index) => [name, index % 2 === 0 ? percentOf(corners[index].x, w) : percentOf(corners[index].y, h)]),
        ),
    };
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
 * at right angles to the shapes, in the direction of each end's `angle`, and go around `obstacles` when they can.
 *
 * @throws If the margin is negative
 */
export const routeConnector = (
    route: ConnectorRoute,
    start: ConnectorEndpoint,
    end: ConnectorEndpoint,
    { margin = DEFAULT_MARGIN, obstacles = [] }: ConnectorRouteOptions = {},
): ConnectorGeometry => {
    if (!(margin >= 0)) {
        throw new Error(`Invalid connector margin ${margin}. Expected a distance of 0 or more`);
    }
    const routed = route === "straight" ? findStraightPath(start, end) : findRoutedPath(route, start, end, margin, obstacles);
    return toGeometry(route, start, routed);
};

/**
 * The connector for a path in its box, or a freeform line through the corners of a route on the page.
 */
const toGeometry = (route: ConnectorRoute, start: ConnectorEndpoint, routed: BoxPath | readonly Point[]): ConnectorGeometry => {
    if (!("ex" in routed)) {
        const box = boundsOfPoints(routed);
        return {
            type: "freeform",
            adjustments: {},
            offset: { x: box.left, y: box.top },
            width: box.right - box.left,
            height: box.bottom - box.top,
            rotation: 0,
            flip: { horizontal: false, vertical: false },
            points: routed,
        };
    }
    const path = routed;
    const { ex, ey, width, height } = path;
    const toPage = pageMapping(start, ex, ey);

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

/**
 * The elbow connector that follows a route through the given corners, such as a route whose bends have been moved:
 * the preset whose bends are at those corners, or a freeform line if it has more than four bends.
 *
 * @param points - The ends and corners of the route, on the page, leaving and arriving as `start` and `end` do
 */
export const fitElbowConnector = (
    start: ConnectorEndpoint,
    end: ConnectorEndpoint,
    points: readonly Point[],
    margin: number,
): ConnectorGeometry => {
    const frame = findElbowFrame(start, end, margin);
    return toGeometry("elbow", start, toBoxPath(frame, points.map(toBox(start, frame))) ?? points);
};
