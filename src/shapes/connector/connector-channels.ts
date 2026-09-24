/**
 * Moves apart elbow connectors whose lines would lie on top of each other, where they run along the same line between
 * their bends. Not part of the public API.
 *
 * @module
 */
import type { Point } from "./connector-route";

/**
 * A connector's route: its ends and corners, and whether its bends can move.
 */
export type ChannelRoute = {
    readonly points: readonly Point[];
    /** Whether the lines between its bends can be moved, as an elbow connector's can */
    readonly movable: boolean;
};

/**
 * A line of a route between two of its bends, which runs along `axis` at `at`, from `low` to `high`.
 */
type Segment = {
    readonly route: number;
    /** The index of the segment's first point in the route */
    readonly index: number;
    /** `"x"` for a line that runs across the page, `"y"` for one that runs down it */
    readonly axis: "x" | "y";
    readonly at: number;
    readonly low: number;
    readonly high: number;
    /** Where the lines before and after it go: before it (negative) or after it (positive) across `at` */
    readonly leaning: number;
};

// Lines this close together, in EMUs, are on the same line: a pixel
const SAME_LINE = 9525;

const segmentsOf = (route: ChannelRoute, routeIndex: number): readonly Segment[] =>
    route.movable
        ? route.points.slice(1, -2).map((from, offset): Segment => {
              const index = offset + 1;
              const to = route.points[index + 1];
              const axis = Math.abs(from.y - to.y) < 1 ? "x" : "y";
              const across = axis === "x" ? "y" : "x";
              const before = route.points[index - 1];
              const after = route.points[index + 2];
              return {
                  route: routeIndex,
                  index,
                  axis,
                  at: from[across],
                  low: Math.min(from[axis], to[axis]),
                  high: Math.max(from[axis], to[axis]),
                  leaning: before[across] - from[across] + (after[across] - to[across]),
              };
          })
        : [];

/**
 * Splits segments into groups that lie on top of each other: on the same line, and overlapping along it.
 */
const findChannels = (segments: readonly Segment[]): readonly (readonly Segment[])[] => {
    // Segments along the same line, to within a pixel
    const lines = [...segments]
        .sort((a, b) => (a.axis === b.axis ? a.at - b.at : a.axis < b.axis ? -1 : 1))
        .reduce<readonly (readonly Segment[])[]>((all, segment) => {
            const last = all[all.length - 1];
            return last?.[0].axis === segment.axis && Math.abs(last[last.length - 1].at - segment.at) < SAME_LINE
                ? [...all.slice(0, -1), [...last, segment]]
                : [...all, [segment]];
        }, []);
    // On each line, the segments that overlap one another
    return lines
        .flatMap((line) =>
            [...line]
                .sort((a, b) => a.low - b.low)
                .reduce<readonly (readonly Segment[])[]>((channels, segment) => {
                    const last = channels[channels.length - 1];
                    return last !== undefined && segment.low < Math.max(...last.map(({ high }) => high)) - SAME_LINE
                        ? [...channels.slice(0, -1), [...last, segment]]
                        : [...channels, [segment]];
                }, []),
        )
        .filter((channel) => new Set(channel.map(({ route }) => route)).size > 1);
};

const sameEnd = (a: ChannelRoute, b: ChannelRoute): boolean => {
    const ends = (route: ChannelRoute): readonly Point[] => [route.points[0], route.points[route.points.length - 1]];
    return ends(a).some((end) => ends(b).some((other) => Math.abs(end.x - other.x) < SAME_LINE && Math.abs(end.y - other.y) < SAME_LINE));
};

/**
 * Moves apart the lines of elbow connectors that lie on top of each other between their bends, `spacing` apart and
 * centred on where they were. Connectors that meet at one end, such as those fanning out from a box in an org chart,
 * stay together. The lines are ordered by where the lines before and after them go, so they cross as little as they can.
 *
 * @returns The routes, with the lines that were moved
 */
export const separateChannels = (routes: readonly ChannelRoute[], spacing: number): readonly (readonly Point[])[] => {
    const channels = findChannels(routes.flatMap(segmentsOf));
    const shifts = channels.flatMap((channel) => {
        // Segments of connectors that meet at one end share a lane
        const lanes = channel.reduce<readonly (readonly Segment[])[]>((all, segment) => {
            const lane = all.findIndex((members) => members.some((member) => sameEnd(routes[member.route], routes[segment.route])));
            return lane === -1 ? [...all, [segment]] : all.map((members, index) => (index === lane ? [...members, segment] : members));
        }, []);
        const leaning = (lane: readonly Segment[]): number => lane.reduce((total, { leaning: value }) => total + value, 0);
        const ordered = [...lanes].sort((a, b) => leaning(a) - leaning(b) || a[0].route - b[0].route);
        return ordered.flatMap((lane, position) =>
            lane.map((segment) => ({ segment, by: (position - (ordered.length - 1) / 2) * spacing })),
        );
    });

    return routes.map((route, routeIndex) =>
        shifts
            .filter(({ segment }) => segment.route === routeIndex)
            .reduce(
                (points, { segment, by }) =>
                    points.map((point, index) =>
                        index === segment.index || index === segment.index + 1
                            ? segment.axis === "x"
                                ? { ...point, y: point.y + by }
                                : { ...point, x: point.x + by }
                            : point,
                    ),
                route.points,
            ),
    );
};
