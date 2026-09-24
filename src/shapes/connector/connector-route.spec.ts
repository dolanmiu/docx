import { describe, expect, it } from "vitest";

import {
    type Bounds,
    type ConnectorEndpoint,
    type ConnectorGeometry,
    type Point,
    fitElbowConnector,
    routeConnector,
} from "./connector-route";

const MARGIN = 228600;

/**
 * Draws a connector the way Word does: the preset's path in its box, flipped and then rotated about the box's centre.
 */
const drawConnector = ({ type, adjustments, offset, width: w, height: h, rotation, flip }: ConnectorGeometry): readonly Point[] => {
    const x1 = (w * (adjustments.bendX ?? adjustments.firstBendX ?? 50)) / 100;
    const y2 = (h * (adjustments.secondBendY ?? 50)) / 100;
    const x3 = (w * (adjustments.thirdBendX ?? 50)) / 100;
    const paths: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
        straightConnector: [
            [0, 0],
            [w, h],
        ],
        OneBend: [
            [0, 0],
            [w, 0],
            [w, h],
        ],
        Connector: [
            [0, 0],
            [x1, 0],
            [x1, h],
            [w, h],
        ],
        ThreeBends: [
            [0, 0],
            [x1, 0],
            [x1, y2],
            [w, y2],
            [w, h],
        ],
        FourBends: [
            [0, 0],
            [x1, 0],
            [x1, y2],
            [x3, y2],
            [x3, h],
            [w, h],
        ],
    };
    const path = paths[type] ?? paths[Object.keys(paths).find((suffix) => type.endsWith(suffix))!];
    const radians = (rotation * Math.PI) / 180;
    return path.map(([x, y]) => {
        const dx = (flip.horizontal ? -1 : 1) * (x - w / 2);
        const dy = (flip.vertical ? -1 : 1) * (y - h / 2);
        return {
            x: offset.x + w / 2 + dx * Math.cos(radians) - dy * Math.sin(radians),
            y: offset.y + h / 2 + dx * Math.sin(radians) + dy * Math.cos(radians),
        };
    });
};

// Adding 0 turns -0 into 0
const directionOf = (from: Point, to: Point): Point => ({
    x: Math.sign(Math.round(to.x - from.x)) + 0,
    y: Math.sign(Math.round(to.y - from.y)) + 0,
});
const DIRECTIONS: Readonly<Record<number, Point>> = { 0: { x: 1, y: 0 }, 90: { x: 0, y: 1 }, 180: { x: -1, y: 0 }, 270: { x: 0, y: -1 } };

/**
 * Checks that the drawn connector starts and ends at the right points, leaves the first shape
 * in the direction of its site, and arrives at the second shape going into it.
 */
const expectConnects = (geometry: ConnectorGeometry, start: ConnectorEndpoint, end: ConnectorEndpoint, tolerance = 1): void => {
    const drawn = drawConnector(geometry);
    const first = drawn[0];
    const last = drawn[drawn.length - 1];
    expect(first.x).to.be.closeTo(start.point.x, 1);
    expect(first.y).to.be.closeTo(start.point.y, 1);
    expect(last.x).to.be.closeTo(end.point.x, tolerance);
    expect(last.y).to.be.closeTo(end.point.y, tolerance);
    const rounded = (points: readonly Point[]): readonly Point[] =>
        points.map(({ x, y }) => ({ x: Math.round(x) + 0, y: Math.round(y) + 0 }));
    expect(rounded(drawn)).to.deep.equal(rounded(geometry.points));
    if (geometry.type !== "straightConnector") {
        const arriving = DIRECTIONS[end.angle];
        expect(directionOf(drawn[0], drawn[1])).to.deep.equal(DIRECTIONS[start.angle]);
        expect(directionOf(drawn[drawn.length - 2], last)).to.deep.equal({ x: -arriving.x + 0, y: -arriving.y + 0 });
    }
};

// Positions are given in thousands of EMUs, so shapes are a sensible size
const at = (x: number, y: number, angle: number): ConnectorEndpoint => ({ point: { x: x * 1000, y: y * 1000 }, angle });

describe("routeConnector", () => {
    describe("straight", () => {
        it("should run from the top-left to the bottom-right of its box", () => {
            const start = at(100, 200, 0);
            const end = at(1100, 700, 180);
            const geometry = routeConnector("straight", start, end);
            expect(geometry).to.deep.include({
                type: "straightConnector",
                offset: { x: 100000, y: 200000 },
                width: 1000000,
                height: 500000,
                rotation: 0,
                flip: { horizontal: false, vertical: false },
                adjustments: {},
            });
            expectConnects(geometry, start, end);
        });

        it("should flip to run in other directions", () => {
            const start = at(1100, 700, 0);
            const end = at(100, 200, 0);
            const geometry = routeConnector("straight", start, end);
            expect(geometry.flip).to.deep.equal({ horizontal: true, vertical: true });
            expect(geometry.offset).to.deep.equal({ x: 100000, y: 200000 });
            expectConnects(geometry, start, end);
        });
    });

    describe("elbow", () => {
        it("should bend halfway between facing sides", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 500, 180);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry).to.deep.include({
                type: "elbowConnector",
                adjustments: { bendX: 50 },
                rotation: 0,
                width: 1000000,
                height: 500000,
            });
            expectConnects(geometry, start, end);
        });

        it("should flip when the end is above the start", () => {
            const start = at(0, 500, 0);
            const end = at(1000, 0, 180);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry.flip).to.deep.equal({ horizontal: false, vertical: true });
            expectConnects(geometry, start, end);
        });

        it("should rotate to leave a shape vertically", () => {
            const start = at(0, 0, 90);
            const end = at(400, 1000, 270);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry).to.deep.include({ type: "elbowConnector", rotation: 90, width: 1000000, height: 400000 });
            expect(geometry.flip).to.deep.equal({ horizontal: false, vertical: true });
            expectConnects(geometry, start, end);

            const upwards = routeConnector("elbow", at(400, 1000, 270), at(0, 0, 90));
            expect(upwards.flip).to.deep.equal({ horizontal: true, vertical: false });
            expectConnects(upwards, at(400, 1000, 270), at(0, 0, 90));
        });

        it("should loop past the end when both ends face the same way", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 500, 0);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry.type).to.equal("elbowConnector");
            expect(geometry.adjustments.bendX).to.be.closeTo(((1000000 + MARGIN) / 1000000) * 100, 1e-9);
            expectConnects(geometry, start, end);
        });

        it("should loop past the start when the end is behind it", () => {
            const start = at(1000, 0, 0);
            const end = at(0, 500, 0);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry.adjustments.bendX).to.be.closeTo((-MARGIN / 1000000) * 100, 1e-9);
            expectConnects(geometry, start, end);
        });

        it("should loop around shapes that are level with each other", () => {
            const start = at(0, 0, 0);
            const end = at(0, 500, 0);
            const geometry = routeConnector("elbow", start, end);
            // The box can't have no width, so the end moves by a pixel
            expect(geometry.width).to.equal(9525);
            expectConnects(geometry, start, end, 9525);
        });

        it("should double back when the end faces away from the start", () => {
            const start = at(1000, 0, 0);
            const end = at(0, 500, 180);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry.type).to.equal("elbowConnectorFourBends");
            expect(geometry.adjustments.secondBendY).to.equal(50);
            expectConnects(geometry, start, end);
        });

        it("should double back when the ends are level", () => {
            const start = at(0, 0, 0);
            const end = at(0, 500, 180);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry.type).to.equal("elbowConnectorFourBends");
            expectConnects(geometry, start, end, 9525);

            const inLine = routeConnector("elbow", at(1000, 0, 0), at(0, 0, 180));
            expect(inLine.adjustments.secondBendY).to.equal(50);
        });

        it("should make one right angle between sides at right angles", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 500, 270);
            const geometry = routeConnector("elbow", start, end);
            expect(geometry).to.deep.include({ type: "elbowConnectorOneBend", adjustments: {}, rotation: 0 });
            expectConnects(geometry, start, end);
        });

        it("should bend three times when a right angle would go the wrong way", () => {
            const leavingBackwards = routeConnector("elbow", at(0, 0, 180), at(1000, 500, 270));
            expect(leavingBackwards.type).to.equal("elbowConnectorThreeBends");
            expect(leavingBackwards.adjustments.secondBendY).to.equal(50);
            expectConnects(leavingBackwards, at(0, 0, 180), at(1000, 500, 270));

            const arrivingBackwards = routeConnector("elbow", at(0, 0, 0), at(1000, 500, 90));
            expect(arrivingBackwards.adjustments.firstBendX).to.equal(50);
            expectConnects(arrivingBackwards, at(0, 0, 0), at(1000, 500, 90));

            const bothBackwards = routeConnector("elbow", at(0, 0, 180), at(1000, 500, 90));
            expectConnects(bothBackwards, at(0, 0, 180), at(1000, 500, 90));
        });

        it("should keep bends measurable when an end is level with the start", () => {
            const geometry = routeConnector("elbow", at(0, 0, 180), at(1000, 0, 270));
            expect(geometry.adjustments.secondBendY).to.equal(50);
            expect(geometry.height).to.equal(0);
        });

        it("should round end angles to the nearest right angle", () => {
            expect(routeConnector("elbow", at(0, 0, 85), at(400, 1000, -95)).rotation).to.equal(90);
        });
    });

    describe("curved", () => {
        it("should use the curved connector with the same bends", () => {
            expect(routeConnector("curved", at(0, 0, 0), at(1000, 500, 180))).to.deep.include({
                type: "curvedConnector",
                adjustments: { bendX: 50 },
            });
            expect(routeConnector("curved", at(0, 0, 0), at(1000, 500, 270)).type).to.equal("curvedConnectorOneBend");
            expect(routeConnector("curved", at(0, 0, 180), at(1000, 500, 270)).type).to.equal("curvedConnectorThreeBends");
            expect(routeConnector("curved", at(1000, 0, 0), at(0, 500, 180)).type).to.equal("curvedConnectorFourBends");
        });
    });
    describe("margin", () => {
        it("should loop out by the margin it is given", () => {
            const geometry = routeConnector("elbow", at(0, 0, 0), at(1000, 500, 0), { margin: 100000 });
            expect(geometry.adjustments.bendX).to.be.closeTo(((1000000 + 100000) / 1000000) * 100, 1e-9);
        });

        it("should reject a negative margin", () => {
            expect(() => routeConnector("elbow", at(0, 0, 0), at(1000, 500, 180), { margin: -1 })).to.throw("Invalid connector margin -1");
            expect(() => routeConnector("straight", at(0, 0, 0), at(1000, 500, 180), { margin: Number.NaN })).to.throw(
                "Invalid connector margin NaN",
            );
        });
    });

    describe("obstacles", () => {
        const box = (left: number, top: number, right: number, bottom: number): Bounds => ({
            left: left * 1000,
            top: top * 1000,
            right: right * 1000,
            bottom: bottom * 1000,
        });

        it("should keep the usual route when it doesn't cross an obstacle", () => {
            const geometry = routeConnector("elbow", at(0, 0, 0), at(1000, 500, 180), { obstacles: [box(2000, 2000, 2100, 2100)] });
            expect(geometry).to.deep.include({ type: "elbowConnector", adjustments: { bendX: 50 } });
        });

        it("should go around an obstacle between facing ends, clear of it by a margin", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 0, 180);
            const geometry = routeConnector("elbow", start, end, { obstacles: [box(400, -100, 600, 100)] });
            expect(geometry.type).to.equal("elbowConnectorFourBends");
            expectConnects(geometry, start, end, 9525);
            // Below the obstacle, a margin away from it and from its sides
            expect(geometry.points.map(({ x, y }) => [x, y])).to.deep.equal([
                [0, 0],
                [400000 - MARGIN, 0],
                [400000 - MARGIN, 100000 + MARGIN],
                [600000 + MARGIN, 100000 + MARGIN],
                [600000 + MARGIN, 9525],
                [1000000, 9525],
            ]);
        });

        it("should bend three times to go around an obstacle in the corner of a right angle", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 1000, 270);
            // The usual route goes right along the top, then down. An obstacle sits in the top-right corner
            const geometry = routeConnector("elbow", start, end, { obstacles: [box(800, -200, 1200, 200)] });
            expect(geometry.type).to.equal("elbowConnectorThreeBends");
            expectConnects(geometry, start, end);
        });

        it("should go around an obstacle when it arrives at a right angle from behind", () => {
            const start = at(0, 0, 0);
            // The end faces down, so the connector comes up into it from below
            const end = at(1000, 1000, 90);
            const geometry = routeConnector("elbow", start, end, { obstacles: [box(400, -100, 600, 100)] });
            expect(geometry.type).to.equal("elbowConnectorThreeBends");
            expectConnects(geometry, start, end);
            expect(geometry.points[1].x).to.equal(400000 - MARGIN);
        });

        it("should keep one bend at a right angle when that route is clear", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 1000, 270);
            // The usual route is clear, but an obstacle below it makes the router look
            const geometry = routeConnector("elbow", start, end, { obstacles: [box(300, 300, 600, 600)] });
            expect(geometry.type).to.equal("elbowConnectorOneBend");
        });

        it("should keep the usual route when no route is clear of more obstacles", () => {
            // The end is inside an obstacle, so every route crosses it
            const geometry = routeConnector("elbow", at(0, 0, 0), at(1000, 500, 180), { obstacles: [box(900, 400, 1100, 600)] });
            expect(geometry).to.deep.include({ type: "elbowConnector", adjustments: { bendX: 50 } });
        });

        it("should go through a gap narrower than two margins, and still attach to the shapes", () => {
            // A wall of shapes with a gap in it, below the line between the ends. The shapes at the ends of the wall are
            // too far away to be tried for places to bend
            const wall = Array.from({ length: 15 }, (_, index) => [
                box(900, 450 - 400 * (index + 1), 1100, 450 - 400 * index),
                box(900, 550 + 400 * index, 1100, 550 + 400 * (index + 1)),
            ]).flat();
            const start = at(0, 0, 0);
            const end = at(2000, 0, 180);
            const geometry = routeConnector("elbow", start, end, { obstacles: wall });
            expect(geometry.type).to.equal("elbowConnectorFourBends");
            expectConnects(geometry, start, end, 9525);
            // Through the middle of the gap
            expect(geometry.points[2].y).to.equal(500000);
        });

        it("should go through a gap with two or three bends as the presets do", () => {
            // A vertical wall with a gap, and an end past it that faces up
            const vertical = Array.from({ length: 15 }, (_, index) => [
                box(900, 450 - 400 * (index + 1), 1100, 450 - 400 * index),
                box(900, 550 + 400 * index, 1100, 550 + 400 * (index + 1)),
            ]).flat();
            const start = at(0, 0, 0);
            const below = at(2000, 1400, 270);
            const turning = routeConnector("elbow", start, below, { obstacles: vertical });
            expect(turning.type).to.equal("elbowConnectorThreeBends");
            expectConnects(turning, start, below, 9525);
            expect(turning.points[2].y).to.equal(500000);

            // A horizontal wall with a gap, and an end below it that faces left
            const horizontal = Array.from({ length: 15 }, (_, index) => [
                box(750 - 400 * (index + 1), 400, 750 - 400 * index, 600),
                box(850 + 400 * index, 400, 850 + 400 * (index + 1), 600),
            ]).flat();
            const across = at(2000, 1000, 180);
            const straight = routeConnector("elbow", start, across, { obstacles: horizontal });
            expect(straight.type).to.equal("elbowConnector");
            expectConnects(straight, start, across, 9525);
            expect(straight.points[1].x).to.equal(800000);
        });

        it("should draw a route that needs more than four bends as a line that isn't attached", () => {
            const pixels = (x: number, y: number): Point => ({ x: x * 9525, y: y * 9525 });
            const shape = (left: number, top: number, right: number, bottom: number): Bounds => ({
                left: left * 9525,
                top: top * 9525,
                right: right * 9525,
                bottom: bottom * 9525,
            });
            const geometry = routeConnector(
                "elbow",
                { point: pixels(0, 0), angle: 270 },
                { point: pixels(200, 40), angle: 0 },
                { margin: 20 * 9525, obstacles: [shape(220, 100, 260, 160), shape(-20, -80, 20, -60), shape(160, -80, 240, 0)] },
            );
            expect(geometry).to.deep.include({
                type: "freeform",
                offset: pixels(0, -20),
                width: 220 * 9525,
                height: 60 * 9525,
                rotation: 0,
                flip: { horizontal: false, vertical: false },
            });
            expect(geometry.points).to.deep.equal([
                pixels(0, 0),
                pixels(0, -20),
                pixels(40, -20),
                pixels(40, 20),
                pixels(220, 20),
                pixels(220, 40),
                pixels(200, 40),
            ]);
        });

        it("should keep the curved route through an obstacle, rather than draw a line", () => {
            const geometry = routeConnector("curved", at(0, 0, 90), at(1000, 0, 0), {
                obstacles: [box(-100, 300, 100, 400), box(900, -200, 1300, 400)],
            });
            expect(geometry.type).to.not.equal("freeform");
        });

        it("should only look at the obstacles nearest the connector for places to bend", () => {
            const far = Array.from({ length: 20 }, (_, index) => box(5000 + index * 300, 5000, 5100 + index * 300, 5100));
            const start = at(0, 0, 0);
            const end = at(1000, 0, 180);
            const geometry = routeConnector("elbow", start, end, { obstacles: [...far, box(400, -100, 600, 100)] });
            expect(geometry.type).to.equal("elbowConnectorFourBends");
            expectConnects(geometry, start, end, 9525);
        });
    });

    describe("fitElbowConnector", () => {
        it("should draw a route whose bends have moved with the preset that bends there", () => {
            const start = at(0, 0, 0);
            const end = at(1000, 500, 180);
            const moved = [start.point, { x: 300000, y: 0 }, { x: 300000, y: 500000 }, end.point];
            const geometry = fitElbowConnector(start, end, moved, MARGIN);
            expect(geometry).to.deep.include({ type: "elbowConnector", adjustments: { bendX: 30 } });
            expectConnects(geometry, start, end);
        });

        it("should draw a route with more than four bends as a freeform line", () => {
            const points = [
                { x: 0, y: 0 },
                { x: 0, y: -100 },
                { x: 200, y: -100 },
                { x: 200, y: 100 },
                { x: 400, y: 100 },
                { x: 400, y: 50 },
                { x: 300, y: 50 },
            ];
            const geometry = fitElbowConnector({ point: points[0], angle: 270 }, { point: points[6], angle: 0 }, points, 50);
            expect(geometry.type).to.equal("freeform");
            expect(geometry.points).to.equal(points);
        });
    });
});
