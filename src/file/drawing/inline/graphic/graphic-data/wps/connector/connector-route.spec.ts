import { describe, expect, it } from "vitest";

import { type ConnectorEndpoint, type ConnectorGeometry, type Point, routeConnector } from "./connector-route";

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
});
