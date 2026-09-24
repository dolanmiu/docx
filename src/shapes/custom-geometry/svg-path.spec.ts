import { describe, expect, it } from "vitest";

import { type PathSegment, getPathBounds, parseSvgPath, pointOnArc } from "./svg-path";

const ends = (segments: readonly PathSegment[]): readonly unknown[] =>
    segments.map((segment) => (segment.type === "close" ? "close" : [segment.type, segment.to.x, segment.to.y]));

describe("parseSvgPath", () => {
    it("should read moves, lines and closes", () => {
        expect(parseSvgPath("M 0 0 L 100 0 L 50 80 Z")).to.deep.equal([
            { type: "move", to: { x: 0, y: 0 } },
            { type: "line", to: { x: 100, y: 0 } },
            { type: "line", to: { x: 50, y: 80 } },
            { type: "close" },
        ]);
    });

    it("should read numbers without separators, with commas, signs, decimals and exponents", () => {
        expect(ends(parseSvgPath("M10,20L-5.5-1e1l.5.5"))).to.deep.equal([
            ["move", 10, 20],
            ["line", -5.5, -10],
            ["line", -5, -9.5],
        ]);
    });

    it("should read relative commands from the current point", () => {
        expect(ends(parseSvgPath("m 10 10 l 5 0 h 5 v 5 H 0 V 0"))).to.deep.equal([
            ["move", 10, 10],
            ["line", 15, 10],
            ["line", 20, 10],
            ["line", 20, 15],
            ["line", 0, 15],
            ["line", 0, 0],
        ]);
    });

    it("should treat numbers after a move as lines", () => {
        expect(ends(parseSvgPath("M 0 0 10 0 10 10 m 5 5 1 1"))).to.deep.equal([
            ["move", 0, 0],
            ["line", 10, 0],
            ["line", 10, 10],
            ["move", 15, 15],
            ["line", 16, 16],
        ]);
    });

    it("should go back to the start of the path after a close", () => {
        expect(ends(parseSvgPath("M 10 10 L 20 10 Z l 0 5"))).to.deep.equal([
            ["move", 10, 10],
            ["line", 20, 10],
            "close",
            ["line", 10, 15],
        ]);
    });

    it("should read cubic curves, and reflect the last control point for smooth ones", () => {
        expect(parseSvgPath("M 0 0 C 0 10 10 10 10 0 S 20 -10 20 0 s 10 10 10 0")).to.deep.equal([
            { type: "move", to: { x: 0, y: 0 } },
            { type: "cubic", control1: { x: 0, y: 10 }, control2: { x: 10, y: 10 }, to: { x: 10, y: 0 } },
            { type: "cubic", control1: { x: 10, y: -10 }, control2: { x: 20, y: -10 }, to: { x: 20, y: 0 } },
            { type: "cubic", control1: { x: 20, y: 10 }, control2: { x: 30, y: 10 }, to: { x: 30, y: 0 } },
        ]);
    });

    it("should start a smooth cubic curve at the current point when it doesn't follow a cubic curve", () => {
        expect(parseSvgPath("M 0 0 S 10 10 20 0")[1]).to.deep.equal({
            type: "cubic",
            control1: { x: 0, y: 0 },
            control2: { x: 10, y: 10 },
            to: { x: 20, y: 0 },
        });
    });

    it("should read quadratic curves, and reflect the last control point for smooth ones", () => {
        expect(parseSvgPath("M 0 0 Q 5 10 10 0 T 20 0 t 10 0 T 40 0")).to.deep.equal([
            { type: "move", to: { x: 0, y: 0 } },
            { type: "quadratic", control: { x: 5, y: 10 }, to: { x: 10, y: 0 } },
            { type: "quadratic", control: { x: 15, y: -10 }, to: { x: 20, y: 0 } },
            { type: "quadratic", control: { x: 25, y: 10 }, to: { x: 30, y: 0 } },
            { type: "quadratic", control: { x: 35, y: -10 }, to: { x: 40, y: 0 } },
        ]);
        expect(parseSvgPath("M 0 0 L 5 5 T 10 0")[2]).to.deep.equal({ type: "quadratic", control: { x: 5, y: 5 }, to: { x: 10, y: 0 } });
        expect(parseSvgPath("M 0 0 q 5 10 10 0")[1]).to.deep.equal({ type: "quadratic", control: { x: 5, y: 10 }, to: { x: 10, y: 0 } });
    });

    it("should read an arc into centre form", () => {
        // A half circle clockwise from (0, 50) over the top to (100, 50)
        const [, segment] = parseSvgPath("M 0 50 A 50 50 0 0 1 100 50");
        expect(segment.type).to.equal("arc");
        if (segment.type !== "arc") {
            return;
        }
        expect(segment.from).to.deep.equal({ x: 0, y: 50 });
        expect(segment.to).to.deep.equal({ x: 100, y: 50 });
        expect(segment.arc.centre.x).to.be.closeTo(50, 1e-9);
        expect(segment.arc.centre.y).to.be.closeTo(50, 1e-9);
        expect(segment.arc.radiusX).to.equal(50);
        expect(segment.arc.startAngle).to.be.closeTo(Math.PI, 1e-9);
        expect(segment.arc.sweepAngle).to.be.closeTo(Math.PI, 1e-9);
        expect(pointOnArc(segment.arc, Math.PI * 1.5).y).to.be.closeTo(0, 1e-9);
    });

    it("should pick the arc's centre and direction from its flags", () => {
        const arc = (flags: string): PathSegment => parseSvgPath(`M 0 0 A 10 10 0 ${flags} 10 10`)[1];
        const small = arc("0 0");
        const large = arc("1 0");
        const clockwise = arc("0 1");
        if (small.type !== "arc" || large.type !== "arc" || clockwise.type !== "arc") {
            throw new Error("Expected arcs");
        }
        expect(Math.abs(small.arc.sweepAngle)).to.be.closeTo(Math.PI / 2, 1e-9);
        expect(small.arc.sweepAngle).to.be.lessThan(0);
        expect(Math.abs(large.arc.sweepAngle)).to.be.closeTo((3 * Math.PI) / 2, 1e-9);
        expect(large.arc.sweepAngle).to.be.lessThan(0);
        expect(clockwise.arc.sweepAngle).to.be.closeTo(Math.PI / 2, 1e-9);
        expect(small.arc.centre).to.not.deep.equal(large.arc.centre);
    });

    it("should read arc flags written without separators", () => {
        const [, segment] = parseSvgPath("M0 0a10 10 0 0110 10");
        expect(segment).to.deep.include({ type: "arc", to: { x: 10, y: 10 } });
    });

    it("should scale up radii too small to reach the end", () => {
        const [, segment] = parseSvgPath("M 0 0 A 1 1 0 0 1 100 0");
        expect(segment.type === "arc" && segment.arc.radiusX).to.be.closeTo(50, 1e-9);
    });

    it("should draw an arc with a radius of 0 as a line, and leave out an arc that ends where it starts", () => {
        expect(parseSvgPath("M 0 0 A 0 10 0 0 1 10 10")[1]).to.deep.equal({ type: "line", to: { x: 10, y: 10 } });
        expect(parseSvgPath("M 0 0 A 10 10 0 0 1 0 0")[1]).to.deep.equal({ type: "line", to: { x: 0, y: 0 } });
    });

    it("should reject paths that don't start with a move, have unknown commands or are missing numbers", () => {
        expect(() => parseSvgPath("")).to.throw("Invalid path. Expected at least a move (M)");
        expect(() => parseSvgPath("L 0 0")).to.throw("A path must start with a move (M)");
        expect(() => parseSvgPath("10 10")).to.throw("A path must start with a move (M)");
        expect(() => parseSvgPath("M 0 0 X 10 10")).to.throw('Unsupported command "X"');
        expect(() => parseSvgPath("M 0 0 L 10")).to.throw("Expected a number at position 10");
        expect(() => parseSvgPath("M 0 0 Z 10 10")).to.throw("Expected a command at position 8");
        expect(() => parseSvgPath("M 0 0 A 10 10 0 2 1 10 10")).to.throw("Expected an arc flag of 0 or 1");
    });
});

describe("getPathBounds", () => {
    it("should reach the corners of a polygon", () => {
        expect(getPathBounds(parseSvgPath("M 10 20 L 110 20 L 60 100 Z"))).to.deep.equal({ left: 10, top: 20, right: 110, bottom: 100 });
    });

    it("should reach the furthest points of curves, not their control points", () => {
        // The curve's control points are 100 below, but it only reaches 75 below
        const bounds = getPathBounds(parseSvgPath("M 0 0 C 0 100 100 100 100 0"));
        expect(bounds.bottom).to.be.closeTo(75, 1e-9);
        expect(bounds.right).to.equal(100);

        const quadratic = getPathBounds(parseSvgPath("M 0 0 Q 50 100 100 0"));
        expect(quadratic.bottom).to.be.closeTo(50, 1e-9);
    });

    it("should find where a curve turns back on either axis", () => {
        // Bulges out to the left of its ends
        const bounds = getPathBounds(parseSvgPath("M 0 0 C -60 30 -60 70 0 100"));
        expect(bounds.left).to.be.closeTo(-45, 1e-9);
    });

    it("should reach the top of an arc that goes over the top of its ellipse", () => {
        const bounds = getPathBounds(parseSvgPath("M 0 50 A 50 50 0 0 1 100 50"));
        expect(bounds.top).to.be.closeTo(0, 1e-9);
        expect(bounds.bottom).to.be.closeTo(50, 1e-9);
    });

    it("should reach the extremes of a rotated ellipse's arc", () => {
        // A full ellipse drawn as two arcs between the ends of its long axis, turned 45 degrees
        const end = 100 * Math.SQRT1_2;
        const bounds = getPathBounds(parseSvgPath(`M ${-end} ${-end} A 100 50 45 0 1 ${end} ${end} A 100 50 45 0 1 ${-end} ${-end}`));
        const half = Math.sqrt((100 * 100 + 50 * 50) / 2);
        expect(bounds.right).to.be.closeTo(half, 0.01);
        expect(bounds.bottom).to.be.closeTo(half, 0.01);
        expect(bounds.left).to.be.closeTo(-half, 0.01);
    });

    it("should leave out the parts of the ellipse the arc doesn't go round", () => {
        // A quarter circle from the right of the circle to its bottom, clockwise
        const bounds = getPathBounds(parseSvgPath("M 100 0 A 100 100 0 0 1 0 100"));
        expect(bounds).to.deep.equal({ left: 0, top: 0, right: 100, bottom: 100 });

        // The same ends, anticlockwise the long way round
        const long = getPathBounds(parseSvgPath("M 100 0 A 100 100 0 1 0 0 100"));
        expect(long.left).to.be.closeTo(-100, 1e-9);
        expect(long.top).to.be.closeTo(-100, 1e-9);
    });

    it("should handle a curve that never turns back", () => {
        // Along the x axis the curve's slope never reaches 0
        expect(getPathBounds(parseSvgPath("M 0 0 C 10 0 5 10 30 10"))).to.deep.equal({ left: 0, top: 0, right: 30, bottom: 10 });
    });

    it("should handle a straight curve without turning points", () => {
        expect(getPathBounds(parseSvgPath("M 0 0 C 10 10 20 20 30 30"))).to.deep.equal({ left: 0, top: 0, right: 30, bottom: 30 });
        expect(getPathBounds(parseSvgPath("M 0 0 Q 0 0 30 30"))).to.deep.equal({ left: 0, top: 0, right: 30, bottom: 30 });
    });

    it("should go back to the start of a subpath after a close", () => {
        expect(getPathBounds(parseSvgPath("M 10 10 L 20 10 Z L 10 20"))).to.deep.equal({ left: 10, top: 10, right: 20, bottom: 20 });
    });
});
