/**
 * Finds a route with right-angled bends around shapes when an elbow connector can't get around them with the four
 * bends its presets allow. Not part of the public API.
 *
 * The route is made of horizontal and vertical lines on a grid: lines a margin away from each shape, halfway between
 * shapes, and through the ends. It is found by trying routes with no bends, then one, then two and so on (Lee's
 * method), so it has as few bends as it can, then is as short as it can be.
 *
 * @module
 */
import type { Bounds, ConnectorEndpoint, Point } from "./connector-route";

type Axis = "x" | "y";

/**
 * A point on the grid a route reaches, with the way it was going and the route to it.
 */
type Reached = {
    readonly column: number;
    readonly row: number;
    /** The axis the route was going along when it reached the point, and which way along it */
    readonly axis: Axis;
    readonly step: 1 | -1;
    readonly length: number;
    readonly previous?: Reached;
};

const unitOf = (angle: number): Point => {
    const quarter = (((Math.round(angle / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
    return [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
    ][quarter];
};

const sortedUnique = (values: readonly number[]): readonly number[] => [...new Set(values.map(Math.round))].sort((a, b) => a - b);

// Whether an open interval of a line passes through the inside of a range, such as an obstacle's width
const passesThrough = (from: number, to: number, low: number, high: number): boolean =>
    Math.max(Math.min(from, to), low + 1) < Math.min(Math.max(from, to), high - 1);

const isInside = (value: number, low: number, high: number): boolean => value > low + 1 && value < high - 1;

/**
 * The obstacles a route between two points might have to go around: those near the points, and those near them, and so on.
 */
const nearbyObstacles = (points: readonly Point[], obstacles: readonly Bounds[], margin: number): readonly Bounds[] => {
    const grow = (region: Bounds, found: readonly Bounds[]): readonly Bounds[] => {
        const touching = obstacles.filter(
            (obstacle) =>
                !found.includes(obstacle) &&
                obstacle.left <= region.right &&
                region.left <= obstacle.right &&
                obstacle.top <= region.bottom &&
                region.top <= obstacle.bottom,
        );
        if (touching.length === 0) {
            return found;
        }
        const all = [...found, ...touching];
        return grow(
            {
                left: Math.min(region.left, ...touching.map(({ left }) => left - 2 * margin)),
                top: Math.min(region.top, ...touching.map(({ top }) => top - 2 * margin)),
                right: Math.max(region.right, ...touching.map(({ right }) => right + 2 * margin)),
                bottom: Math.max(region.bottom, ...touching.map(({ bottom }) => bottom + 2 * margin)),
            },
            all,
        );
    };
    return grow(
        {
            left: Math.min(...points.map(({ x }) => x)) - 2 * margin,
            top: Math.min(...points.map(({ y }) => y)) - 2 * margin,
            right: Math.max(...points.map(({ x }) => x)) + 2 * margin,
            bottom: Math.max(...points.map(({ y }) => y)) + 2 * margin,
        },
        [],
    );
};

/**
 * The lines of the grid along one axis: through the ends, a margin outside each obstacle, and halfway between the
 * edges of obstacles, so routes can pass between shapes that are close together. A line a margin outside one obstacle
 * that is nearer than that to another is left out, and routes between them go halfway between.
 */
const gridLines = (ends: readonly number[], edges: readonly (readonly [number, number])[], margin: number): readonly number[] => {
    const sides = sortedUnique(edges.flat());
    const isClear = (line: number): boolean => sides.every((side) => Math.abs(side - line) >= margin - 1);
    return sortedUnique([
        ...ends,
        ...edges.flatMap(([low, high]) => [low - margin, high + margin]).filter(isClear),
        ...sides.slice(1).map((side, index) => (sides[index] + side) / 2),
    ]);
};

/**
 * Finds a route with right-angled bends from one end to the other that goes through none of the obstacles. It leaves
 * each end at right angles to its shape and goes at least `margin` before turning.
 *
 * @returns The ends and corners of the route, or nothing if there is no such route
 */
export const findOrthogonalRoute = (
    start: ConnectorEndpoint,
    end: ConnectorEndpoint,
    margin: number,
    allObstacles: readonly Bounds[],
): readonly Point[] | undefined => {
    const leaving = unitOf(start.angle);
    const arriving = unitOf(end.angle);
    // The first and last corners can be no nearer the shapes than the margin
    const first = { x: start.point.x + leaving.x * margin, y: start.point.y + leaving.y * margin };
    const last = { x: end.point.x + arriving.x * margin, y: end.point.y + arriving.y * margin };
    const obstacles = nearbyObstacles([start.point, end.point], allObstacles, margin);

    const xs = gridLines(
        [first.x, last.x],
        obstacles.map(({ left, right }) => [left, right] as const),
        margin,
    );
    const ys = gridLines(
        [first.y, last.y],
        obstacles.map(({ top, bottom }) => [top, bottom] as const),
        margin,
    );
    const pointAt = (column: number, row: number): Point => ({ x: xs[column], y: ys[row] });
    // Whether a line between two neighboring points of the grid goes through an obstacle
    const blocked = (from: Point, to: Point): boolean =>
        obstacles.some((obstacle) =>
            from.y === to.y
                ? isInside(from.y, obstacle.top, obstacle.bottom) && passesThrough(from.x, to.x, obstacle.left, obstacle.right)
                : isInside(from.x, obstacle.left, obstacle.right) && passesThrough(from.y, to.y, obstacle.top, obstacle.bottom),
        );

    // The points a straight line from a point reaches along an axis, both ways, until an obstacle stops it
    const ray = (from: Reached, axis: Axis, step: 1 | -1): readonly Reached[] => {
        const reach = (current: Reached): readonly Reached[] => {
            const column = axis === "x" ? current.column + step : current.column;
            const row = axis === "y" ? current.row + step : current.row;
            if (column < 0 || row < 0 || column >= xs.length || row >= ys.length) {
                return [];
            }
            const here = pointAt(current.column, current.row);
            const there = pointAt(column, row);
            if (blocked(here, there)) {
                return [];
            }
            const next = {
                column,
                row,
                axis,
                step,
                length: current.length + Math.abs(there.x - here.x) + Math.abs(there.y - here.y),
                previous: from,
            };
            return [next, ...reach(next)];
        };
        return reach(from);
    };
    const keyOf = ({ column, row, axis, step }: Reached): string => `${column},${row},${axis},${step}`;
    // Of the points reached the same way, the one with the shortest route
    const shortest = (reached: readonly Reached[]): readonly Reached[] => [
        ...new Map([...reached].sort((a, b) => b.length - a.length).map((point) => [keyOf(point), point])).values(),
    ];

    const leavingAxis: Axis = leaving.x === 0 ? "y" : "x";
    const leavingStep = (leavingAxis === "x" ? leaving.x : leaving.y) as 1 | -1;
    const arrivingAxis: Axis = arriving.x === 0 ? "y" : "x";
    // The way the route goes from the last corner into the end
    const arrivingStep = -(arrivingAxis === "x" ? arriving.x : arriving.y);
    const origin: Reached = {
        column: xs.indexOf(Math.round(first.x)),
        row: ys.indexOf(Math.round(first.y)),
        axis: leavingAxis,
        step: leavingStep,
        length: margin,
    };
    const goal = { column: xs.indexOf(Math.round(last.x)), row: ys.indexOf(Math.round(last.y)) };

    // The route goes straight on from the first corner, then turns once more with each round. A route that reaches the
    // last corner going along the other axis turns once more there, and one going the other way along the same axis
    // would have to turn back, so it doesn't count
    const search = (frontier: readonly Reached[], seen: ReadonlySet<string>): Reached | undefined => {
        if (frontier.length === 0) {
            return undefined;
        }
        const arrived = frontier
            .filter(
                ({ column, row, axis, step }) =>
                    column === goal.column && row === goal.row && (axis !== arrivingAxis || step === arrivingStep),
            )
            .map((point) => ({ point, bends: point.axis === arrivingAxis ? 0 : 1 }))
            .sort((a, b) => a.bends - b.bends || a.point.length - b.point.length);
        if (arrived.length > 0) {
            return arrived[0].point;
        }
        const next = shortest(
            frontier.flatMap((point) => {
                const across: Axis = point.axis === "x" ? "y" : "x";
                return [...ray(point, across, 1), ...ray(point, across, -1)];
            }),
        ).filter((point) => !seen.has(keyOf(point)));
        return search(next, new Set([...seen, ...next.map(keyOf)]));
    };
    const leaves = shortest([origin, ...ray(origin, leavingAxis, leavingStep)]);
    const found = search(leaves, new Set(leaves.map(keyOf)));
    if (!found) {
        return undefined;
    }

    // The corners, from the start: the route back through each point where it turned
    const turns = (point: Reached | undefined): readonly Point[] =>
        point ? [...turns(point.previous), pointAt(point.column, point.row)] : [];
    const corners = [start.point, ...turns(found), end.point];
    // Points in the middle of a straight line aren't corners
    return corners.filter((point, index) => {
        const before = corners[index - 1];
        const after = corners[index + 1];
        return !before || !after || !((before.x === point.x && point.x === after.x) || (before.y === point.y && point.y === after.y));
    });
};
