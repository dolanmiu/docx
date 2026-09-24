import { describe, expect, it } from "vitest";

import { separateChannels } from "./connector-channels";
import type { Point } from "./connector-route";

const PIXEL = 9525;

const route = (...points: readonly (readonly [number, number])[]): readonly Point[] =>
    points.map(([x, y]) => ({ x: x * PIXEL, y: y * PIXEL }));

const pixels = (points: readonly Point[]): readonly (readonly [number, number])[] =>
    points.map(({ x, y }) => [x / PIXEL, y / PIXEL] as const);

describe("separateChannels", () => {
    // Two connectors that loop round the right of a column of shapes, along the same line at x = 124
    const upper = route([100, 25], [124, 25], [124, 225], [100, 225]);
    const lower = route([100, 125], [124, 125], [124, 325], [100, 325]);

    it("should move apart lines that lie on top of each other, centred on where they were", () => {
        const [first, second] = separateChannels(
            [
                { points: upper, movable: true },
                { points: lower, movable: true },
            ],
            6 * PIXEL,
        );
        expect(pixels(first)).to.deep.equal([
            [100, 25],
            [121, 25],
            [121, 225],
            [100, 225],
        ]);
        expect(pixels(second)).to.deep.equal([
            [100, 125],
            [127, 125],
            [127, 325],
            [100, 325],
        ]);
    });

    it("should put a line whose connector comes from further along on that side", () => {
        // The first connector comes from the right of the line, and the second from the left, so they swap places
        const fromRight = route([200, 0], [150, 0], [150, 100], [200, 100]);
        const fromLeft = route([100, 50], [150, 50], [150, 150], [100, 150]);
        const [right, left] = separateChannels(
            [
                { points: fromRight, movable: true },
                { points: fromLeft, movable: true },
            ],
            10 * PIXEL,
        );
        expect(right[1].x / PIXEL).to.equal(155);
        expect(left[1].x / PIXEL).to.equal(145);
    });

    it("should keep together connectors that meet at one end, and move them as one", () => {
        // An org chart's lines from one box share their first bend, and a third connector crosses the same line
        const toLeft = route([100, 0], [100, 30], [40, 30], [40, 60]);
        const toFarLeft = route([100, 0], [100, 30], [0, 30], [0, 60]);
        const across = route([80, 0], [80, 30], [20, 30], [20, 0]);
        const [a, b, c] = separateChannels(
            [
                { points: toLeft, movable: true },
                { points: toFarLeft, movable: true },
                { points: across, movable: true },
            ],
            6 * PIXEL,
        );
        expect(a[1].y).to.equal(b[1].y);
        expect(Math.abs(a[1].y - c[1].y)).to.equal(6 * PIXEL);
    });

    it("should leave lines on the same line that don't overlap, even a fraction of a pixel apart", () => {
        const higher = route([50, 20], [80.2, 20], [80.2, 48], [111, 48]);
        const further = route([50, 90], [80, 90], [80, 62], [111, 62]);
        const separated = separateChannels(
            [
                { points: higher, movable: true },
                { points: further, movable: true },
            ],
            6 * PIXEL,
        );
        expect(separated).to.deep.equal([higher, further]);

        // A line between two others that overlap each other doesn't keep them apart
        const long = route([0, 0], [100, 0], [100, 50], [200, 50]);
        const between = route([0, 60], [100.4, 60], [100.4, 70], [200, 70]);
        const inside = route([300, 10], [100.2, 10], [100.2, 30], [300, 30]);
        const [first, middle, last] = separateChannels(
            [
                { points: long, movable: true },
                { points: between, movable: true },
                { points: inside, movable: true },
            ],
            6 * PIXEL,
        );
        expect(middle).to.equal(between);
        expect(first).to.not.equal(long);
        expect(last).to.not.equal(inside);
    });

    it("should leave routes that can't move, and lines that only meet end to end", () => {
        const [first, second] = separateChannels(
            [
                { points: upper, movable: false },
                { points: lower, movable: true },
            ],
            6 * PIXEL,
        );
        expect(first).to.equal(upper);
        expect(second).to.equal(lower);

        const above = route([100, 0], [124, 0], [124, 100], [100, 100]);
        const below = route([100, 100], [124, 100], [124, 200], [100, 200]);
        const [touching] = separateChannels(
            [
                { points: above, movable: true },
                { points: below, movable: true },
            ],
            6 * PIXEL,
        );
        expect(touching).to.equal(above);
    });
});
