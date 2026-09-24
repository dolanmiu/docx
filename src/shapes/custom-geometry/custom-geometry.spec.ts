import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { type CustomPathSegment, createCustomGeometry, createCustomGeometryPath } from "./custom-geometry";

type Point = { readonly x: number; readonly y: number };

/**
 * Follows a path as Word draws it, and returns where each segment ends. An arc starts where the pen is, at the
 * point on its ellipse in the direction of its start angle, and ends in the direction of its start plus swing angle.
 */
const penPositions = (segments: readonly CustomPathSegment[]): readonly Point[] => {
    let pen: Point = { x: 0, y: 0 };
    return segments.flatMap((segment) => {
        switch (segment.type) {
            case "move":
            case "line":
                pen = segment.to;
                return [pen];
            case "cubic":
                pen = segment.points[2];
                return [pen];
            case "quadratic":
                pen = segment.points[1];
                return [pen];
            case "arc": {
                const { widthRadius: a, heightRadius: b } = segment;
                const onEllipse = (units: number): Point => {
                    // The point on the ellipse in the direction of the angle
                    const angle = (units / 60000) * (Math.PI / 180);
                    const t = Math.atan2(a * Math.sin(angle), b * Math.cos(angle));
                    return { x: a * Math.cos(t), y: b * Math.sin(t) };
                };
                const start = onEllipse(segment.startAngle);
                const end = onEllipse(segment.startAngle + segment.swingAngle);
                pen = { x: pen.x - start.x + end.x, y: pen.y - start.y + end.y };
                return [pen];
            }
            default:
                return [];
        }
    });
};

describe("createCustomGeometryPath", () => {
    it("should stretch the box around the path to fill the shape", () => {
        const geometry = createCustomGeometryPath("M 10 10 L 110 10 L 60 60 Z", 1000, 500);
        expect(geometry).to.deep.include({ width: 1000, height: 500 });
        expect(geometry.segments).to.deep.equal([
            { type: "move", to: { x: 0, y: 0 } },
            { type: "line", to: { x: 1000, y: 0 } },
            { type: "line", to: { x: 500, y: 500 } },
            { type: "close" },
        ]);
    });

    it("should scale curves and round to whole EMUs", () => {
        // The box around the path is 6 by 4, stretched to 700 by 1000 EMUs
        const geometry = createCustomGeometryPath("M 0 0 L 6 0 L 6 4 C 4 4 2 4 0 4 Q 0 2 0 0", 700, 1000);
        expect(geometry.segments.slice(3)).to.deep.equal([
            {
                type: "cubic",
                points: [
                    { x: 467, y: 1000 },
                    { x: 233, y: 1000 },
                    { x: 0, y: 1000 },
                ],
            },
            {
                type: "quadratic",
                points: [
                    { x: 0, y: 500 },
                    { x: 0, y: 0 },
                ],
            },
        ]);
    });

    it("should draw a path with no width or height along the edge of the shape", () => {
        const geometry = createCustomGeometryPath("M 5 0 L 5 10", 100, 100);
        expect(geometry.segments).to.deep.equal([
            { type: "move", to: { x: 0, y: 0 } },
            { type: "line", to: { x: 0, y: 100 } },
        ]);

        const flat = createCustomGeometryPath("M 0 5 L 10 5", 100, 0);
        expect(flat.segments).to.deep.equal([
            { type: "move", to: { x: 0, y: 0 } },
            { type: "line", to: { x: 100, y: 0 } },
        ]);
        expect(flat.sites.map(({ angle }) => angle)).to.deep.equal([180, 0]);
    });

    describe("arcs", () => {
        it("should write an upright arc as an arcTo, with angles in 60,000ths of a degree", () => {
            // A half circle over the top, clockwise from the left
            const geometry = createCustomGeometryPath("M 0 50 A 50 50 0 0 1 100 50", 1000, 500);
            expect(geometry.segments[1]).to.deep.equal({
                type: "arc",
                widthRadius: 500,
                heightRadius: 500,
                startAngle: 180 * 60000,
                swingAngle: 180 * 60000,
            });
        });

        it("should end an arc where the path's arc ends, when the shape stretches it", () => {
            const geometry = createCustomGeometryPath("M 0 0 A 100 50 0 0 0 100 50 L 100 100", 3000, 1000);
            const pen = penPositions(geometry.segments);
            expect(pen[1].x).to.be.closeTo(3000, 1);
            expect(pen[1].y).to.be.closeTo(500, 1);
            expect(geometry.segments[1]).to.deep.include({ type: "arc", widthRadius: 3000, heightRadius: 500 });
        });

        it("should turn anticlockwise, and the long way round, as the path's arc does", () => {
            const anticlockwise = createCustomGeometryPath("M 100 50 A 50 50 0 0 0 50 0", 100, 100);
            expect(anticlockwise.segments[1]).to.deep.include({ startAngle: 0, swingAngle: -90 * 60000 });

            const long = createCustomGeometryPath("M 100 50 A 50 50 0 1 1 50 0", 100, 100);
            expect(long.segments[1]).to.deep.include({ startAngle: 0, swingAngle: 270 * 60000 });

            const longAnticlockwise = createCustomGeometryPath("M 50 0 A 50 50 0 1 0 100 50", 100, 100);
            expect(longAnticlockwise.segments[1]).to.deep.include({ startAngle: 270 * 60000, swingAngle: -270 * 60000 });
        });

        it("should swap the radii of an ellipse turned a quarter turn", () => {
            // The ellipse's long axis, 200 long, is turned to point down the page. The arc bulges 50 to the right
            const geometry = createCustomGeometryPath("M 0 0 A 100 50 90 0 1 0 200", 50, 200);
            expect(geometry.segments[1]).to.deep.include({ type: "arc", widthRadius: 50, heightRadius: 100 });
            const pen = penPositions(geometry.segments);
            expect(pen[1].x).to.be.closeTo(0, 1);
            expect(pen[1].y).to.be.closeTo(200, 1);
        });

        it("should write a circle's arc as an arcTo however it is turned", () => {
            const geometry = createCustomGeometryPath("M 0 50 A 50 50 30 0 1 100 50", 100, 50);
            expect(geometry.segments[1]).to.deep.include({ type: "arc", widthRadius: 50, heightRadius: 50 });
        });

        it("should draw an arc of a tilted ellipse with Bézier curves, a quarter turn or less each", () => {
            const geometry = createCustomGeometryPath("M 0 0 A 100 50 30 1 1 100 100", 1000, 1000);
            const curves = geometry.segments.slice(1);
            expect(curves.every((segment) => segment.type === "cubic")).to.equal(true);
            expect(curves.length).to.be.within(3, 4);
            // The last curve ends at the end of the arc, stretched into the shape
            const last = curves[curves.length - 1];
            const end = last.type === "cubic" ? last.points[2] : undefined;
            const lastPoint = penPositions(geometry.segments).slice(-1)[0];
            expect(end).to.deep.equal(lastPoint);
        });

        it("should draw an arc as a line when the shape has no width or height", () => {
            // The arc goes 10 above its ends, so its ends are half way down the path's box
            const geometry = createCustomGeometryPath("M 0 0 A 10 10 0 0 1 20 0 L 20 10", 0, 100);
            expect(geometry.segments[1]).to.deep.equal({ type: "line", to: { x: 0, y: 50 } });
        });
    });

    describe("connection sites", () => {
        it("should put a site at each corner, leaving away from the middle of the shape", () => {
            // The bottom corners are as far down as across, so connectors leave them downwards
            const geometry = createCustomGeometryPath("M 50 0 L 100 100 L 0 100 Z", 1000, 1000);
            expect(geometry.sites).to.deep.equal([
                { x: 500, y: 0, angle: 270 },
                { x: 1000, y: 1000, angle: 90 },
                { x: 0, y: 1000, angle: 90 },
            ]);
        });

        it("should measure how far out a corner is as a share of the shape's width and height", () => {
            // Near the right end of the top of a wide shape, the corner is further up than across
            const geometry = createCustomGeometryPath("M 0 0 L 90 0 L 100 5 L 90 10 L 0 10 Z", 1000, 100);
            expect(geometry.sites.map(({ angle }) => angle)).to.deep.equal([270, 270, 0, 90, 90]);
            expect(createCustomGeometryPath("M 0 0 L 100 50 L 0 100", 1000, 1000).sites.map(({ angle }) => angle)).to.deep.equal([
                270, 0, 90,
            ]);
        });

        it("should put a site at the ends of curves and arcs, once for each point", () => {
            // The arc reaches 50 above its ends and the curve 25 below them, so the ends are two thirds of the way down
            const geometry = createCustomGeometryPath("M 0 50 A 50 50 0 0 1 100 50 Q 50 100 0 50 Z", 100, 100);
            expect(geometry.sites.map(({ x, y }) => [x, y])).to.deep.equal([
                [0, 67],
                [100, 67],
            ]);
        });

        it("should leave a site in the middle of a shape to the right", () => {
            const geometry = createCustomGeometryPath("M 0 0 L 10 10 L 5 5", 10, 10);
            expect(geometry.sites[2]).to.deep.equal({ x: 5, y: 5, angle: 0 });
            expect(createCustomGeometryPath("M 0 0 L 0 10", 0, 10).sites.map(({ angle }) => angle)).to.deep.equal([270, 90]);
        });
    });
});

describe("createCustomGeometry", () => {
    it("should write the path, connection sites and text box in schema order", () => {
        const tree = new Formatter().format(createCustomGeometry(createCustomGeometryPath("M 0 0 L 10 0 L 5 10 Z", 1000, 1000)));
        expect(tree).to.deep.equal({
            "a:custGeom": [
                { "a:avLst": {} },
                { "a:gdLst": {} },
                { "a:ahLst": {} },
                {
                    "a:cxnLst": [
                        { "a:cxn": [{ _attr: { ang: 16200000 } }, { "a:pos": { _attr: { x: 0, y: 0 } } }] },
                        { "a:cxn": [{ _attr: { ang: 16200000 } }, { "a:pos": { _attr: { x: 1000, y: 0 } } }] },
                        { "a:cxn": [{ _attr: { ang: 5400000 } }, { "a:pos": { _attr: { x: 500, y: 1000 } } }] },
                    ],
                },
                { "a:rect": { _attr: { l: "l", t: "t", r: "r", b: "b" } } },
                {
                    "a:pathLst": [
                        {
                            "a:path": [
                                { _attr: { w: 1000, h: 1000 } },
                                { "a:moveTo": [{ "a:pt": { _attr: { x: 0, y: 0 } } }] },
                                { "a:lnTo": [{ "a:pt": { _attr: { x: 1000, y: 0 } } }] },
                                { "a:lnTo": [{ "a:pt": { _attr: { x: 500, y: 1000 } } }] },
                                { "a:close": {} },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("should write curves and arcs", () => {
        // The box around the path is 100 by 75, the same size as the shape
        const tree = new Formatter().format(
            createCustomGeometry(createCustomGeometryPath("M 0 50 A 50 50 0 0 1 100 50 Q 50 100 0 50 C 0 0 0 0 0 50", 100, 75)),
        );
        const path = tree["a:custGeom"][5]["a:pathLst"][0]["a:path"];
        expect(path.slice(2)).to.deep.equal([
            { "a:arcTo": { _attr: { wR: 50, hR: 50, stAng: 10800000, swAng: 10800000 } } },
            { "a:quadBezTo": [{ "a:pt": { _attr: { x: 50, y: 100 } } }, { "a:pt": { _attr: { x: 0, y: 50 } } }] },
            {
                "a:cubicBezTo": [
                    { "a:pt": { _attr: { x: 0, y: 0 } } },
                    { "a:pt": { _attr: { x: 0, y: 0 } } },
                    { "a:pt": { _attr: { x: 0, y: 50 } } },
                ],
            },
        ]);
    });
});
