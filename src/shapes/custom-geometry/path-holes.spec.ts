import { describe, expect, it } from "vitest";

import { orientParts } from "./path-holes";
import { type PathSegment, parseSvgPath, pointOnArc } from "./svg-path";

const oriented = (path: string): readonly PathSegment[] => orientParts(parseSvgPath(path));

// Squares 100, 50 and 20 wide around the same middle, clockwise on the page, and the same squares anticlockwise
const OUTER = "M 0 0 H 100 V 100 H 0 Z";
const MIDDLE = "M 25 25 H 75 V 75 H 25 Z";
const INNER = "M 40 40 H 60 V 60 H 40 Z";
const MIDDLE_ANTICLOCKWISE = "M 25 25 V 75 H 75 V 25 Z";

describe("orientParts", () => {
    it("should turn round a part inside another that goes the same way, starting where it did", () => {
        expect(oriented(`${OUTER} ${MIDDLE}`)).to.deep.equal([
            ...parseSvgPath(OUTER),
            { type: "move", to: { x: 25, y: 25 } },
            { type: "line", to: { x: 25, y: 75 } },
            { type: "line", to: { x: 75, y: 75 } },
            { type: "line", to: { x: 75, y: 25 } },
            { type: "close" },
        ]);
    });

    it("should leave parts that already go the other way, and parts that aren't inside another", () => {
        expect(oriented(`${OUTER} ${MIDDLE_ANTICLOCKWISE}`)).to.deep.equal(parseSvgPath(`${OUTER} ${MIDDLE_ANTICLOCKWISE}`));
        // Two squares side by side
        const apart = "M 0 0 H 10 V 10 H 0 Z M 20 0 H 30 V 10 H 20 Z";
        expect(oriented(apart)).to.deep.equal(parseSvgPath(apart));
    });

    it("should fill a part inside a hole again, going the same way as the outline", () => {
        const segments = oriented(`${OUTER} ${MIDDLE} ${INNER}`);
        // The middle square is turned round, and the inner square goes the other way to it, as it was drawn
        expect(segments.slice(5, 10)).to.deep.equal(oriented(`${OUTER} ${MIDDLE}`).slice(5));
        expect(segments.slice(10)).to.deep.equal(parseSvgPath(INNER));
    });

    it("should find the part a part is directly inside, whatever order the parts are in", () => {
        const segments = oriented(`${MIDDLE} ${OUTER} ${INNER}`);
        expect(segments.slice(0, 5)).to.deep.equal(oriented(`${OUTER} ${MIDDLE}`).slice(5));
        expect(segments.slice(5)).to.deep.equal(parseSvgPath(`${OUTER} ${INNER}`));
    });

    it("should close a part that doesn't end where it starts with a line from its end", () => {
        // The triangle's last side is drawn by the close
        expect(oriented(`${OUTER} M 25 25 L 75 25 L 50 75 Z`).slice(5)).to.deep.equal([
            { type: "move", to: { x: 25, y: 25 } },
            { type: "line", to: { x: 50, y: 75 } },
            { type: "line", to: { x: 75, y: 25 } },
            { type: "close" },
        ]);
        // The triangle's last side is drawn, and the close has nothing left to draw
        expect(oriented(`${OUTER} M 25 25 L 75 25 L 50 75 L 25 25 Z`).slice(5)).to.deep.equal([
            { type: "move", to: { x: 25, y: 25 } },
            { type: "line", to: { x: 50, y: 75 } },
            { type: "line", to: { x: 75, y: 25 } },
            { type: "close" },
        ]);
    });

    it("should draw curves backwards", () => {
        expect(oriented(`${OUTER} M 30 30 C 50 20 70 20 70 30 Q 80 50 70 70 L 30 70 Z`).slice(5)).to.deep.equal([
            { type: "move", to: { x: 30, y: 30 } },
            { type: "line", to: { x: 30, y: 70 } },
            { type: "line", to: { x: 70, y: 70 } },
            { type: "quadratic", control: { x: 80, y: 50 }, to: { x: 70, y: 30 } },
            { type: "cubic", control1: { x: 70, y: 20 }, control2: { x: 50, y: 20 }, to: { x: 30, y: 30 } },
            { type: "close" },
        ]);
    });

    it("should draw arcs backwards, along the same ellipse", () => {
        // A circle, clockwise, in two halves
        const segments = oriented(`${OUTER} M 30 50 A 20 20 0 0 1 70 50 A 20 20 0 0 1 30 50 Z`).slice(5);
        expect(segments.map(({ type }) => type)).to.deep.equal(["move", "arc", "arc", "close"]);
        const arcs = segments.flatMap((segment) => (segment.type === "arc" ? [segment] : []));
        expect(arcs.map(({ from, to }) => [from, to])).to.deep.equal([
            [
                { x: 30, y: 50 },
                { x: 70, y: 50 },
            ],
            [
                { x: 70, y: 50 },
                { x: 30, y: 50 },
            ],
        ]);
        for (const { from, to, arc } of arcs) {
            expect(arc.sweepAngle).to.be.closeTo(-Math.PI, 1e-9);
            expect(pointOnArc(arc, arc.startAngle).x).to.be.closeTo(from.x, 1e-9);
            expect(pointOnArc(arc, arc.startAngle + arc.sweepAngle).x).to.be.closeTo(to.x, 1e-9);
        }
    });

    it("should leave a part that isn't closed, and turn a closed part inside it the other way to it", () => {
        const open = `${OUTER} M 25 25 H 75 V 75 H 25`;
        expect(oriented(open)).to.deep.equal(parseSvgPath(open));
        // A part that goes on after it is closed can't be turned round either
        const continued = `${OUTER} ${MIDDLE} L 50 50`;
        expect(oriented(continued)).to.deep.equal(parseSvgPath(continued));

        expect(oriented(`M 0 0 H 100 V 100 H 0 ${MIDDLE}`).slice(4)).to.deep.equal(oriented(`${OUTER} ${MIDDLE}`).slice(5));
    });

    it("should leave parts that enclose nothing, and not count them as holding other parts", () => {
        const path = `${OUTER} M 25 50 H 75 M 20 0 L 20 100`;
        expect(oriented(path)).to.deep.equal(parseSvgPath(path));
    });
});
