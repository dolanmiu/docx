/**
 * Automatic layout for the shapes in a ShapeGroupRun or ShapeCanvasRun: flowcharts in layers, trees such as
 * org charts, and grids. The positions are worked out when the document is made and written as ordinary offsets,
 * so the shapes can be moved in Word afterwards. Not part of the public API, apart from the option types.
 *
 * @module
 */
// cspell:ignore Brandes Köpf
import type { ShapeFill, ShapeLine } from "./preset-shape";
import { assignLevelCoordinates } from "./shape-layout-coordinates";

/**
 * The way a flow or tree runs, from its first shapes to its last.
 *
 * @publicApi
 */
export type ShapeLayoutDirection = "down" | "right" | "up" | "left";

/**
 * A lane of a flow: a band, with a header, that the shapes given its name go in.
 *
 * @publicApi
 */
export type ShapeLane = {
    /** The lane's name, written in its header. A shape goes in the lane when its `lane` is this name */
    readonly name: string;
    /** The lane's background. Default is none */
    readonly fill?: ShapeFill;
    /** The background of the lane's header. Default is light grey */
    readonly headerFill?: ShapeFill;
    /** The line around the lane and its header. Default is a thin grey line */
    readonly line?: ShapeLine;
};

/**
 * Places shapes in levels along their connectors, as in a flowchart: each shape goes on a level after the shapes
 * that connect to it, and the shapes on each level are ordered so connectors cross as little as they can.
 *
 * @publicApi
 */
export type ShapeFlowLayout = {
    readonly type: "flow";
    /** The way the flow runs. Default is `"down"` */
    readonly direction?: ShapeLayoutDirection;
    /** Space between shapes on the same level, in pixels. Default is 40 */
    readonly spacing?: number;
    /** Space between one level and the next, in pixels. Default is 50 */
    readonly levelSpacing?: number;
    /**
     * Bands the flow runs along, such as the people or teams that do each step of a process (swimlanes). Each shape
     * with a `lane` goes in the band of that name, and shapes without one go in the first. The bands are side by side,
     * across the direction the flow runs in, each with a header at the start of the flow
     */
    readonly lanes?: readonly (string | ShapeLane)[];
};

/**
 * Places shapes as a tree, such as an org chart: each connector joins a parent (`from`) to a child (`to`), and
 * children are placed side by side below their parent, which is centred over them.
 *
 * @publicApi
 */
export type ShapeTreeLayout = {
    readonly type: "tree";
    /** The way the tree grows from its root. Default is `"down"` */
    readonly direction?: ShapeLayoutDirection;
    /** Space between shapes on the same level, in pixels. Default is 20 */
    readonly spacing?: number;
    /** Space between one level and the next, in pixels. Default is 40 */
    readonly levelSpacing?: number;
};

/**
 * Places shapes in rows and columns, in the order they are given.
 *
 * @publicApi
 */
export type ShapeGridLayout = {
    readonly type: "grid";
    /** The number of columns. Default is enough to make the grid about as wide as it is tall, counted in shapes */
    readonly columns?: number;
    /** Space between rows and columns, in pixels. Default is 40 */
    readonly spacing?: number;
};

/**
 * How a {@link ShapeGroupRun} or {@link ShapeCanvasRun} places the shapes, pictures and groups that have no `offset`.
 * Shapes with an `offset` stay where it puts them: those that connect to the shapes the layout places take part in the
 * layout, which is placed around them. Connectors are routed after the shapes are placed.
 *
 * @publicApi
 */
export type ShapeLayout = ShapeFlowLayout | ShapeTreeLayout | ShapeGridLayout;

/**
 * Something to place, by the size of the box around it.
 */
export type LayoutItem = {
    readonly width: number;
    readonly height: number;
    /** The lane of a flow it goes in, by index */
    readonly lane?: number;
};

/**
 * A box: where it is and how big it is.
 */
export type LayoutBox = LayoutPosition & Pick<LayoutItem, "width" | "height">;

/**
 * A connector between two items, by their indexes.
 */
export type LayoutEdge = {
    readonly from: number;
    readonly to: number;
    /**
     * Which way across the levels of a flow the connector leaves `from`, when it is given a side: `-1` towards the start
     * of the level (left, or the top when levels run across the page) and `1` towards the end. The item it leads to is
     * placed that way from the others `from` leads to
     */
    readonly across?: -1 | 1;
    /** How long the connector's label is along the direction the levels run in, in EMUs. The levels leave room for it */
    readonly labelLength?: number;
};

/**
 * A position: the top-left corner of an item's box.
 */
export type LayoutPosition = {
    readonly x: number;
    readonly y: number;
};

/**
 * Where a layout puts each item.
 */
export type LayoutResult = {
    /** The top-left corner of each item's box */
    readonly positions: readonly LayoutPosition[];
    /** The level of a flow or tree each item is on, counted from the first. Missing for grids */
    readonly levels?: readonly number[];
    /** The band and header of each lane of a flow */
    readonly lanes?: readonly { readonly band: LayoutBox; readonly header: LayoutBox }[];
};

/**
 * How big the lanes of a flow need to be for their headers, in EMUs.
 */
export type LaneHeaders = {
    /** How long the headers are along the direction the flow runs in */
    readonly length: number;
    /** How wide each lane has to be, across the direction the flow runs in, for its header's text */
    readonly widths: readonly number[];
};

const EMUS_PER_PIXEL = 9525;
// Space either side of a label between levels, in EMUs
const LABEL_CLEARANCE = 8 * EMUS_PER_PIXEL;
// Iterations of the passes that order each level of a flow
const ORDERING_PASSES = 24;
// How far a connector that leaves the side of a shape moves the shape it leads to, in places on a level
const SIDE_WEIGHT = 0.5;

const checkSpacing = (value: number, option: string): number => {
    if (!(value >= 0)) {
        throw new Error(`Invalid layout ${option} ${value}. Expected a number of pixels, 0 or more`);
    }
    return value * EMUS_PER_PIXEL;
};

/**
 * Sizes and positions across and along the levels of a flow or tree, which run down the page before they are turned.
 */
type Turned = {
    /** An item's length across its level */
    readonly across: (item: LayoutItem) => number;
    /** An item's length along the direction the levels run in */
    readonly along: (item: LayoutItem) => number;
    /** Turns positions across and along the levels back into page positions */
    readonly place: (
        positions: readonly { readonly across: number; readonly along: number }[],
        items: readonly LayoutItem[],
    ) => readonly LayoutPosition[];
    /** The item with the given lengths across and along the levels */
    readonly item: (across: number, along: number) => LayoutItem;
};

const normalize = (positions: readonly LayoutPosition[]): readonly LayoutPosition[] => {
    const left = Math.min(...positions.map(({ x }) => x));
    const top = Math.min(...positions.map(({ y }) => y));
    return positions.map(({ x, y }) => ({ x: x - left, y: y - top }));
};

const turn = (direction: ShapeLayoutDirection = "down"): Turned => {
    const vertical = direction === "down" || direction === "up";
    // Levels that run up or left are laid out running down or right, then mirrored
    const mirror = direction === "up" || direction === "left" ? -1 : 1;
    return {
        across: (item) => (vertical ? item.width : item.height),
        along: (item) => (vertical ? item.height : item.width),
        item: (acrossLength, alongLength) =>
            vertical ? { width: acrossLength, height: alongLength } : { width: alongLength, height: acrossLength },
        place: (positions, items) =>
            normalize(
                positions.map(({ across, along }, index) => {
                    const length = vertical ? items[index].height : items[index].width;
                    const main = mirror > 0 ? along : -along - length;
                    return vertical ? { x: across, y: main } : { x: main, y: across };
                }),
            ),
    };
};

/**
 * The start of each level along the direction the levels run in, from the length of the longest item on each level.
 *
 * @param spacing - The space after each level, or the same space after every level
 */
const levelStarts = (thickness: readonly number[], spacing: number | readonly number[]): readonly number[] =>
    thickness.reduce<readonly number[]>(
        (starts, _, index) =>
            index === 0
                ? [0]
                : [...starts, starts[index - 1] + thickness[index - 1] + (typeof spacing === "number" ? spacing : spacing[index - 1])],
        [],
    );

/**
 * The space after each level: the level spacing, or more where a connector to the next level has a label that needs it.
 */
const spacingAfterLevels = (
    levelCount: number,
    levelSpacing: number,
    levelOf: (item: number) => number,
    edges: readonly LayoutEdge[],
): readonly number[] =>
    range(levelCount).map((level) =>
        Math.max(
            levelSpacing,
            ...edges
                .filter(({ from, to, labelLength }) => labelLength !== undefined && levelOf(from) === level && levelOf(to) === level + 1)
                .map(({ labelLength }) => labelLength! + 2 * LABEL_CLEARANCE),
        ),
    );

const range = (length: number, from = 0): readonly number[] => Array.from({ length: Math.max(0, length) }, (_, index) => from + index);

const mean = (values: readonly number[]): number | undefined =>
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;

type Search = {
    /** Shapes the search has finished with */
    readonly done: ReadonlySet<number>;
    /** The indexes of connectors that lead back */
    readonly back: ReadonlySet<number>;
};

/**
 * Finds the connectors that lead back to a shape the flow has already passed, by a depth-first search from the shapes
 * in the order they are given. Leaving them out leaves no cycles.
 *
 * @returns The indexes of the connectors that lead back
 */
const findBackEdges = (count: number, edges: readonly LayoutEdge[]): ReadonlySet<number> => {
    // `open` holds the shapes on the path from where the search started
    const visit = (node: number, open: ReadonlySet<number>, search: Search): Search => {
        const visited = edges.reduce((current, edge, index) => {
            if (edge.from !== node) {
                return current;
            }
            if (open.has(edge.to)) {
                return { ...current, back: new Set([...current.back, index]) };
            }
            return current.done.has(edge.to) ? current : visit(edge.to, new Set([...open, edge.to]), current);
        }, search);
        return { ...visited, done: new Set([...visited.done, node]) };
    };
    return range(count).reduce<Search>((search, node) => (search.done.has(node) ? search : visit(node, new Set([node]), search)), {
        done: new Set(),
        back: new Set(),
    }).back;
};

/**
 * Puts each shape on the level after the furthest shape that connects to it. A shape that only connects onwards
 * is moved down to the level just before the nearest shape it connects to.
 *
 * @param edges - Connectors without cycles
 */
const assignLevels = (count: number, edges: readonly LayoutEdge[]): readonly number[] => {
    const before = range(count).map((node) => edges.filter(({ to }) => to === node).map(({ from }) => from));
    const after = range(count).map((node) => edges.filter(({ from }) => from === node).map(({ to }) => to));
    // Each round moves shapes down to at least one level after the shapes before them, until nothing moves
    const settle = (current: readonly number[], rounds: number): readonly number[] => {
        const next = current.map((_, node) => Math.max(0, ...before[node].map((previous) => current[previous] + 1)));
        return rounds === 0 || next.every((level, node) => level === current[node]) ? next : settle(next, rounds - 1);
    };
    const levels = settle(new Array<number>(count).fill(0), count);
    return levels.map((level, node) =>
        before[node].length === 0 && after[node].length > 0 ? Math.min(...after[node].map((next) => levels[next])) - 1 : level,
    );
};

type FlowNode = {
    readonly level: number;
    /** Length across the level. Points that long connectors pass through have none */
    readonly size: number;
    readonly isPoint: boolean;
    /** The lane it is in. A point long connectors pass through is in the lane the connector comes from */
    readonly lane: number;
};

const countCrossings = (upper: readonly number[], lower: readonly number[], edges: readonly LayoutEdge[]): number => {
    const upperIndex = new Map(upper.map((node, index) => [node, index]));
    const lowerIndex = new Map(lower.map((node, index) => [node, index]));
    const between = edges
        .filter(({ from, to }) => upperIndex.has(from) && lowerIndex.has(to))
        .map(({ from, to }) => [upperIndex.get(from)!, lowerIndex.get(to)!] as const);
    return between.reduce((total, [a, b], index) => total + between.slice(index + 1).filter(([c, d]) => (a - c) * (b - d) < 0).length, 0);
};

/**
 * How many shapes are on the wrong side of their siblings: a shape that a connector leaves the side of its parent
 * for, placed on the other side of a shape the parent leads to without one.
 */
const countMisplaced = (upper: readonly number[], lower: readonly number[], edges: readonly LayoutEdge[]): number => {
    const lowerIndex = new Map(lower.map((node, index) => [node, index]));
    return upper.reduce((total, parent) => {
        const children = edges.filter(({ from, to }) => from === parent && lowerIndex.has(to));
        return (
            total +
            children.reduce(
                (count, child) =>
                    count +
                    children.filter(
                        (other) => (child.across ?? 0) > (other.across ?? 0) && lowerIndex.get(child.to)! < lowerIndex.get(other.to)!,
                    ).length,
                0,
            )
        );
    }, 0);
};

type Ordering = {
    readonly order: readonly (readonly number[])[];
    readonly best: readonly (readonly number[])[];
    readonly crossings: number;
    readonly misplaced: number;
};

/**
 * Orders the shapes on each level to reduce crossings: passes go down and up in turn, sorting each level by the
 * average position of the shapes it connects to on the level just done (the barycenter method). A connector that
 * leaves the side of a shape moves the shape it leads to that way. The order with the fewest crossings, then the
 * fewest shapes on the wrong side of their siblings, is kept. The shapes in each lane stay together.
 */
const orderLevels = (
    start: readonly (readonly number[])[],
    links: readonly LayoutEdge[],
    laneOf: (node: number) => number,
): readonly (readonly number[])[] => {
    const levelCount = start.length;
    const score = (order: readonly (readonly number[])[]): Pick<Ordering, "crossings" | "misplaced"> =>
        order.slice(1).reduce(
            (total, lower, index) => ({
                crossings: total.crossings + countCrossings(order[index], lower, links),
                misplaced: total.misplaced + countMisplaced(order[index], lower, links),
            }),
            { crossings: 0, misplaced: 0 },
        );
    const sortLevel = (order: readonly (readonly number[])[], level: number, down: boolean): readonly (readonly number[])[] => {
        const fixed = new Map(order[down ? level - 1 : level + 1].map((node, index) => [node, index]));
        const weights = order[level].map((node, index) => {
            const neighbors = links
                .filter((link) => (down ? link.to === node && fixed.has(link.from) : link.from === node && fixed.has(link.to)))
                .map((link) => fixed.get(down ? link.from : link.to)! + (down ? 1 : -1) * (link.across ?? 0) * SIDE_WEIGHT);
            return { node, weight: mean(neighbors) ?? index };
        });
        // Each lane's shapes stay together, in the order of the lanes
        const sorted = [...weights].sort((a, b) => laneOf(a.node) - laneOf(b.node) || a.weight - b.weight).map(({ node }) => node);
        return order.map((nodes, index) => (index === level ? sorted : nodes));
    };

    return range(ORDERING_PASSES).reduce<Ordering>(
        (ordering, pass) => {
            if (ordering.crossings === 0 && ordering.misplaced === 0) {
                return ordering;
            }
            const down = pass % 2 === 0;
            const levels = down ? range(levelCount - 1, 1) : range(levelCount - 1).map((index) => levelCount - 2 - index);
            const order = levels.reduce((current, level) => sortLevel(current, level, down), ordering.order);
            const { crossings, misplaced } = score(order);
            const better = crossings < ordering.crossings || (crossings === ordering.crossings && misplaced < ordering.misplaced);
            return better ? { order, best: order, crossings, misplaced } : { ...ordering, order };
        },
        { order: start, best: start, ...score(start) },
    ).best;
};

/**
 * Lays out a flow in levels (the Sugiyama method): leaves out connectors that lead back, puts the shapes on levels,
 * adds points for connectors that skip levels, orders each level to reduce crossings, then lines each shape up with
 * the shapes it connects to (the Brandes–Köpf method). Connectors that lead back are routed around the shapes
 * afterwards, so they don't take up room in the layout.
 */
/**
 * Places the shapes on each level across it: lined up with the shapes they connect to, and in lanes when the flow
 * has them. Each lane is as wide as its shapes, or its header, need, and the lanes are side by side.
 *
 * @returns Each node's centre across its level, and where each lane starts and how wide it is
 */
const placeAcross = (
    order: readonly (readonly number[])[],
    nodes: readonly FlowNode[],
    links: readonly LayoutEdge[],
    spacing: number,
    lanes?: { readonly count: number; readonly widths: readonly number[] },
): { readonly centres: ReadonlyMap<number, number>; readonly lanes: readonly { readonly start: number; readonly width: number }[] } => {
    const place = (lane?: number): ReadonlyMap<number, number> => {
        const inLane = (node: number): boolean => lane === undefined || nodes[node].lane === lane;
        return assignLevelCoordinates({
            order: order.map((level) => level.filter(inLane)),
            // A connector that leaves the side of a shape doesn't line the shape it leads to up with it
            links: links
                .filter(({ from, to }) => inLane(from) && inLane(to))
                .map(({ from, to, across: side }) => ({ from, to, skipAlignment: side !== undefined })),
            sizes: new Map(nodes.map(({ size }, node) => [node, size])),
            points: new Set(range(nodes.length).filter((node) => nodes[node].isPoint)),
            spacing,
        });
    };
    if (!lanes) {
        return { centres: place(), lanes: [] };
    }
    const placed = range(lanes.count).map((lane) => {
        const centres = place(lane);
        const edges = [...centres].flatMap(([node, centre]) => [centre - nodes[node].size / 2, centre + nodes[node].size / 2]);
        // A lane without shapes has no width of its own
        const low = edges.length > 0 ? Math.min(...edges) : 0;
        const high = edges.length > 0 ? Math.max(...edges) : 0;
        // Half the spacing either side of the lane's shapes, and room for its header
        const width = Math.max(high - low + spacing, lanes.widths[lane] ?? 0);
        return { centres, low, high, width };
    });
    const starts = levelStarts(
        placed.map(({ width }) => width),
        0,
    );
    return {
        centres: new Map(
            placed.flatMap(({ centres, low, high, width }, lane) =>
                [...centres].map(([node, centre]) => [node, starts[lane] + (width - (high - low)) / 2 + centre - low] as const),
            ),
        ),
        lanes: placed.map(({ width }, lane) => ({ start: starts[lane], width })),
    };
};

/**
 * Lays out a flow in levels (the Sugiyama method): leaves out connectors that lead back, puts the shapes on levels,
 * adds points for connectors that skip levels, orders each level to reduce crossings, then lines each shape up with
 * the shapes it connects to (the Brandes–Köpf method). Connectors that lead back are routed around the shapes
 * afterwards, so they don't take up room in the layout.
 *
 * With lanes, the shapes in each lane stay together on each level, and the lanes' headers come before the first level.
 */
const layoutFlow = (
    layout: ShapeFlowLayout,
    items: readonly LayoutItem[],
    allEdges: readonly LayoutEdge[],
    headers: LaneHeaders,
): LayoutResult => {
    const spacing = checkSpacing(layout.spacing ?? 40, "spacing");
    const levelSpacing = checkSpacing(layout.levelSpacing ?? 50, "levelSpacing");
    const { across, along, place, item: turnedItem } = turn(layout.direction);
    const backEdges = findBackEdges(items.length, allEdges);
    const edges = allEdges.filter((_, index) => !backEdges.has(index));
    const levels = assignLevels(items.length, edges);
    const lowest = Math.min(...levels);
    const laneCount = layout.lanes?.length ?? 0;

    // Connectors that skip levels pass through a point on each level they skip. Only the first link of a connector
    // that leaves the side of a shape goes that way
    const { nodes, links } = edges.reduce<{ readonly nodes: readonly FlowNode[]; readonly links: readonly LayoutEdge[] }>(
        (graph, { from, to, across: side }) => {
            const skipped = range(graph.nodes[to].level - graph.nodes[from].level - 1, graph.nodes[from].level + 1).map((level) => ({
                level,
                size: 0,
                isPoint: true,
                lane: graph.nodes[from].lane,
            }));
            const path = [from, ...skipped.map((_, index) => graph.nodes.length + index), to];
            return {
                nodes: [...graph.nodes, ...skipped],
                links: [
                    ...graph.links,
                    ...path.slice(1).map((node, index) => ({ from: path[index], to: node, across: index === 0 ? side : undefined })),
                ],
            };
        },
        {
            nodes: items.map((item, index) => ({
                level: levels[index] - lowest,
                size: across(item),
                isPoint: false,
                lane: item.lane ?? 0,
            })),
            links: [],
        },
    );

    // Levels start in the order the shapes are given, with the points connectors pass through after them
    const levelCount = Math.max(...nodes.map(({ level }) => level)) + 1;
    const order = orderLevels(
        range(levelCount).map((level) =>
            range(nodes.length)
                .filter((node) => nodes[node].level === level)
                .sort((a, b) => nodes[a].lane - nodes[b].lane),
        ),
        links,
        (node) => nodes[node].lane,
    );
    const { centres, lanes } = placeAcross(
        order,
        nodes,
        links,
        spacing,
        laneCount > 0 ? { count: laneCount, widths: headers.widths } : undefined,
    );

    // Positions along: each level is as thick as its longest shape, and shapes are centred on it. Lanes' headers come
    // first, with half the level spacing before the first level and after the last
    const thickness = range(levelCount).map((level) =>
        Math.max(0, ...items.map((item, index) => (nodes[index].level === level ? along(item) : 0))),
    );
    const before = laneCount > 0 ? headers.length + levelSpacing / 2 : 0;
    const starts = levelStarts(
        thickness,
        spacingAfterLevels(levelCount, levelSpacing, (item) => nodes[item].level, edges),
    ).map((start) => start + before);
    const total = starts[levelCount - 1] + thickness[levelCount - 1] + levelSpacing / 2;
    const bands = lanes.flatMap(({ start, width }) => [
        { across: start, along: 0, item: turnedItem(width, total) },
        { across: start, along: 0, item: turnedItem(width, headers.length) },
    ]);
    const placed = place(
        [
            ...items.map((item, index) => ({
                across: centres.get(index)! - across(item) / 2,
                along: starts[nodes[index].level] + (thickness[nodes[index].level] - along(item)) / 2,
            })),
            ...bands.map(({ across: bandAcross, along: bandAlong }) => ({ across: bandAcross, along: bandAlong })),
        ],
        [...items, ...bands.map(({ item }) => item)],
    );
    const boxes = bands.map(({ item }, index) => ({ ...placed[items.length + index], width: item.width, height: item.height }));
    return {
        positions: placed.slice(0, items.length),
        levels: items.map((_, index) => nodes[index].level),
        lanes: laneCount > 0 ? lanes.map((_, lane) => ({ band: boxes[2 * lane], header: boxes[2 * lane + 1] })) : undefined,
    };
};

type Contour = readonly { readonly left: number; readonly right: number }[];

type Subtree = {
    /** Each node's centre across the level, from the subtree's root */
    readonly centres: ReadonlyMap<number, number>;
    /** Each node's depth in the whole tree */
    readonly depths: ReadonlyMap<number, number>;
    /** The subtree's left and right edges on each level from its root down, from the root's centre */
    readonly contour: Contour;
};

const shiftContour = (contour: Contour, by: number): Contour => contour.map(({ left, right }) => ({ left: left + by, right: right + by }));

const mergeContours = (a: Contour, b: Contour): Contour =>
    range(Math.max(a.length, b.length)).map((level) => ({
        left: Math.min(a[level]?.left ?? Infinity, b[level]?.left ?? Infinity),
        right: Math.max(a[level]?.right ?? -Infinity, b[level]?.right ?? -Infinity),
    }));

/**
 * Places subtrees side by side, each as near the one before it as their contours allow.
 *
 * @returns Each subtree's centre, from the first one's, and the contour of them all
 */
const packSubtrees = (
    subtrees: readonly Subtree[],
    spacing: number,
): { readonly positions: readonly number[]; readonly contour: Contour } =>
    subtrees.reduce<{ readonly positions: readonly number[]; readonly contour: Contour }>(
        (packed, subtree, index) => {
            if (index === 0) {
                return { positions: [0], contour: subtree.contour };
            }
            const shift = Math.max(
                ...subtree.contour.slice(0, packed.contour.length).map(({ left }, level) => packed.contour[level].right - left + spacing),
            );
            return {
                positions: [...packed.positions, shift],
                contour: mergeContours(packed.contour, shiftContour(subtree.contour, shift)),
            };
        },
        { positions: [], contour: [] },
    );

/**
 * Lays out a tree (the Reingold–Tilford method, with shapes of different sizes): each subtree is laid out on its own,
 * then the subtrees are packed as close as their outlines allow, and their parent is centred over them.
 */
const layoutTree = (layout: ShapeTreeLayout, items: readonly LayoutItem[], edges: readonly LayoutEdge[]): LayoutResult => {
    const spacing = checkSpacing(layout.spacing ?? 20, "spacing");
    const levelSpacing = checkSpacing(layout.levelSpacing ?? 40, "levelSpacing");
    const { across, along, place } = turn(layout.direction);

    // The first connector to each shape makes it a child, unless that would make a shape its own ancestor
    const isAncestor = (links: readonly (number | undefined)[], node: number, of: number | undefined): boolean =>
        of !== undefined && (of === node || isAncestor(links, node, links[of]));
    const parents = edges.reduce<readonly (number | undefined)[]>(
        (current, { from, to }) =>
            current[to] === undefined && !isAncestor(current, to, from)
                ? current.map((parent, node) => (node === to ? from : parent))
                : current,
        new Array<number | undefined>(items.length).fill(undefined),
    );
    const childrenOf = (node: number): readonly number[] =>
        edges.map(({ to }) => to).filter((to, index, all) => parents[to] === node && all.indexOf(to) === index);

    const layoutSubtree = (node: number, depth: number): Subtree => {
        const size = across(items[node]);
        const own: Contour = [{ left: -size / 2, right: size / 2 }];
        const children = childrenOf(node).map((child) => layoutSubtree(child, depth + 1));
        const { positions: childCentres, contour } = packSubtrees(children, spacing);
        // The parent is centred over its first and last children
        const middle = children.length === 0 ? 0 : (childCentres[0] + childCentres[childCentres.length - 1]) / 2;
        return {
            centres: new Map([
                [node, 0],
                ...children.flatMap((subtree, index) =>
                    [...subtree.centres].map(([descendant, centre]) => [descendant, centre + childCentres[index] - middle] as const),
                ),
            ]),
            depths: new Map([[node, depth], ...children.flatMap((subtree) => [...subtree.depths])]),
            contour: [...own, ...shiftContour(contour, -middle)],
        };
    };

    const trees = range(items.length)
        .filter((node) => parents[node] === undefined)
        .map((root) => layoutSubtree(root, 0));
    const { positions } = packSubtrees(trees, spacing);
    const centres = new Map(
        trees.flatMap((tree, index) => [...tree.centres].map(([node, centre]) => [node, centre + positions[index]] as const)),
    );
    const depths = range(items.length).map((node) => trees.map((tree) => tree.depths.get(node)).find((depth) => depth !== undefined)!);

    // Each level is as thick as its longest shape, and shapes line up with the side of the level nearest their parent
    const thickness = range(Math.max(...depths) + 1).map((level) =>
        Math.max(0, ...items.map((item, index) => (depths[index] === level ? along(item) : 0))),
    );
    const starts = levelStarts(
        thickness,
        spacingAfterLevels(thickness.length, levelSpacing, (item) => depths[item], edges),
    );
    return {
        positions: place(
            items.map((item, index) => ({ across: centres.get(index)! - across(item) / 2, along: starts[depths[index]] })),
            items,
        ),
        levels: depths,
    };
};

/**
 * Lays out a grid: each column is as wide as its widest shape and each row as tall as its tallest, and each shape
 * is centred in its cell.
 */
const layoutGrid = (layout: ShapeGridLayout, items: readonly LayoutItem[]): LayoutResult => {
    const spacing = checkSpacing(layout.spacing ?? 40, "spacing");
    const columns = layout.columns ?? Math.ceil(Math.sqrt(items.length));
    if (!(Number.isInteger(columns) && columns >= 1)) {
        throw new Error(`Invalid layout columns ${columns}. Expected a whole number, 1 or more`);
    }
    const rows = Math.ceil(items.length / columns);
    const widths = range(columns).map((column) =>
        Math.max(0, ...items.filter((_, index) => index % columns === column).map(({ width }) => width)),
    );
    const heights = range(rows).map((row) => Math.max(0, ...items.slice(row * columns, (row + 1) * columns).map(({ height }) => height)));
    const lefts = levelStarts(widths, spacing);
    const tops = levelStarts(heights, spacing);
    return {
        positions: items.map(({ width, height }, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            return { x: lefts[column] + (widths[column] - width) / 2, y: tops[row] + (heights[row] - height) / 2 };
        }),
    };
};

/**
 * Places items with a layout, starting at (0, 0).
 *
 * @param items - The boxes to place, in EMUs
 * @param edges - The connectors between them, which flow and tree layouts follow
 * @param headers - How big the headers of a flow's lanes are
 * @returns The top-left corner of each item's box, in EMUs, the level each is on in a flow or tree, and the boxes of a
 * flow's lanes
 * @throws If a spacing is negative, or a grid's number of columns isn't a whole number of 1 or more
 */
export const layoutItems = (
    layout: ShapeLayout,
    items: readonly LayoutItem[],
    edges: readonly LayoutEdge[],
    headers: LaneHeaders = { length: 0, widths: [] },
): LayoutResult => {
    if (items.length === 0) {
        return { positions: [] };
    }
    const links = edges.filter(
        ({ from, to }, index) => from !== to && edges.findIndex((edge) => edge.from === from && edge.to === to) === index,
    );
    switch (layout.type) {
        case "flow":
            return layoutFlow(layout, items, links, headers);
        case "tree":
            return layoutTree(layout, items, links);
        default:
            return layoutGrid(layout, items);
    }
};
