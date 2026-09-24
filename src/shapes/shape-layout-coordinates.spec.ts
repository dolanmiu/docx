import { describe, expect, it } from "vitest";

import { type LevelGraph, type LevelLink, assignLevelCoordinates } from "./shape-layout-coordinates";

const SPACING = 10;

/**
 * A graph whose nodes are as wide as `sizes` gives, or 20, or points of no width, with `SPACING` between shapes.
 */
const graphOf = (
    order: readonly (readonly number[])[],
    links: readonly LevelLink[],
    sizes: Readonly<Record<number, number>> = {},
    points: readonly number[] = [],
): LevelGraph => ({
    order,
    links,
    sizes: new Map(order.flat().map((node) => [node, points.includes(node) ? 0 : (sizes[node] ?? 20)])),
    points: new Set(points),
    spacing: SPACING,
});

const gapOf = (graph: LevelGraph, a: number, b: number): number =>
    (graph.sizes.get(a)! + graph.sizes.get(b)!) / 2 + (graph.points.has(a) || graph.points.has(b) ? SPACING / 2 : SPACING);

const expectGaps = (graph: LevelGraph, centres: ReadonlyMap<number, number>): void => {
    for (const level of graph.order) {
        for (let index = 1; index < level.length; index++) {
            expect(centres.get(level[index])! - centres.get(level[index - 1])!).to.be.at.least(
                gapOf(graph, level[index - 1], level[index]) - 1e-9,
            );
        }
    }
};

describe("assignLevelCoordinates", () => {
    it("should line up a chain of shapes", () => {
        const centres = assignLevelCoordinates(
            graphOf(
                [[0], [1], [2]],
                [
                    { from: 0, to: 1 },
                    { from: 1, to: 2 },
                ],
                { 1: 80 },
            ),
        );
        expect(centres.get(0)).to.equal(centres.get(1));
        expect(centres.get(1)).to.equal(centres.get(2));
    });

    it("should put a shape over the middle one of the shapes it leads to, whatever their sizes", () => {
        const graph = graphOf(
            [[0], [1, 2, 3]],
            [
                { from: 0, to: 1 },
                { from: 0, to: 2 },
                { from: 0, to: 3 },
            ],
            { 1: 100, 2: 50, 3: 300 },
        );
        const centres = assignLevelCoordinates(graph);
        expect(centres.get(0)).to.equal(centres.get(2));
        expectGaps(graph, centres);
    });

    it("should put a shape with two shapes before it between them", () => {
        const graph = graphOf(
            [[0, 1], [2]],
            [
                { from: 0, to: 2 },
                { from: 1, to: 2 },
            ],
        );
        const centres = assignLevelCoordinates(graph);
        expect(centres.get(2)).to.be.closeTo((centres.get(0)! + centres.get(1)!) / 2, 1e-9);
    });

    it("should keep a long connector straight, and move shapes that would bend it", () => {
        // 0 leads to 4 through the points 5 and 6, beside the chain 1, 2, 3, 7, whose wide shape 2 pushes against it
        const graph = graphOf(
            [
                [0, 1],
                [5, 2],
                [6, 3],
                [4, 7],
            ],
            [
                { from: 0, to: 5 },
                { from: 5, to: 6 },
                { from: 6, to: 4 },
                { from: 1, to: 2 },
                { from: 2, to: 3 },
                { from: 3, to: 7 },
            ],
            { 2: 120 },
            [5, 6],
        );
        const centres = assignLevelCoordinates(graph);
        expect(centres.get(5)).to.equal(centres.get(6));
        expectGaps(graph, centres);
    });

    it("should not line up a link that crosses a long connector", () => {
        // 1 leads to 4, crossing the long connector from 0 through 2 and 3 to 5
        const graph = graphOf(
            [
                [0, 1],
                [2, 6],
                [4, 3],
                [5, 7],
            ],
            [
                { from: 0, to: 2 },
                { from: 2, to: 3 },
                { from: 3, to: 5 },
                { from: 1, to: 6 },
                { from: 6, to: 4 },
                { from: 4, to: 7 },
            ],
            {},
            [2, 3],
        );
        const centres = assignLevelCoordinates(graph);
        expect(centres.get(2)).to.equal(centres.get(3));
        expectGaps(graph, centres);
    });

    it("should not line up shapes joined by a link that is left out of lining up", () => {
        const centres = assignLevelCoordinates(
            graphOf(
                [[0], [1, 2]],
                [
                    { from: 0, to: 1 },
                    { from: 0, to: 2, skipAlignment: true },
                ],
            ),
        );
        expect(centres.get(0)).to.equal(centres.get(1));
    });

    it("should line the layouts up with the narrowest of them", () => {
        // Lining 0 up with 1 or with 2 makes layouts of different widths
        const graph = graphOf(
            [[0], [1, 2, 3]],
            [
                { from: 0, to: 1 },
                { from: 0, to: 2 },
            ],
            { 0: 60, 1: 20, 2: 100, 3: 100 },
        );
        const centres = assignLevelCoordinates(graph);
        expect(centres.get(0)).to.be.within(centres.get(1)!, centres.get(2)!);
        expectGaps(graph, centres);
    });

    it("should keep long connectors that cross each other straight where they can", () => {
        // Two long connectors, from 0 to 6 and from 1 to 7, cross between the points on the middle levels
        const graph = graphOf(
            [
                [0, 1],
                [2, 3],
                [4, 5],
                [6, 7],
            ],
            [
                { from: 0, to: 2 },
                { from: 2, to: 5 },
                { from: 5, to: 7 },
                { from: 1, to: 3 },
                { from: 3, to: 4 },
                { from: 4, to: 6 },
            ],
            {},
            [2, 3, 4, 5],
        );
        const centres = assignLevelCoordinates(graph);
        expect([...centres.values()].every(Number.isFinite)).to.equal(true);
        expectGaps(graph, centres);
    });

    it("should pack shapes without links next to each other", () => {
        const graph = graphOf([[0, 1, 2]], []);
        const centres = assignLevelCoordinates(graph);
        expect(centres.get(1)! - centres.get(0)!).to.equal(30);
        expect(centres.get(2)! - centres.get(1)!).to.equal(30);
    });
});
