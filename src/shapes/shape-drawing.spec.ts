// cspell:ignore DEEBF
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as convenienceFunctions from "@util/convenience-functions";
import { Paragraph } from "docx";

import type { ShapeDrawingChildMediaData } from "./drawing/shape-drawing-child";
import type { PresetShapeCoreOptions } from "./preset-shape";
import type { ConnectorEnd } from "./shape-connector";
import {
    type IShapeGroupChildOptions,
    type ShapeDrawingLayout,
    createShapeDrawingNodes,
    drawingStyledParagraphs,
    layoutShapeDrawing,
} from "./shape-drawing";
import { measureTextWidth } from "./text-metrics";

const EMUS_PER_PIXEL = 9525;

const box = (id: string, left: number, top: number, extra: Partial<IShapeGroupChildOptions> = {}): IShapeGroupChildOptions =>
    ({ id, type: "rectangle", transformation: { offset: { left, top }, width: 100, height: 50 }, ...extra }) as IShapeGroupChildOptions;

const connect = (from: ConnectorEnd, to: ConnectorEnd, extra: Partial<IShapeGroupChildOptions> = {}): IShapeGroupChildOptions =>
    ({ type: "connector", from, to, ...extra }) as IShapeGroupChildOptions;

const dataOf = (child: ShapeDrawingChildMediaData): PresetShapeCoreOptions => {
    if (child.type !== "wps") {
        throw new Error(`Expected a shape, got a ${child.type}`);
    }
    return child.data as PresetShapeCoreOptions;
};

/** The connection site indexes a connector is attached to */
const sitesOf = (child: ShapeDrawingChildMediaData): readonly (number | undefined)[] => {
    const { connections } = dataOf(child);
    return [connections?.start?.index, connections?.end?.index];
};

/** Where a connector starts and ends, in whole pixels */
const endsOf = (child: ShapeDrawingChildMediaData): readonly (readonly [number, number])[] => {
    const { offset, emus, rotation = 0, flip } = child.transformation;
    const centre = { x: (offset?.emus?.x ?? 0) + emus.x / 2, y: (offset?.emus?.y ?? 0) + emus.y / 2 };
    const radians = (rotation / 60000) * (Math.PI / 180);
    const place = (x: number, y: number): readonly [number, number] => {
        const dx = (flip?.horizontal ? -1 : 1) * (x - emus.x / 2);
        const dy = (flip?.vertical ? -1 : 1) * (y - emus.y / 2);
        return [
            Math.round((centre.x + dx * Math.cos(radians) - dy * Math.sin(radians)) / EMUS_PER_PIXEL),
            Math.round((centre.y + dx * Math.sin(radians) + dy * Math.cos(radians)) / EMUS_PER_PIXEL),
        ];
    };
    return [place(0, 0), place(emus.x, emus.y)];
};

/** Where a child's box is, in whole pixels */
const offsetOf = (child: ShapeDrawingChildMediaData): readonly [number, number] => [
    Math.round((child.transformation.offset?.emus?.x ?? 0) / EMUS_PER_PIXEL),
    Math.round((child.transformation.offset?.emus?.y ?? 0) / EMUS_PER_PIXEL),
];

const shape = (id: string, extra: Partial<IShapeGroupChildOptions> = {}): IShapeGroupChildOptions =>
    ({ id, type: "rectangle", transformation: { width: 100, height: 50 }, ...extra }) as IShapeGroupChildOptions;

const arrow = { endArrow: "triangle" } as const;

describe("layoutShapeDrawing", () => {
    beforeEach(() => {
        let id = 0;
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockImplementation(() => ++id);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should give every shape and connector a drawing id, in order", () => {
        const { children } = layoutShapeDrawing([
            box("a", 0, 0),
            connect("a", "b", { altText: { name: "Arrow", description: "d", title: "t" } }),
            box("b", 200, 0),
        ]);

        expect(children.map((child) => dataOf(child).nonVisualDrawingProperties)).to.deep.equal([
            { id: 1, name: "Rectangle 1", description: undefined, title: undefined, link: undefined, decorative: undefined },
            { id: 2, name: "Arrow", description: "d", title: "t", link: undefined, decorative: undefined },
            { id: 3, name: "Rectangle 3", description: undefined, title: undefined, link: undefined, decorative: undefined },
        ]);
        expect(dataOf(children[1]).connections).to.deep.equal({ start: { id: 1, index: 3 }, end: { id: 3, index: 1 } });
    });

    it("should connect the sides that face each other", () => {
        const { children } = layoutShapeDrawing([
            box("a", 0, 0),
            box("right", 300, 20),
            box("below", 20, 200),
            connect("a", "right"),
            connect("right", "a"),
            connect("a", "below"),
            connect("below", "a"),
        ]);

        // A rectangle's sites are numbered top, left, bottom, right
        expect(children.slice(3).map(sitesOf)).to.deep.equal([
            [3, 1],
            [1, 3],
            [2, 0],
            [0, 2],
        ]);
    });

    it("should connect the sides it is given", () => {
        const { children } = layoutShapeDrawing([
            box("a", 0, 0),
            box("b", 300, 200),
            connect({ id: "a", side: "bottom" }, { id: "b", side: "top" }, { route: "elbow" }),
        ]);

        expect(sitesOf(children[2])).to.deep.equal([2, 0]);
        expect(dataOf(children[2]).geometry.type).to.equal("elbowConnector");
    });

    it("should draw a straight connector between the connection sites by default", () => {
        const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 200, 100), connect("a", "b")]);

        expect(dataOf(children[2]).geometry).to.deep.equal({ type: "straightConnector", adjustments: {} });
        expect(children[2].transformation).to.deep.equal({
            offset: { pixels: { x: 100, y: 25 }, emus: { x: 100 * EMUS_PER_PIXEL, y: 25 * EMUS_PER_PIXEL } },
            pixels: { x: 100, y: 100 },
            emus: { x: 100 * EMUS_PER_PIXEL, y: 100 * EMUS_PER_PIXEL },
            flip: { horizontal: undefined, vertical: undefined },
            rotation: undefined,
        });
    });

    it("should write the rotation and flips of an elbow connector", () => {
        const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 150, 200), connect("a", "b", { route: "elbow" })]);

        expect(children[2].transformation.rotation).to.equal(5400000);
        expect(children[2].transformation.flip).to.deep.equal({ horizontal: undefined, vertical: true });
    });

    it("should connect to the rotated or flipped side of a shape", () => {
        const { children } = layoutShapeDrawing([
            box("a", 0, 0),
            // Rotated a quarter turn, the rectangle's top faces right
            box("turned", 0, 200, { transformation: { offset: { top: 200 }, width: 100, height: 50, rotation: 90 } }),
            // Flipped vertically, the triangle's point faces down
            {
                id: "upside-down",
                type: "triangle",
                transformation: { offset: { left: 300 }, width: 80, height: 80, flip: { vertical: true } },
            },
            // Flipped horizontally, the triangle's left side faces right
            {
                id: "mirrored",
                type: "triangle",
                transformation: { offset: { left: 500 }, width: 80, height: 80, flip: { horizontal: true } },
            },
            connect({ id: "turned", side: "right" }, "a"),
            connect({ id: "upside-down", side: "bottom" }, "a"),
            connect({ id: "mirrored", side: "right" }, "a"),
        ]);

        expect(children.slice(4).map((child) => sitesOf(child)[0])).to.deep.equal([0, 0, 1]);
    });

    it("should pick the outermost site, then the one nearest the middle of the side", () => {
        const { children } = layoutShapeDrawing([
            box("a", 0, 200),
            // An ellipse has three sites facing down; the middle one is lowest
            { id: "ellipse", type: "ellipse", transformation: { width: 100, height: 60 } },
            // A triangle has three sites along its base
            { id: "triangle", type: "triangle", transformation: { offset: { left: 200 }, width: 100, height: 60 } },
            connect({ id: "ellipse", side: "bottom" }, "a"),
            connect({ id: "triangle", side: "bottom" }, "a"),
        ]);

        expect(children.slice(3).map((child) => sitesOf(child)[0])).to.deep.equal([4, 3]);
    });

    it("should move sites with the shape's adjustments", () => {
        const plain = layoutShapeDrawing([
            { id: "c", type: "chevron", transformation: { width: 100, height: 50 } },
            box("a", -200, 0),
            connect("c", "a"),
        ]);
        const pointed = layoutShapeDrawing([
            { id: "c", type: "chevron", adjustments: { pointLength: 80 }, transformation: { width: 100, height: 50 } },
            box("a", -200, 0),
            connect("c", "a"),
        ]);

        expect(plain.children[2].transformation.emus.x).to.not.equal(pointed.children[2].transformation.emus.x);
    });

    it("should connect to the middle of a side of a shape without connection sites, without attaching", () => {
        const { children } = layoutShapeDrawing([
            box("a", 0, 0),
            { id: "cross", type: "chartX", transformation: { offset: { left: 200 }, width: 50, height: 50 } },
            connect("a", "cross"),
            connect("cross", "a"),
        ]);

        expect(dataOf(children[2]).connections).to.deep.equal({ start: { id: 1, index: 3 }, end: undefined });
        expect(dataOf(children[3]).connections).to.deep.equal({ start: undefined, end: { id: 1, index: 3 } });
        expect(children[2].transformation.emus.x).to.equal(100 * EMUS_PER_PIXEL);
    });

    it("should include connectors in the box around the children, and lines in what is drawn", () => {
        const layout = layoutShapeDrawing([
            box("a", 0, 0, { line: { width: 2, endArrow: "triangle" } }),
            box("b", 200, 100),
            connect({ id: "a", side: "top" }, { id: "b", side: "top" }, { route: "elbow", line: { width: 3 } }),
        ]);

        // The connector loops a quarter of an inch above the top shape
        expect(layout.bounds).to.deep.equal({ left: 0, top: -228600, right: 300 * EMUS_PER_PIXEL, bottom: 150 * EMUS_PER_PIXEL });
        // The first shape's arrowheads, three times its 2pt line, reach furthest left. The connector's 3pt line reaches furthest up
        const arrowhead = (2 * 12700 * 3) / 2;
        expect(layout.reach).to.deep.equal({
            left: -arrowhead,
            top: -228600 - 19050,
            right: 300 * EMUS_PER_PIXEL + 6350,
            bottom: 150 * EMUS_PER_PIXEL + 6350,
        });
    });

    it("should move everything that is drawn onto the positive side when asked", () => {
        const layout = layoutShapeDrawing(
            [box("a", 0, 0), box("b", 0, 100), connect({ id: "a", side: "top" }, { id: "b", side: "top" }, { route: "elbow" })],
            { keepPositive: true },
        );

        // The connector goes round the left of the top shape and loops over the lower one, a quarter of an inch out
        expect(layout.reach.top).to.equal(0);
        expect(layout.reach.left).to.equal(0);
        expect(layout.children[0].transformation.offset?.emus).to.deep.equal({ x: 228600 + 6350, y: 228600 + 6350 });
    });

    it("should reach the corners of rotated shapes and the effects of shapes", () => {
        const layout = layoutShapeDrawing([
            box("a", 0, 0, { line: "none", transformation: { width: 100, height: 100, rotation: 45 } }),
            box("b", 200, 0, { line: "none", effects: { glow: { color: "FF0000", size: 10 } } }),
        ]);

        const corner = 50 * Math.SQRT2 * EMUS_PER_PIXEL;
        expect(layout.reach.left).to.be.closeTo(50 * EMUS_PER_PIXEL - corner, 1);
        expect(layout.reach.top).to.be.closeTo(50 * EMUS_PER_PIXEL - corner, 1);
        expect(layout.reach.right).to.equal(300 * EMUS_PER_PIXEL + 127000);
        expect(layout.reach.bottom).to.be.closeTo(50 * EMUS_PER_PIXEL + corner, 1);
    });

    it("should name shapes, pictures, groups and connectors after what they are and their id, as Word does", () => {
        const { children } = layoutShapeDrawing([
            { id: "a", type: "roundedRectangle", transformation: { width: 10, height: 10 } },
            { id: "b", type: "custom", path: "M 0 0 L 10 0 L 5 10 Z", transformation: { offset: { left: 100 }, width: 10, height: 10 } },
            {
                type: "picture",
                image: { type: "png", data: Buffer.from("") },
                transformation: { offset: { top: 100 }, width: 10, height: 10 },
            },
            { type: "group", children: [{ type: "star5", transformation: { width: 10, height: 10 } }] },
            connect("a", "b", { route: "elbow" }),
            connect("a", "b", { route: "curved", label: "Hi" }),
        ]);

        const names = children.map((child) =>
            child.type === "group"
                ? child.nonVisualDrawingProperties.name
                : (child.data as PresetShapeCoreOptions).nonVisualDrawingProperties?.name,
        );
        expect(names).to.deep.equal([
            "Rounded Rectangle 1",
            "Freeform 2",
            "Picture 3",
            "Group 4",
            "Elbow Connector 6",
            "Curved Connector 7",
            "Text Box 8",
        ]);
        expect(children[3].type === "group" && dataOf(children[3].children[0]).nonVisualDrawingProperties?.name).to.equal("Star5 5");
    });

    it("should write links and decorative settings on shapes", () => {
        const { children } = layoutShapeDrawing([box("a", 0, 0, { link: "https://example.com", decorative: true })]);
        expect(dataOf(children[0]).nonVisualDrawingProperties).to.include({ link: "https://example.com", decorative: true });
    });

    describe("points", () => {
        it("should attach to the connection site nearest a point on the shape", () => {
            const { children } = layoutShapeDrawing([
                // A triangle's sites are its top, left side, bottom left, bottom middle, bottom right and right side
                { id: "t", type: "triangle", transformation: { width: 100, height: 100 } },
                box("a", 300, 0),
                connect({ id: "t", point: { x: 100, y: 100 } }, "a"),
                connect({ id: "t", point: { x: 50, y: 0 } }, "a"),
            ]);
            expect(children.slice(2).map((child) => sitesOf(child)[0])).to.deep.equal([4, 0]);
        });

        it("should end exactly at the point on a shape without connection sites, without attaching", () => {
            const { children } = layoutShapeDrawing([
                { id: "x", type: "chartX", transformation: { width: 100, height: 100 } },
                box("a", 300, 0),
                connect({ id: "x", point: { x: 100, y: 25 } }, "a", { route: "elbow" }),
            ]);
            expect(sitesOf(children[2])[0]).to.equal(undefined);
            expect(children[2].transformation.offset?.emus?.y).to.equal(25 * EMUS_PER_PIXEL);
        });

        it("should reject points outside the shape, and a side with a point", () => {
            expect(() =>
                layoutShapeDrawing([box("a", 0, 0), box("b", 200, 0), connect({ id: "a", point: { x: 120, y: 0 } }, "b")]),
            ).to.throw("Invalid connector point { x: 120, y: 0 }");
            expect(() =>
                layoutShapeDrawing([box("a", 0, 0), box("b", 200, 0), connect({ id: "a", side: "top", point: { x: 0, y: 0 } }, "b")]),
            ).to.throw('Invalid connector end for "a". Give a side or a point, not both');
        });
    });

    it("should loop out by the connector's margin", () => {
        const layout = layoutShapeDrawing([
            box("a", 0, 0),
            box("b", 0, 100),
            connect({ id: "a", side: "top" }, { id: "b", side: "top" }, { route: "elbow", margin: 10 }),
        ]);
        expect(layout.bounds.top).to.equal(-10 * EMUS_PER_PIXEL);
    });

    it("should route an elbow connector around a shape in its way", () => {
        const through = layoutShapeDrawing([box("a", 0, 0), box("b", 400, 0), connect("a", "b", { route: "elbow" })]);
        expect(dataOf(through.children[2]).geometry.type).to.equal("elbowConnector");

        const around = layoutShapeDrawing([
            box("a", 0, 0),
            box("b", 400, 0),
            box("between", 200, -20, { transformation: { offset: { left: 200, top: -20 }, width: 50, height: 90 } }),
            connect("a", "b", { route: "elbow" }),
        ]);
        const connector = around.children[3];
        expect(dataOf(connector).geometry.type).to.equal("elbowConnectorFourBends");
        // It goes a quarter of an inch below the shape in the way, rather than just clearing it
        expect(around.bounds.bottom).to.equal(70 * EMUS_PER_PIXEL + 228600);
    });

    it("should go around the shape it starts from rather than through it", () => {
        const layout = layoutShapeDrawing([
            box("a", 0, 0),
            box("b", 0, 100),
            connect({ id: "a", side: "top" }, { id: "b", side: "top" }, { route: "elbow" }),
        ]);

        // Up from the top shape, round its left side a quarter of an inch away, and down onto the lower one
        expect(dataOf(layout.children[2]).geometry.type).to.equal("elbowConnectorFourBends");
        expect(layout.bounds.left).to.equal(-228600);
    });

    describe("labels", () => {
        it("should centre a text box on the middle of the route, sized to one line of text", () => {
            const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 300, 0), connect("a", "b", { label: "Yes" })]);

            const label = children[3];
            // The connector runs from x = 100 to 300 pixels at y = 25. "Yes" is 21 pixels wide in 10pt Times New Roman,
            // and 15 tall, and the box has 8 pixels more width and 4 more height
            expect(label.transformation).to.deep.include({
                offset: { pixels: { x: 186, y: 15 }, emus: { x: Math.round(185.5 * EMUS_PER_PIXEL), y: 15 * EMUS_PER_PIXEL } },
                emus: { x: 29 * EMUS_PER_PIXEL, y: 20 * EMUS_PER_PIXEL },
            });
            expect(dataOf(label)).to.deep.include({
                geometry: { type: "rectangle", adjustments: undefined },
                fill: "none",
                line: "none",
                textOptions: { margins: { top: 0, right: 0, bottom: 0, left: 0 }, wrap: false, verticalAlignment: "center" },
            });
            expect(dataOf(label).children).to.have.length(1);
        });

        it("should take the label's paragraphs, size, fill and line", () => {
            const paragraphs = [new Paragraph("No")];
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 300),
                connect("a", "b", { route: "elbow", label: { text: paragraphs, width: 40, height: 30, fill: "FFFFFF", line: "000000" } }),
            ]);

            const label = children[3];
            expect(label.transformation.emus).to.deep.equal({ x: 40 * EMUS_PER_PIXEL, y: 30 * EMUS_PER_PIXEL });
            expect(dataOf(label)).to.deep.include({ fill: "FFFFFF", line: "000000", children: paragraphs });
        });

        it("should fit paragraphs without a size, with a little space around them", () => {
            const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 300, 0), connect("a", "b", { label: { text: [] } })]);
            // No text: only the space around it
            expect(children[3].transformation.emus).to.deep.equal({ x: 8 * EMUS_PER_PIXEL, y: 4 * EMUS_PER_PIXEL });
        });

        it("should sit on the start of a connector with no length", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 100, 0),
                connect({ id: "a", side: "right" }, { id: "b", side: "left" }, { label: { text: "", width: 10, height: 10 } }),
            ]);
            expect(children[3].transformation.offset?.emus).to.deep.equal({ x: 95 * EMUS_PER_PIXEL, y: 20 * EMUS_PER_PIXEL });
        });
    });

    describe("pictures", () => {
        it("should place a picture that connectors attach to like a rectangle", () => {
            const image = { type: "png", data: Buffer.from("") } as const;
            const { children, reach } = layoutShapeDrawing([
                {
                    id: "logo",
                    type: "picture",
                    image,
                    transformation: { offset: { left: 10 }, width: 100, height: 50 },
                    crop: { left: 5 },
                    line: { width: 2 },
                    effects: { shadow: { angle: 0, distance: 10, blur: 0 } },
                    altText: { name: "Logo", description: "Our logo" },
                },
                box("a", 300, 0),
                connect("logo", "a"),
            ]);

            expect(children[0]).to.deep.include({ type: "picture" });
            expect(children[0].type === "picture" && children[0].data).to.deep.equal({
                image,
                crop: { left: 5 },
                line: { width: 2 },
                effects: { shadow: { angle: 0, distance: 10, blur: 0 } },
                nonVisualDrawingProperties: {
                    id: 1,
                    name: "Logo",
                    description: "Our logo",
                    title: undefined,
                    link: undefined,
                    decorative: undefined,
                },
            });
            expect(sitesOf(children[2])).to.deep.equal([3, 1]);
            // The shadow reaches 10 points past the picture's right, beyond its 2pt line
            expect(reach.left).to.equal(10 * EMUS_PER_PIXEL - 12700);
        });

        it("should reach only as far as a picture without a line", () => {
            const { reach } = layoutShapeDrawing([
                { type: "picture", image: { type: "png", data: Buffer.from("") }, transformation: { width: 100, height: 50 } },
            ]);
            expect(reach).to.deep.equal({ left: 0, top: 0, right: 100 * EMUS_PER_PIXEL, bottom: 50 * EMUS_PER_PIXEL });
        });
    });

    describe("groups", () => {
        it("should place a group's children relative to each other, at the group's offset", () => {
            const { children, bounds } = layoutShapeDrawing([
                box("a", 0, 0),
                {
                    type: "group",
                    transformation: { offset: { left: 200, top: 100 } },
                    children: [box("b", 50, 50), box("c", 200, 50)],
                },
            ]);

            const group = children[1];
            expect(group.type).to.equal("group");
            expect(group.transformation.offset?.emus).to.deep.equal({ x: 200 * EMUS_PER_PIXEL, y: 100 * EMUS_PER_PIXEL });
            expect(group.transformation.emus).to.deep.equal({ x: 250 * EMUS_PER_PIXEL, y: 50 * EMUS_PER_PIXEL });
            expect(group.type === "group" && group.childOffset).to.deep.equal({ x: 50 * EMUS_PER_PIXEL, y: 50 * EMUS_PER_PIXEL });
            expect(group.type === "group" && group.childExtent).to.deep.equal({ x: 250 * EMUS_PER_PIXEL, y: 50 * EMUS_PER_PIXEL });
            // The group's children stay in their own coordinates
            expect(group.type === "group" && group.children[0].transformation.offset?.emus).to.deep.equal({
                x: 50 * EMUS_PER_PIXEL,
                y: 50 * EMUS_PER_PIXEL,
            });
            expect(bounds).to.deep.equal({ left: 0, top: 0, right: 450 * EMUS_PER_PIXEL, bottom: 150 * EMUS_PER_PIXEL });
        });

        it("should attach connectors to shapes in groups, where the groups put them", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                {
                    type: "group",
                    // Half the size, so the shape in it is 50 by 25 pixels at (300, 0)
                    transformation: { offset: { left: 300 }, width: 50, height: 25 },
                    children: [box("b", 0, 0)],
                },
                connect("a", "b"),
            ]);

            const connector = children[2];
            expect(connector.transformation.offset?.emus).to.deep.equal({ x: 100 * EMUS_PER_PIXEL, y: Math.round(12.5 * EMUS_PER_PIXEL) });
            expect(connector.transformation.emus).to.deep.equal({ x: 200 * EMUS_PER_PIXEL, y: Math.round(12.5 * EMUS_PER_PIXEL) });
            expect(dataOf(connector).connections).to.deep.equal({ start: { id: 1, index: 3 }, end: { id: 3, index: 1 } });
        });

        it("should flip and rotate the shapes in a group with it", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 300),
                {
                    type: "group",
                    // Turned a quarter turn, the rectangle's right side faces down
                    transformation: { rotation: 90, flip: { horizontal: true } },
                    children: [box("b", 0, 0)],
                },
                connect("b", "a"),
            ]);
            // Flipped, the rectangle's left side (site 1) is on its right, and turned, it faces down
            expect(sitesOf(children[2])[0]).to.equal(1);
        });

        it("should route connectors inside a group between the shapes in it", () => {
            const { children } = layoutShapeDrawing([
                {
                    type: "group",
                    transformation: { offset: { left: 500 } },
                    children: [box("b", 0, 0), box("c", 200, 0), connect("b", "c")],
                },
            ]);

            const group = children[0];
            const connector = group.type === "group" ? group.children[2] : group;
            // In the group's own coordinates
            expect(connector.transformation.offset?.emus).to.deep.equal({ x: 100 * EMUS_PER_PIXEL, y: 25 * EMUS_PER_PIXEL });
        });

        it("should keep a group of no size from dividing by zero", () => {
            const { children } = layoutShapeDrawing([
                { type: "group", children: [{ id: "v", type: "line", transformation: { width: 0, height: 0 } }] },
                box("a", 100, 0),
                connect("v", "a"),
            ]);
            expect(children[0].transformation.emus).to.deep.equal({ x: 0, y: 0 });
        });

        it("should reject a connector in a group that joins a shape outside it", () => {
            expect(() => layoutShapeDrawing([box("a", 0, 0), { type: "group", children: [box("b", 0, 0), connect("a", "b")] }])).to.throw(
                'The shape "a" is not in the connector\'s group',
            );
        });

        it("should reject an empty group, and ids repeated across groups", () => {
            expect(() => layoutShapeDrawing([{ type: "group", children: [] }])).to.throw("Expected at least 1 child shape");
            expect(() => layoutShapeDrawing([box("a", 0, 0), { type: "group", children: [box("a", 0, 0)] }])).to.throw(
                'Invalid shape id "a"',
            );
        });
    });

    it("should connect to the corners and ends of a custom shape", () => {
        const { children } = layoutShapeDrawing([
            { id: "t", type: "custom", path: "M 50 0 L 100 100 L 0 100 Z", transformation: { width: 100, height: 100 } },
            box("a", 0, 300),
            connect("t", "a"),
        ]);
        // The bottom-right corner is the second corner, and the nearest facing down
        expect(sitesOf(children[2])[0]).to.equal(1);
    });

    describe("text", () => {
        it("should size a shape to fit its text, and write the text as centred paragraphs", () => {
            const { children } = layoutShapeDrawing([
                { type: "rectangle", text: "Hello", transformation: { width: "fitText", height: 40 } },
            ] as readonly IShapeGroupChildOptions[]);
            expect(children[0].transformation.pixels.x).to.equal(Math.ceil(measureTextWidth("Hello") * (4 / 3) + 19.2 + 2));
            expect(dataOf(children[0]).children).to.have.length(1);
        });
    });

    describe("layouts", () => {
        it("should place children without an offset with the layout, and keep those with one where they are", () => {
            const { children } = layoutShapeDrawing(
                [
                    shape("a"),
                    shape("b"),
                    shape("c", { transformation: { offset: { left: 500 }, width: 100, height: 50 } }),
                    connect("a", "b"),
                ],
                { layout: { type: "flow" } },
            );
            expect(offsetOf(children[0])).to.deep.equal([0, 0]);
            expect(offsetOf(children[1])).to.deep.equal([0, 100]);
            expect(offsetOf(children[2])).to.deep.equal([500, 0]);
        });

        it("should place the layout around a shape with an offset that connects to the shapes it places", () => {
            // b is pinned, and a leads to it, so a goes on the level before it
            const { children } = layoutShapeDrawing([shape("a"), box("b", 300, 200), shape("c"), connect("a", "b"), connect("b", "c")], {
                layout: { type: "flow" },
            });
            expect(children.slice(0, 3).map(offsetOf)).to.deep.equal([
                [300, 100],
                [300, 200],
                [300, 300],
            ]);
            expect(sitesOf(children[3])).to.deep.equal([2, 0]);

            // With two, the layout is placed as near both as it can be, and they stay where they are
            const two = layoutShapeDrawing([box("a", 0, 0), shape("b"), box("c", 0, 300), connect("a", "b"), connect("b", "c")], {
                layout: { type: "flow" },
            });
            expect(two.children.slice(0, 3).map(offsetOf)).to.deep.equal([
                [0, 0],
                [0, 150],
                [0, 300],
            ]);
        });

        it("should keep children with an offset where they are when there is nothing else to place", () => {
            const { children } = layoutShapeDrawing([box("a", 10, 20)], { layout: { type: "tree" } });
            expect(offsetOf(children[0])).to.deep.equal([10, 20]);
        });

        it("should place a turned shape by the box around it, centred on whole pixels", () => {
            const { children } = layoutShapeDrawing(
                [shape("a", { transformation: { width: 101, height: 50, rotation: 90 } }), shape("b")],
                { layout: { type: "grid", columns: 2, spacing: 10 } },
            );
            // The turned shape takes up 50 by 101 pixels, and its box is centred in that, rounded to a whole pixel
            expect(children[0].transformation.offset?.emus).to.deep.equal({
                x: Math.round(25 * EMUS_PER_PIXEL - 50.5 * EMUS_PER_PIXEL),
                y: 51 * EMUS_PER_PIXEL - 25 * EMUS_PER_PIXEL,
            });
            expect(offsetOf(children[1])).to.deep.equal([60, 26]);
        });

        it("should place groups by their size, following connectors to the shapes inside them, and lay out their own children", () => {
            const { children } = layoutShapeDrawing(
                [
                    shape("a"),
                    { type: "group", layout: { type: "grid", columns: 1, spacing: 0 }, children: [shape("b"), shape("c")] },
                    connect("a", "c"),
                ],
                { layout: { type: "flow", levelSpacing: 10 } },
            );
            expect(offsetOf(children[1])).to.deep.equal([0, 60]);
            const group = children[1];
            expect(group.type === "group" && group.children.map(offsetOf)).to.deep.equal([
                [0, 0],
                [0, 50],
            ]);
        });

        it("should place a shape on the side of its parent that its connector leaves from or arrives at", () => {
            const placed = (from: ConnectorEnd, to: ConnectorEnd, direction?: "down" | "right"): readonly (readonly [number, number])[] =>
                layoutShapeDrawing([shape("a"), shape("no"), shape("yes"), connect(from, to), connect("a", "yes")], {
                    layout: { type: "flow", direction },
                }).children.map(offsetOf);

            // "no" is given before "yes", and goes to the right when its connector leaves the decision's right side
            const [a, no, yes] = placed({ id: "a", side: "right" }, "no");
            expect(no[0]).to.be.greaterThan(yes[0]);
            expect(yes[0]).to.equal(a[0]);
            // or arrives at its left side
            const [, arriving, below] = placed("a", { id: "no", side: "left" });
            expect(arriving[0]).to.be.greaterThan(below[0]);
            // Leaving the left side, or arriving at the right, puts it on the left
            const [, leftNo, leftYes] = placed({ id: "a", side: "left" }, "no");
            expect(leftNo[0]).to.be.lessThan(leftYes[0]);
            const [, rightArriving, rightYes] = placed("a", { id: "no", side: "right" });
            expect(rightArriving[0]).to.be.lessThan(rightYes[0]);
            // In a flow that runs right, the bottom side is across the levels
            const [, bottomNo, bottomYes] = placed({ id: "a", side: "bottom" }, "no", "right");
            expect(bottomNo[1]).to.be.greaterThan(bottomYes[1]);
            // A side along the levels changes nothing
            const [, topNo, topYes] = placed("a", { id: "no", side: "top" });
            expect(topNo[0]).to.be.lessThan(topYes[0]);
        });

        it("should leave room between levels for connector labels", () => {
            const flow = (direction: "down" | "right", label: string): readonly (readonly [number, number])[] =>
                layoutShapeDrawing([shape("a"), shape("b"), connect("a", "b", { label })], {
                    layout: { type: "flow", direction, levelSpacing: 10 },
                }).children.map(offsetOf);
            // A label two lines tall moves the next level further down, and a long one further right
            expect(flow("down", "Two\nlines")[1][1]).to.be.greaterThan(flow("down", "One")[1][1]);
            expect(flow("right", "A much longer label")[1][0]).to.be.greaterThan(flow("right", "Short")[1][0]);
        });

        it("should lay out pictures", () => {
            const { children } = layoutShapeDrawing(
                [shape("a"), { type: "picture", image: { type: "png", data: Buffer.from("") }, transformation: { width: 30, height: 30 } }],
                { layout: { type: "grid", columns: 2, spacing: 10 } },
            );
            expect(offsetOf(children[1])).to.deep.equal([110, 10]);
        });

        describe("connector sides", () => {
            it("should leave a level from the side facing the next level, and arrive from the side facing the one before", () => {
                const down = layoutShapeDrawing([shape("a"), shape("b"), connect("a", "b")], { layout: { type: "flow" } });
                expect(sitesOf(down.children[2])).to.deep.equal([2, 0]);
                const right = layoutShapeDrawing([shape("a"), shape("b"), connect("a", "b")], {
                    layout: { type: "tree", direction: "right" },
                });
                expect(sitesOf(right.children[2])).to.deep.equal([3, 1]);
                const up = layoutShapeDrawing([shape("a"), shape("b"), connect("a", "b")], { layout: { type: "flow", direction: "up" } });
                expect(sitesOf(up.children[2])).to.deep.equal([0, 2]);
                const left = layoutShapeDrawing([shape("a"), shape("b"), connect("a", "b")], {
                    layout: { type: "flow", direction: "left" },
                });
                expect(sitesOf(left.children[2])).to.deep.equal([1, 3]);
            });

            it("should go back to the level before between the same sides, and loop round the side to levels further back", () => {
                const { children } = layoutShapeDrawing(
                    [
                        shape("a"),
                        shape("b"),
                        shape("c"),
                        connect("a", "b"),
                        connect("b", "c"),
                        connect("b", "a"),
                        connect("c", "a", { route: "elbow" }),
                    ],
                    { layout: { type: "flow" } },
                );
                expect(sitesOf(children[5])).to.deep.equal([0, 2]);
                expect(sitesOf(children[6])).to.deep.equal([3, 3]);
            });

            it("should face each other on the same level, and keep sides that are given", () => {
                // In a tree, the connector between the children doesn't make c a child of b, as c already has a parent
                const { children } = layoutShapeDrawing(
                    [
                        shape("a"),
                        shape("b"),
                        shape("c"),
                        connect("a", "b"),
                        connect("a", "c"),
                        connect("b", "c"),
                        connect({ id: "a", side: "left" }, "b"),
                    ],
                    { layout: { type: "tree" } },
                );
                expect(sitesOf(children[5])).to.deep.equal([3, 1]);
                expect(sitesOf(children[6])[0]).to.equal(1);
            });

            it("should face each other in a grid, and for shapes the layout didn't place", () => {
                const grid = layoutShapeDrawing([shape("a"), shape("b"), connect("a", "b")], { layout: { type: "grid", columns: 1 } });
                expect(sitesOf(grid.children[2])).to.deep.equal([2, 0]);
                // Shapes with an offset that only connect to each other are left out of the layout
                const pinned = layoutShapeDrawing([shape("a"), box("b", 300, 0), box("c", 600, 0), connect("b", "c")], {
                    layout: { type: "flow" },
                });
                expect(sitesOf(pinned.children[3])).to.deep.equal([3, 1]);
            });
        });
    });

    describe("spreading connector ends", () => {
        const target = (type: string, extra: Record<string, unknown> = {}): IShapeGroupChildOptions =>
            ({
                id: "t",
                type,
                transformation: { offset: { left: 200, top: 100 }, width: 100, height: 60 },
                ...extra,
            }) as IShapeGroupChildOptions;

        it("should spread arrowheads that meet at one site along the side, keeping them attached", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 200),
                target("rectangle"),
                connect("a", "t", { line: arrow }),
                connect("b", "t", { line: arrow }),
            ]);
            // The connector from above arrives at the upper point
            expect(endsOf(children[3])[1]).to.deep.equal([200, 120]);
            expect(endsOf(children[4])[1]).to.deep.equal([200, 140]);
            expect(sitesOf(children[3])[1]).to.equal(1);
            expect(sitesOf(children[4])[1]).to.equal(1);
        });

        it("should spread arrowheads at the start of connectors", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 200),
                target("flowChartProcess"),
                connect("t", "a", { line: { startArrow: "triangle" } }),
                connect("t", "b"),
            ]);
            expect(endsOf(children[3])[0]).to.deep.equal([200, 120]);
            expect(endsOf(children[4])[0]).to.deep.equal([200, 140]);
        });

        it("should keep ends without arrowheads that go to different shapes together", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 200),
                target("rectangle"),
                connect("t", "a"),
                connect("t", "b"),
            ]);
            expect(endsOf(children[3])[0]).to.deep.equal([200, 130]);
            expect(endsOf(children[4])[0]).to.deep.equal([200, 130]);
        });

        it("should draw connectors between the same two shapes side by side", () => {
            const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 200, 0), connect("a", "b"), connect("b", "a")]);
            expect(endsOf(children[2])).to.deep.equal([
                [100, 17],
                [200, 17],
            ]);
            expect(endsOf(children[3])).to.deep.equal([
                [200, 33],
                [100, 33],
            ]);
        });

        it("should spread ends along the straight part of a side", () => {
            const topEnds = (type: string, extra: Record<string, unknown> = {}): readonly number[] => {
                const { children } = layoutShapeDrawing([
                    box("a", 150, -200),
                    box("b", 250, -200),
                    target(type, extra),
                    connect("a", { id: "t", side: "top" }, { line: arrow }),
                    connect("b", { id: "t", side: "top" }, { line: arrow }),
                ]);
                return [endsOf(children[3])[1][0], endsOf(children[4])[1][0]];
            };
            // A rectangle's whole side, split in three
            expect(topEnds("rectangle")).to.deep.equal([233, 267]);
            expect(topEnds("flowChartPredefinedProcess")).to.deep.equal([233, 267]);
            expect(topEnds("flowChartInternalStorage")).to.deep.equal([233, 267]);
            expect(topEnds("flowChartDocument")).to.deep.equal([233, 267]);
            // Less the rounded corners
            expect(topEnds("roundedRectangle", { adjustments: { cornerRadius: 50 } })).to.deep.equal([243, 257]);
            expect(topEnds("roundedRectangle")).to.deep.equal([237, 263]);
            expect(topEnds("flowChartAlternateProcess")).to.deep.equal([237, 263]);
            // Between a terminator's round ends
            expect(topEnds("flowChartTerminator")).to.deep.equal([239, 261]);
            // Other shapes keep their ends at the site
            expect(topEnds("ellipse")).to.deep.equal([250, 250]);
        });

        it("should spread ends on the sides of shapes that are straight, and not where a site isn't on a side", () => {
            const ends = (type: string, side: "left" | "right" | "bottom"): readonly (readonly [number, number])[] => {
                const { children } = layoutShapeDrawing([
                    box("a", -200, -200),
                    box("b", 600, 400),
                    target(type),
                    connect("a", { id: "t", side }, { line: arrow }),
                    connect("b", { id: "t", side }, { line: arrow }),
                ]);
                return [endsOf(children[3])[1], endsOf(children[4])[1]];
            };
            expect(ends("flowChartDocument", "right")).to.deep.equal([
                [300, 116],
                [300, 132],
            ]);
            expect(ends("flowChartTerminator", "right")).to.deep.equal([
                [300, 130],
                [300, 130],
            ]);
            // A document's bottom site is on its wavy edge
            expect(ends("flowChartDocument", "bottom")[0]).to.deep.equal(ends("flowChartDocument", "bottom")[1]);
            expect(ends("rectangle", "bottom")).to.deep.equal([
                [233, 160],
                [267, 160],
            ]);
        });

        it("should order the ends on a turned shape by where the connectors go", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 200),
                target("rectangle", { transformation: { offset: { left: 200, top: 100 }, width: 100, height: 60, rotation: 180 } }),
                connect("a", "t", { line: arrow }),
                connect("b", "t", { line: arrow }),
            ]);
            expect(endsOf(children[3])[1]).to.deep.equal([200, 120]);
            expect(endsOf(children[4])[1]).to.deep.equal([200, 140]);
        });

        it("should spread ends on pictures, and leave ends given as points where they are", () => {
            const picture = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 200),
                {
                    id: "t",
                    type: "picture",
                    image: { type: "png", data: Buffer.from("") },
                    transformation: { offset: { left: 200, top: 100 }, width: 100, height: 60 },
                },
                connect("a", "t", { line: arrow }),
                connect("b", "t", { line: arrow }),
            ]);
            expect(endsOf(picture.children[3])[1]).to.deep.equal([200, 120]);
            const points = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 0, 200),
                target("rectangle"),
                connect("a", { id: "t", point: { x: 0, y: 50 } }, { line: arrow }),
                connect("b", { id: "t", point: { x: 0, y: 50 } }, { line: arrow }),
            ]);
            expect(endsOf(points.children[3])[1]).to.deep.equal([200, 130]);
        });
    });

    describe("shapes in the way", () => {
        const inTheWay = { transformation: { offset: { left: 200, top: -20 }, width: 50, height: 90 } };

        it("should bend a connector without a route around a shape a straight line would go through", () => {
            const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 400, 0), box("x", 200, -20, inTheWay), connect("a", "b")]);
            expect(dataOf(children[3]).geometry.type).to.equal("elbowConnectorFourBends");
            expect(dataOf(children[3]).nonVisualDrawingProperties?.name).to.equal("Elbow Connector 4");
        });

        it("should keep a connector straight when it is asked to be, or nothing is in the way", () => {
            const straight = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 400, 0),
                box("x", 200, -20, inTheWay),
                connect("a", "b", { route: "straight" }),
            ]);
            expect(dataOf(straight.children[3]).geometry.type).to.equal("straightConnector");
            // Beside the line, above it, and too small to be in the way
            const clear = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 400, 100),
                box("beside", 400, -200),
                box("above", 150, -100, { transformation: { offset: { left: 150, top: -100 }, width: 20, height: 20 } }),
                box("tiny", 250, 60, { transformation: { offset: { left: 250, top: 60 }, width: 1, height: 1 } }),
                connect("a", "b"),
            ]);
            expect(dataOf(clear.children[5]).geometry.type).to.equal("straightConnector");
            const vertical = layoutShapeDrawing([box("a", 0, 0), box("b", 0, 300), box("beside", 200, 100), connect("a", "b")]);
            expect(dataOf(vertical.children[3]).geometry.type).to.equal("straightConnector");
        });
    });

    describe("label positions", () => {
        it("should put a label at the start or end just clear of the shape there", () => {
            const start = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 300, 0),
                connect("a", "b", { label: { text: "", width: 20, height: 10, position: "start" } }),
            ]);
            expect(offsetOf(start.children[3])).to.deep.equal([104, 20]);
            const end = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 300, 0),
                connect("a", "b", { label: { text: "", width: 20, height: 10, position: "end" } }),
            ]);
            expect(offsetOf(end.children[3])).to.deep.equal([276, 20]);
            const middle = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 300, 0),
                connect("a", "b", { label: { text: "", width: 20, height: 10, position: "middle" } }),
            ]);
            expect(offsetOf(middle.children[3])).to.deep.equal([190, 20]);
        });

        it("should move a label along the route until it is off every shape", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 300, 0),
                box("x", 180, 0, { transformation: { offset: { left: 180 }, width: 40, height: 50 } }),
                connect("a", "b", { route: "straight", label: { text: "", width: 30, height: 10 } }),
            ]);
            // The middle of the route is at 200, and the first place clear of the shape is 36 pixels on
            expect(offsetOf(children[4])).to.deep.equal([221, 20]);
        });

        it("should keep labels apart, putting a label beside its route when there is no room on it", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0, { transformation: { width: 100, height: 40 } }),
                box("b", 160, 0, { transformation: { offset: { left: 160 }, width: 100, height: 40 } }),
                connect("a", "b", { label: { text: "", width: 60, height: 20, position: "start" } }),
                connect("b", "a", { label: { text: "", width: 60, height: 20, position: "start" } }),
            ]);
            const [, firstTop] = offsetOf(children[3]);
            const [, secondTop] = offsetOf(children[5]);
            // The first label is on the upper connector, and the second below the lower one
            expect(firstTop).to.equal(3);
            expect(secondTop).to.equal(31);
        });

        it("should keep a label off the lines of other connectors", () => {
            // A connector from c down to d crosses the middle of the connector from a to b
            const { children } = layoutShapeDrawing([
                box("a", 0, 0),
                box("b", 300, 0),
                box("c", 150, -150),
                box("d", 150, 150),
                connect("a", "b", { label: { text: "", width: 30, height: 10 } }),
                connect("c", "d"),
            ]);
            const [left, top] = offsetOf(children[5]);
            // On its own connector, but not across the line at x = 200
            expect(top).to.equal(20);
            expect(left + 30 < 200 || left > 200).to.equal(true);
        });

        it("should put a label beside its route on the side away from the shapes", () => {
            // A thin shape on the route leaves no room on it, and another shape is above or below the route
            const beside = (below: boolean): number =>
                offsetOf(
                    layoutShapeDrawing([
                        box("a", 0, 0, { transformation: { width: 100, height: 40 } }),
                        box("b", 160, 0, { transformation: { offset: { left: 160 }, width: 100, height: 40 } }),
                        box("bar", 120, 17, { transformation: { offset: { left: 120, top: 17 }, width: 20, height: 6 } }),
                        box("x", 110, 0, { transformation: { offset: { left: 110, top: below ? 50 : -50 }, width: 40, height: 40 } }),
                        connect("a", "b", { route: "straight", label: { text: "", width: 40, height: 20 } }),
                    ]).children[5],
                )[1];
            // Above the route when there is a shape below it, and below it when there is one above
            expect(beside(true)).to.equal(-4);
            expect(beside(false)).to.equal(24);
        });

        it("should stay where it is wanted when nowhere is clear", () => {
            const { children } = layoutShapeDrawing([
                box("a", 0, 0, { transformation: { width: 100, height: 200 } }),
                box("b", 110, 0, { transformation: { offset: { left: 110 }, width: 100, height: 200 } }),
                connect("a", "b", { label: { text: "", width: 40, height: 20 } }),
            ]);
            expect(offsetOf(children[3])).to.deep.equal([85, 90]);
        });
    });

    it("should throw on an empty list, a repeated id or an unknown id", () => {
        expect(() => layoutShapeDrawing([])).to.throw("Expected at least 1 child shape");
        expect(() => layoutShapeDrawing([box("a", 0, 0), box("a", 100, 0)])).to.throw('Invalid shape id "a"');
        expect(() => layoutShapeDrawing([box("a", 0, 0), connect("a", "missing")])).to.throw('No shape has the id "missing"');
    });
});

describe("lanes", () => {
    beforeEach(() => {
        let id = 0;
        vi.spyOn(convenienceFunctions, "docPropertiesUniqueNumericId").mockImplementation(() => ++id);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should draw each lane's band and header behind the shapes, with the lanes' ids first", () => {
        const { children } = layoutShapeDrawing([shape("a", { lane: "Team" }), shape("b", { lane: "Other team" }), connect("a", "b")], {
            layout: { type: "flow", lanes: [{ name: "Team", fill: "DEEBF7", headerFill: "FFFFFF", line: "000000" }, "Other team"] },
        });
        expect(children).to.have.length(7);
        const [band, header, otherBand, otherHeader] = children.map(dataOf);
        expect(band).to.deep.include({ fill: "DEEBF7", line: "000000" });
        expect(band.nonVisualDrawingProperties).to.deep.include({ id: 1, name: "Team" });
        expect(header).to.deep.include({ fill: "FFFFFF", line: "000000" });
        expect(header.nonVisualDrawingProperties).to.deep.include({ id: 2, name: "Text Box 2" });
        expect(header.children).to.have.length(1);
        // Without a fill, a band has none, and its header is light grey with a thin grey line
        expect(otherBand.fill).to.equal(undefined);
        expect(otherHeader).to.deep.include({ fill: "F2F2F2", line: { color: "A5A5A5", width: 0.75 } });
        // The shapes come after the lanes, and each is in its own lane
        expect(dataOf(children[4]).nonVisualDrawingProperties?.id).to.equal(5);
        expect(offsetOf(children[5])[0]).to.be.greaterThan(offsetOf(children[4])[0]);
    });

    it("should lay out lanes in a group inside the drawing", () => {
        const { children } = layoutShapeDrawing([
            { type: "group", layout: { type: "flow", lanes: ["Inner"] }, children: [shape("a", { lane: "Inner" })] },
        ]);
        const group = children[0];
        expect(group.type === "group" && group.children).to.have.length(3);
    });

    it("should throw for a lane the layout doesn't have, or two lanes with the same name", () => {
        expect(() => layoutShapeDrawing([shape("a", { lane: "Missing" })], { layout: { type: "flow", lanes: ["Team"] } })).to.throw(
            'Invalid lane "Missing". The layout has no lane with that name',
        );
        expect(() => layoutShapeDrawing([shape("a", { lane: "Team" })])).to.throw('Invalid lane "Team"');
        expect(() => layoutShapeDrawing([shape("a")], { layout: { type: "flow", lanes: ["Team", "Team"] } })).to.throw(
            'Invalid lane "Team". Each lane in a layout needs a different name',
        );
    });

    it("should make headers fit their names across the page when the flow runs across it", () => {
        const [band, header] = layoutShapeDrawing([shape("a", { lane: "A long lane name" })], {
            layout: { type: "flow", direction: "right", lanes: ["A long lane name"] },
        }).children;
        expect(header.transformation.pixels.x).to.equal(Math.ceil(measureTextWidth("A long lane name") * (4 / 3)) + 12);
        expect(band.transformation.pixels.y).to.equal(header.transformation.pixels.y);
    });

    it("should depend on the document's styles, which headers are measured in", () => {
        expect(drawingStyledParagraphs([shape("a")], { type: "flow", lanes: ["A"] })).to.deep.equal([]);
        expect(drawingStyledParagraphs([shape("a")], { type: "flow", lanes: [] })).to.equal(undefined);
        expect(drawingStyledParagraphs([{ type: "group", layout: { type: "flow", lanes: ["A"] }, children: [shape("a")] }])).to.deep.equal(
            [],
        );
    });
});

describe("connectors that would lie on top of each other", () => {
    it("should be moved apart, and stay attached to their shapes", () => {
        // Two connectors loop round the right of a column of shapes, along the same line
        const { children } = layoutShapeDrawing([
            box("a", 0, 0),
            box("b", 0, 100),
            box("c", 0, 200),
            box("d", 0, 300),
            connect({ id: "a", side: "right" }, { id: "c", side: "right" }, { route: "elbow" }),
            connect({ id: "b", side: "right" }, { id: "d", side: "right" }, { route: "elbow" }),
        ]);
        const loops = [children[4], children[5]];
        // Each loop's bend is outside its box, a margin (24 pixels) past the pixel-wide box, and 3 pixels either way
        const bends = loops.map((child) => {
            const { adjustments } = dataOf(child).geometry as { readonly adjustments: Readonly<Record<string, number>> };
            return Math.round(
                ((child.transformation.offset?.emus?.x ?? 0) + (child.transformation.emus.x * adjustments.bendX) / 100) / EMUS_PER_PIXEL,
            );
        });
        expect(bends).to.deep.equal([122, 128]);
        expect(loops.map((child) => dataOf(child).connections?.start)).to.not.include(undefined);

        // A shape just past the lines stops one from moving into it
        const blocked = layoutShapeDrawing([
            box("a", 0, 0),
            box("b", 0, 100),
            box("c", 0, 200),
            box("d", 0, 300),
            box("e", 126, 150, { transformation: { offset: { left: 126, top: 150 }, width: 50, height: 30 } }),
            connect({ id: "a", side: "right" }, { id: "c", side: "right" }, { route: "elbow" }),
            connect({ id: "b", side: "right" }, { id: "d", side: "right" }, { route: "elbow" }),
        ]).children;
        expect(
            [blocked[5], blocked[6]].map((child) => {
                const { adjustments } = dataOf(child).geometry as { readonly adjustments: Readonly<Record<string, number>> };
                return Math.round(
                    ((child.transformation.offset?.emus?.x ?? 0) + (child.transformation.emus.x * adjustments.bendX) / 100) /
                        EMUS_PER_PIXEL,
                );
            }),
        ).to.deep.equal([122, 125]);
    });
});

describe("connectors that need more bends than the presets have", () => {
    it("should be drawn as a freeform line that isn't attached to the shapes", () => {
        const square = (id: string, left: number, top: number, width: number, height: number): IShapeGroupChildOptions =>
            ({ id, type: "rectangle", transformation: { offset: { left, top }, width, height } }) as IShapeGroupChildOptions;
        const { children } = layoutShapeDrawing([
            square("a", 0, 0, 20, 20),
            square("z", 260, -40, 20, 20),
            square("b0", 40, 20, 80, 20),
            square("b1", 100, 20, 20, 60),
            square("b2", 180, -20, 40, 40),
            square("b3", 80, -40, 20, 60),
            connect({ id: "a", side: "right" }, { id: "z", side: "bottom" }, { route: "elbow", line: arrow }),
        ]);
        const connector = children[6];
        const data = dataOf(connector);
        expect(data.geometry.type).to.equal("custom");
        expect(data.geometry.type === "custom" && data.geometry.path.startsWith("M 0 ")).to.equal(true);
        expect(data.connections).to.equal(undefined);
        expect(data.line).to.deep.equal(arrow);
        expect(data.nonVisualDrawingProperties?.name).to.match(/^Freeform \d+$/);
    });
});

describe("drawingStyledParagraphs", () => {
    const square = { type: "rectangle", transformation: { width: 10, height: 10 } } as const;
    const paragraph = new Paragraph("A");

    it("should depend on the styles when a shape fits its text or has text, and give the shapes' paragraphs", () => {
        expect(drawingStyledParagraphs([square, { ...square, children: [paragraph] }])).to.equal(undefined);
        expect(drawingStyledParagraphs([{ ...square, transformation: { width: "fitText", height: 10 } }])).to.deep.equal([]);
        expect(
            drawingStyledParagraphs([{ ...square, transformation: { width: 10, height: "fitText" }, children: [paragraph] }]),
        ).to.deep.equal([paragraph]);
        expect(drawingStyledParagraphs([{ ...square, text: "A" }])).to.deep.equal([]);
        expect(drawingStyledParagraphs([{ type: "group", children: [{ ...square, text: "A", children: [paragraph] }] }])).to.deep.equal([
            paragraph,
        ]);
        expect(
            drawingStyledParagraphs([{ type: "picture", image: { type: "png", data: "" }, transformation: { width: 1, height: 1 } }]),
        ).to.equal(undefined);
    });

    it("should depend on the styles when a label is sized to its text or its text is a string", () => {
        const connector = { type: "connector", from: "a", to: "b" } as const;
        expect(drawingStyledParagraphs([connector])).to.equal(undefined);
        expect(drawingStyledParagraphs([{ ...connector, label: "Yes" }])).to.deep.equal([]);
        expect(drawingStyledParagraphs([{ ...connector, label: { text: "Yes", width: 20, height: 10 } }])).to.deep.equal([]);
        expect(drawingStyledParagraphs([{ ...connector, label: { text: [paragraph], width: 20 } }])).to.deep.equal([paragraph]);
        expect(drawingStyledParagraphs([{ ...connector, label: { text: [paragraph], width: 20, height: 10 } }])).to.equal(undefined);
    });
});

describe("createShapeDrawingNodes", () => {
    it("should give the children their ids once, so laying them out again keeps them", () => {
        const nodes = createShapeDrawingNodes([{ type: "rectangle", transformation: { width: 10, height: 10 } }]);
        const ids = (layout: ShapeDrawingLayout): readonly unknown[] =>
            layout.children.map((child) => (child.type === "wps" ? child.data.nonVisualDrawingProperties?.id : undefined));
        expect(ids(layoutShapeDrawing(nodes))).to.deep.equal(ids(layoutShapeDrawing(nodes)));
    });
});
