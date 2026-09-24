import { describe, expect, it } from "vitest";

import { type LayoutItem, type LayoutPosition, layoutItems, placeInOrder } from "./shape-layout";

const EMUS_PER_PIXEL = 9525;

const box = (width: number, height: number): LayoutItem => ({ width: width * EMUS_PER_PIXEL, height: height * EMUS_PER_PIXEL });

// Positions in whole pixels
const pixels = (positions: readonly LayoutPosition[]): readonly (readonly [number, number])[] =>
    positions.map(({ x, y }) => [Math.round(x / EMUS_PER_PIXEL), Math.round(y / EMUS_PER_PIXEL)] as const);

const centreX = ({ x }: LayoutPosition, item: LayoutItem): number => Math.round((x + item.width / 2) / EMUS_PER_PIXEL);

describe("placeInOrder", () => {
    it("should keep items at their wanted positions when they are far enough apart", () => {
        expect(placeInOrder([0, 20, 40], [10, 10])).to.deep.equal([0, 20, 40]);
    });

    it("should spread items that want the same place evenly around it", () => {
        expect(placeInOrder([0, 0, 0], [10, 10])).to.deep.equal([-10, 0, 10]);
    });

    it("should move only the items that are too close", () => {
        expect(placeInOrder([5, 0, 20], [10, 10])).to.deep.equal([-2.5, 7.5, 20]);
    });
});

describe("layoutItems", () => {
    it("should place nothing when there is nothing to place", () => {
        expect(layoutItems({ type: "flow" }, [], [])).to.deep.equal({ positions: [] });
    });

    it("should throw for negative spacing and bad column counts", () => {
        expect(() => layoutItems({ type: "flow", spacing: -1 }, [box(10, 10)], [])).to.throw("Invalid layout spacing -1");
        expect(() => layoutItems({ type: "tree", levelSpacing: Number.NaN }, [box(10, 10)], [])).to.throw(
            "Invalid layout levelSpacing NaN",
        );
        expect(() => layoutItems({ type: "grid", columns: 0 }, [box(10, 10)], [])).to.throw("Invalid layout columns 0");
        expect(() => layoutItems({ type: "grid", columns: 1.5 }, [box(10, 10)], [])).to.throw("Invalid layout columns 1.5");
    });

    describe("flow", () => {
        // Start → review → publish or fix, and fix → review
        const items = [box(120, 40), box(120, 70), box(100, 40), box(100, 40)];
        const edges = [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 1, to: 3 },
            { from: 3, to: 1 },
        ];

        it("should put each shape on the level after the shapes that connect to it, centred on the level", () => {
            const { positions, levels } = layoutItems({ type: "flow" }, items, edges);
            expect(levels).to.deep.equal([0, 1, 2, 2]);
            // Levels are 50 pixels apart, and the 40 pixel shapes are centred on the 70 pixel level
            expect(pixels(positions).map(([, y]) => y)).to.deep.equal([0, 90, 210, 210]);
            // The shapes on the last level are 40 pixels apart, and the decision is centred over them
            const [, , publish, fix] = pixels(positions);
            expect(fix[0] - publish[0]).to.equal(140);
            expect(centreX(positions[1], items[1])).to.equal((centreX(positions[2], items[2]) + centreX(positions[3], items[3])) / 2);
            expect(centreX(positions[0], items[0])).to.equal(centreX(positions[1], items[1]));
        });

        it("should take its spacing", () => {
            const { positions } = layoutItems({ type: "flow", spacing: 10, levelSpacing: 20 }, items, edges);
            const [start, review, publish, fix] = pixels(positions);
            expect(review[1] - start[1]).to.equal(60);
            expect(fix[0] - publish[0]).to.equal(110);
        });

        it("should run right, up and left", () => {
            const down = pixels(layoutItems({ type: "flow" }, items, edges).positions);
            expect(pixels(layoutItems({ type: "flow", direction: "right" }, items, edges).positions).map(([x]) => x)).to.deep.equal([
                0, 170, 340, 340,
            ]);
            // Upwards, the last level is at the top
            const up = pixels(layoutItems({ type: "flow", direction: "up" }, items, edges).positions);
            expect(up.map(([, y]) => y)).to.deep.equal([210, 90, 0, 0]);
            expect(up.map(([x]) => x)).to.deep.equal(down.map(([x]) => x));
            // Leftwards, the last level is on the left, and each level is as wide as its widest shape
            expect(pixels(layoutItems({ type: "flow", direction: "left" }, items, edges).positions).map(([x]) => x)).to.deep.equal([
                320, 150, 0, 0,
            ]);
        });

        it("should put a shape that only connects onwards on the level before the shape it connects to", () => {
            // a → b → c, and d → c
            const { levels } = layoutItems(
                { type: "flow" },
                [box(10, 10), box(10, 10), box(10, 10), box(10, 10)],
                [
                    { from: 0, to: 1 },
                    { from: 1, to: 2 },
                    { from: 3, to: 2 },
                ],
            );
            expect(levels).to.deep.equal([0, 1, 2, 1]);
        });

        it("should leave room for connectors that skip levels", () => {
            // a → b → c → d, and a → d
            const four = [box(100, 40), box(100, 40), box(100, 40), box(100, 40)];
            const { positions } = layoutItems({ type: "flow" }, four, [
                { from: 0, to: 1 },
                { from: 1, to: 2 },
                { from: 2, to: 3 },
                { from: 0, to: 3 },
            ]);
            const [a, b, c, d] = pixels(positions);
            // The long connector passes beside b and c, so a and d sit to one side of them
            expect(b[0]).to.equal(c[0]);
            expect(a[0]).to.equal(d[0]);
            expect(a[0]).to.not.equal(b[0]);
        });

        it("should order levels to reduce crossings", () => {
            // a → d and b → c: d and c swap places so the connectors don't cross
            const { positions } = layoutItems(
                { type: "flow" },
                [box(10, 10), box(10, 10), box(10, 10), box(10, 10)],
                [
                    { from: 0, to: 3 },
                    { from: 1, to: 2 },
                ],
            );
            const [a, b, c, d] = pixels(positions);
            expect(a[0] < b[0]).to.equal(d[0] < c[0]);
        });

        it("should keep trying orders, going up and down, when the connectors can't help crossing", () => {
            // Three shapes each connected to the same three shapes always cross. The last shape connects to nothing
            const seven = [box(10, 10), box(10, 10), box(10, 10), box(10, 10), box(10, 10), box(10, 10), box(10, 10)];
            const crossing = [0, 1, 2].flatMap((from) => [3, 4, 5].map((to) => ({ from, to })));
            const { levels } = layoutItems({ type: "flow" }, seven, crossing);
            expect(levels).to.deep.equal([0, 0, 0, 1, 1, 1, 0]);
        });

        it("should place shapes without connectors side by side, and ignore repeated connectors and loops", () => {
            const { positions, levels } = layoutItems({ type: "flow", spacing: 10 }, [box(20, 10), box(20, 10)], [{ from: 0, to: 0 }]);
            expect(levels).to.deep.equal([0, 0]);
            expect(pixels(positions)).to.deep.equal([
                [0, 0],
                [30, 0],
            ]);
            expect(
                layoutItems(
                    { type: "flow" },
                    [box(20, 10), box(20, 10)],
                    [
                        { from: 0, to: 1 },
                        { from: 0, to: 1 },
                    ],
                ).levels,
            ).to.deep.equal([0, 1]);
        });
    });

    describe("tree", () => {
        // A root with three children, and two children under the first and three under the last
        const items = [
            box(120, 50),
            box(100, 40),
            box(100, 40),
            box(100, 40),
            box(80, 30),
            box(80, 30),
            box(80, 30),
            box(80, 30),
            box(80, 30),
        ];
        const edges = [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 0, to: 3 },
            { from: 1, to: 4 },
            { from: 1, to: 5 },
            { from: 3, to: 6 },
            { from: 3, to: 7 },
            { from: 3, to: 8 },
        ];

        it("should centre each parent over its first and last children, and line each level up with its top", () => {
            const { positions, levels } = layoutItems({ type: "tree" }, items, edges);
            expect(levels).to.deep.equal([0, 1, 1, 1, 2, 2, 2, 2, 2]);
            const centres = positions.map((position, index) => centreX(position, items[index]));
            expect(centres[0]).to.equal((centres[1] + centres[3]) / 2);
            expect(centres[1]).to.equal((centres[4] + centres[5]) / 2);
            expect(centres[3]).to.equal((centres[6] + centres[8]) / 2);
            // Levels are as tall as their tallest shape, 40 pixels apart, and shapes line up with the top of their level
            expect(pixels(positions).map(([, y]) => y)).to.deep.equal([0, 90, 90, 90, 170, 170, 170, 170, 170]);
        });

        it("should pack subtrees as close as their outlines allow", () => {
            const { positions } = layoutItems({ type: "tree", spacing: 20 }, items, edges);
            const [, , , , , second, third] = pixels(positions);
            // The last child of the first subtree and the first child of the last one are side by side on their level,
            // with only the middle child between them one level up
            expect(third[0] - second[0]).to.be.greaterThanOrEqual(100);
        });

        it("should pack a deeper subtree after a shallower one", () => {
            // The root's first child is a leaf, and its second has a child of its own
            const { positions } = layoutItems(
                { type: "tree", spacing: 10, levelSpacing: 10 },
                [box(10, 10), box(10, 10), box(10, 10), box(40, 10)],
                [
                    { from: 0, to: 1 },
                    { from: 0, to: 2 },
                    { from: 2, to: 3 },
                ],
            );
            // The children are 10 pixels apart, the wide grandchild is centred under its parent, and the root over both
            expect(pixels(positions)).to.deep.equal([
                [10, 0],
                [0, 20],
                [20, 20],
                [5, 40],
            ]);
        });

        it("should place several trees side by side, and keep the first parent a shape is given", () => {
            // Two roots, and a connector that would make a loop
            const { levels, positions } = layoutItems(
                { type: "tree", spacing: 10 },
                [box(20, 10), box(20, 10), box(20, 10)],
                [
                    { from: 0, to: 1 },
                    { from: 1, to: 0 },
                    { from: 2, to: 1 },
                ],
            );
            expect(levels).to.deep.equal([0, 1, 0]);
            expect(pixels(positions)[2][0]).to.equal(30);
        });

        it("should grow right, up and left", () => {
            const two = [box(20, 10), box(30, 10)];
            const edge = [{ from: 0, to: 1 }];
            expect(pixels(layoutItems({ type: "tree", levelSpacing: 5 }, two, edge).positions)).to.deep.equal([
                [5, 0],
                [0, 15],
            ]);
            expect(pixels(layoutItems({ type: "tree", direction: "right", levelSpacing: 5 }, two, edge).positions)).to.deep.equal([
                [0, 0],
                [25, 0],
            ]);
            expect(pixels(layoutItems({ type: "tree", direction: "up", levelSpacing: 5 }, two, edge).positions)).to.deep.equal([
                [5, 15],
                [0, 0],
            ]);
            expect(pixels(layoutItems({ type: "tree", direction: "left", levelSpacing: 5 }, two, edge).positions)).to.deep.equal([
                [35, 0],
                [0, 0],
            ]);
        });
    });

    describe("grid", () => {
        it("should centre each shape in its cell, in rows of the given number of columns", () => {
            const { positions, levels } = layoutItems(
                { type: "grid", columns: 3, spacing: 10 },
                [box(50, 50), box(100, 20), box(30, 30), box(60, 60), box(10, 10)],
                [],
            );
            expect(levels).to.equal(undefined);
            expect(pixels(positions)).to.deep.equal([
                [5, 0],
                [70, 15],
                [180, 10],
                [0, 60],
                [115, 85],
            ]);
        });

        it("should make the grid about as wide as it is tall by default", () => {
            const { positions } = layoutItems({ type: "grid" }, [box(10, 10), box(10, 10), box(10, 10), box(10, 10), box(10, 10)], []);
            // Three columns for five shapes
            expect(pixels(positions).map(([, y]) => y)).to.deep.equal([0, 0, 0, 50, 50]);
        });
    });
});
