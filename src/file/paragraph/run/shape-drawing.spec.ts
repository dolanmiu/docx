import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PresetShapeCoreOptions } from "@file/drawing/inline/graphic/graphic-data/wps";
import type { ShapeDrawingChildMediaData } from "@file/media";
import * as convenienceFunctions from "@util/convenience-functions";

import { Paragraph } from "../paragraph";
import type { ConnectorEnd } from "./shape-connector";
import { type IShapeGroupChildOptions, layoutShapeDrawing } from "./shape-drawing";

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
        expect(children[2].transformation.emus).to.deep.equal({ x: 100 * EMUS_PER_PIXEL, y: 0 });
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
            true,
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
            // The connector runs from x = 100 to 300 pixels at y = 25, and "Yes" is about 3 * 7 + 8 pixels wide
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

        it("should be 100 pixels wide for paragraphs without a width", () => {
            const { children } = layoutShapeDrawing([box("a", 0, 0), box("b", 300, 0), connect("a", "b", { label: { text: [] } })]);
            expect(children[3].transformation.emus.x).to.equal(100 * EMUS_PER_PIXEL);
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

    it("should throw on an empty list, a repeated id or an unknown id", () => {
        expect(() => layoutShapeDrawing([])).to.throw("Expected at least 1 child shape");
        expect(() => layoutShapeDrawing([box("a", 0, 0), box("a", 100, 0)])).to.throw('Invalid shape id "a"');
        expect(() => layoutShapeDrawing([box("a", 0, 0), connect("a", "missing")])).to.throw('No shape has the id "missing"');
    });
});
