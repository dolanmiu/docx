/**
 * Places the shapes on each level of a flow across the level, once the levels are ordered: the Brandes–Köpf method.
 * Not part of the public API.
 *
 * Each shape is lined up with the middle one of the shapes it connects to on the level before, as far as the order
 * allows, so connectors are straight, and the points long connectors pass through line up first, so long connectors
 * are straight too. This is done four ways, lining shapes up with the level before and the level after, packed to the
 * left and to the right, and each shape is placed between the middle two of its four positions.
 *
 * Reference: U. Brandes and B. Köpf, "Fast and Simple Horizontal Coordinate Assignment", Graph Drawing 2001. The shapes
 * are packed as the dagre library packs them, which avoids a flaw in the paper's packing.
 *
 * @module
 */
// cspell:ignore Brandes Köpf dagre

/**
 * A connector between shapes, or points long connectors pass through, on neighboring levels.
 */
export type LevelLink = {
    readonly from: number;
    readonly to: number;
    /** Whether the link is left out when shapes are lined up, such as a connector that leaves the side of a shape */
    readonly skipAlignment?: boolean;
};

/**
 * The levels to place, and what they are placed by.
 */
export type LevelGraph = {
    /** The nodes on each level, in order */
    readonly order: readonly (readonly number[])[];
    /** Links from one level to the next */
    readonly links: readonly LevelLink[];
    /** Each node's length across its level. Points that long connectors pass through have none */
    readonly sizes: ReadonlyMap<number, number>;
    /** The points long connectors pass through, which line up before shapes do */
    readonly points: ReadonlySet<number>;
    /** The space between two shapes next to each other on a level. Half as much is left next to a point */
    readonly spacing: number;
};

type Gap = (a: number, b: number) => number;

type Visit = {
    readonly order: readonly number[];
    readonly seen: ReadonlySet<number>;
};

const pairKey = (a: number, b: number): string => (a < b ? `${a},${b}` : `${b},${a}`);

const positionsOf = (levels: readonly (readonly number[])[]): ReadonlyMap<number, number> =>
    new Map(levels.flatMap((level) => level.map((node, index) => [node, index] as const)));

/**
 * Finds the links that would cross the link between two points of a long connector. Lining shapes up along them
 * would bend the long connector, so they are left out.
 */
const findConflicts = ({ order, links, points }: LevelGraph): ReadonlySet<string> => {
    const position = positionsOf(order);
    const isPoint = (node: number): boolean => points.has(node);
    const predecessors = (node: number): readonly number[] => links.filter(({ to }) => to === node).map(({ from }) => from);
    return new Set(
        order.slice(1).flatMap((level, index) => {
            // The links between the points of long connectors split the level before into spans. A link to a node
            // between two of them must come from the span between their upper ends
            const boundaries = level
                .map((node, at) => ({ at, upper: isPoint(node) ? predecessors(node).find(isPoint) : undefined }))
                .filter(({ at, upper }) => upper !== undefined || at === level.length - 1);
            const upperEnd = ({ upper }: (typeof boundaries)[number]): number =>
                upper === undefined ? order[index].length : position.get(upper)!;
            return boundaries.flatMap((boundary, which) => {
                const low = which === 0 ? 0 : upperEnd(boundaries[which - 1]);
                const high = upperEnd(boundary);
                return level.slice(which === 0 ? 0 : boundaries[which - 1].at + 1, boundary.at + 1).flatMap((node) =>
                    predecessors(node)
                        .filter((upper) => {
                            const at = position.get(upper)!;
                            return (at < low || high < at) && !(isPoint(upper) && isPoint(node));
                        })
                        .map((upper) => pairKey(upper, node)),
                );
            });
        }),
    );
};

/**
 * Joins nodes into blocks that are lined up: each node joins the block of the middle one of its neighbors on the level
 * before, unless an earlier node on its level has joined a block further along.
 *
 * @param levels - The levels in the order they are gone through, each in the order nodes are packed
 * @param neighbors - A node's neighbors on the level before
 * @returns The first node of the block each node is in
 */
const alignVertically = (
    levels: readonly (readonly number[])[],
    neighbors: (node: number) => readonly number[],
    conflicts: ReadonlySet<string>,
): ReadonlyMap<number, number> => {
    const position = positionsOf(levels);
    return levels.reduce<ReadonlyMap<number, number>>((root, level) => {
        const { joined } = level.reduce<{ readonly furthest: number; readonly joined: ReadonlyMap<number, number> }>(
            ({ furthest, joined: done }, node) => {
                const sorted = [...neighbors(node)].sort((a, b) => position.get(a)! - position.get(b)!);
                const middle = (sorted.length - 1) / 2;
                const neighbor = [sorted[Math.floor(middle)], sorted[Math.ceil(middle)]].find(
                    (candidate) =>
                        candidate !== undefined && furthest < position.get(candidate)! && !conflicts.has(pairKey(node, candidate)),
                );
                return neighbor === undefined
                    ? { furthest, joined: done }
                    : { furthest: position.get(neighbor)!, joined: new Map([...done, [node, neighbor]]) };
            },
            { furthest: -1, joined: new Map() },
        );
        return new Map([...root, ...level.map((node) => [node, joined.has(node) ? root.get(joined.get(node)!)! : node] as const)]);
    }, new Map());
};

/**
 * Places blocks as near the start of each level as the gaps allow, then moves each one as far along as it can go
 * without moving the blocks after it, so blocks that aren't pushed along stay next to the ones they are beside.
 *
 * @returns Each node's centre
 */
const compact = (levels: readonly (readonly number[])[], root: ReadonlyMap<number, number>, gap: Gap): ReadonlyMap<number, number> => {
    const blockOf = (node: number): number => root.get(node)!;
    // The least distance between blocks next to each other on a level: the largest, where they are next to each other on several
    const separations = [
        ...new Map(
            [
                ...levels.flatMap((level) =>
                    level
                        .slice(1)
                        .map((node, index) => ({ before: blockOf(level[index]), after: blockOf(node), distance: gap(level[index], node) })),
                ),
            ]
                .sort((a, b) => a.distance - b.distance)
                .map((separation) => [`${separation.before},${separation.after}`, separation] as const),
        ).values(),
    ];
    const blocks = [...new Set(levels.flat().map(blockOf))];
    const beforeOf = new Map(blocks.map((block) => [block, separations.filter(({ after }) => after === block)]));
    const afterOf = new Map(blocks.map((block) => [block, separations.filter(({ before }) => before === block)]));

    // Each block after the blocks before it
    const visit = (state: Visit, block: number): Visit => {
        if (state.seen.has(block)) {
            return state;
        }
        const visited = beforeOf
            .get(block)!
            .map(({ before }) => before)
            .reduce(visit, { order: state.order, seen: new Set([...state.seen, block]) });
        return { order: [...visited.order, block], seen: visited.seen };
    };
    const sorted = blocks.reduce<Visit>(visit, { order: [], seen: new Set() }).order;

    const packed = sorted.reduce<ReadonlyMap<number, number>>(
        (positions, block) =>
            new Map([
                ...positions,
                [block, Math.max(0, ...beforeOf.get(block)!.map(({ before, distance }) => positions.get(before)! + distance))],
            ]),
        new Map(),
    );
    const moved = [...sorted].reverse().reduce<ReadonlyMap<number, number>>((positions, block) => {
        const furthest = Math.min(...afterOf.get(block)!.map(({ after, distance }) => positions.get(after)! - distance));
        return Number.isFinite(furthest) ? new Map([...positions, [block, Math.max(positions.get(block)!, furthest)]]) : positions;
    }, packed);
    return new Map([...root].map(([node, block]) => [node, moved.get(block)!]));
};

/**
 * Places the nodes on each level across the level.
 *
 * @returns Each node's centre, by node
 */
export const assignLevelCoordinates = (graph: LevelGraph): ReadonlyMap<number, number> => {
    const { order, links, sizes, points, spacing } = graph;
    const size = (node: number): number => sizes.get(node)!;
    const gap: Gap = (a, b) => (size(a) + size(b)) / 2 + (points.has(a) || points.has(b) ? spacing / 2 : spacing);
    const conflicts = findConflicts(graph);
    const aligning = links.filter(({ skipAlignment }) => !skipAlignment);
    const above = (node: number): readonly number[] => aligning.filter(({ to }) => to === node).map(({ from }) => from);
    const below = (node: number): readonly number[] => aligning.filter(({ from }) => from === node).map(({ to }) => to);

    // Lined up with the level before or after, and packed towards the start or the end of each level
    const layouts = (["before", "after"] as const).flatMap((vertical) =>
        (["start", "end"] as const).map((horizontal) => {
            const levels = (vertical === "before" ? order : [...order].reverse()).map((level) =>
                horizontal === "start" ? level : [...level].reverse(),
            );
            const root = alignVertically(levels, vertical === "before" ? above : below, conflicts);
            const centres = compact(levels, root, horizontal === "start" ? gap : (a, b) => gap(b, a));
            return { horizontal, centres: horizontal === "start" ? centres : new Map([...centres].map(([node, x]) => [node, -x])) };
        }),
    );

    // Each layout is moved to line up with the narrowest one: its start with the narrowest's start, or its end with its end
    const nodes = order.flat();
    const extent = (centres: ReadonlyMap<number, number>): { readonly start: number; readonly end: number } => ({
        start: Math.min(...nodes.map((node) => centres.get(node)! - size(node) / 2)),
        end: Math.max(...nodes.map((node) => centres.get(node)! + size(node) / 2)),
    });
    const narrowest = extent(
        layouts.reduce((best, layout) => {
            const width = (centres: ReadonlyMap<number, number>): number => extent(centres).end - extent(centres).start;
            return width(layout.centres) < width(best.centres) ? layout : best;
        }).centres,
    );
    const aligned = layouts.map(({ horizontal, centres }) => {
        const shift = horizontal === "start" ? narrowest.start - extent(centres).start : narrowest.end - extent(centres).end;
        return new Map([...centres].map(([node, x]) => [node, x + shift]));
    });

    // Between the middle two of the four
    return new Map(
        nodes.map((node) => {
            const values = aligned.map((centres) => centres.get(node)!).sort((a, b) => a - b);
            return [node, (values[1] + values[2]) / 2];
        }),
    );
};
