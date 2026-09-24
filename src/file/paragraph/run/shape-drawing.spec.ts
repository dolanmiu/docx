import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PresetShapeCoreOptions } from "@file/drawing/inline/graphic/graphic-data/wps";
import type { WpsMediaData } from "@file/media";
import * as convenienceFunctions from "@util/convenience-functions";

import type { ConnectorEnd } from "./shape-connector";
import { type IShapeGroupChildOptions, layoutShapeDrawing } from "./shape-drawing";

const EMUS_PER_PIXEL = 9525;

const box = (id: string, left: number, top: number, extra: Partial<IShapeGroupChildOptions> = {}): IShapeGroupChildOptions =>
    ({ id, type: "rectangle", transformation: { offset: { left, top }, width: 100, height: 50 }, ...extra }) as IShapeGroupChildOptions;

const connect = (from: ConnectorEnd, to: ConnectorEnd, extra: Partial<IShapeGroupChildOptions> = {}): IShapeGroupChildOptions =>
    ({ type: "connector", from, to, ...extra }) as IShapeGroupChildOptions;

const dataOf = (child: WpsMediaData): PresetShapeCoreOptions => child.data as PresetShapeCoreOptions;

/** The connection site indexes a connector is attached to */
const sitesOf = (child: WpsMediaData): readonly (number | undefined)[] => {
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
            { id: 1, name: "", description: undefined, title: undefined },
            { id: 2, name: "Arrow", description: "d", title: "t" },
            { id: 3, name: "", description: undefined, title: undefined },
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

    it("should include connectors in the box around the children", () => {
        const layout = layoutShapeDrawing([
            box("a", 0, 0, { line: { width: 2, endArrow: "triangle" } }),
            box("b", 0, 100),
            connect({ id: "a", side: "top" }, { id: "b", side: "top" }, { route: "elbow", line: { width: 3 } }),
        ]);

        // The connector loops a quarter of an inch above the top shape
        expect(layout.bounds).to.deep.equal({ left: 0, top: -228600, right: 100 * EMUS_PER_PIXEL, bottom: 150 * EMUS_PER_PIXEL });
        expect(layout.overhang).to.equal(Math.ceil((2 * 12700 * 3) / 2));
    });

    it("should move everything onto the positive side when asked", () => {
        const layout = layoutShapeDrawing(
            [box("a", 0, 0), box("b", 0, 100), connect({ id: "a", side: "top" }, { id: "b", side: "top" }, { route: "elbow" })],
            true,
        );

        expect(layout.bounds.top).to.equal(0);
        expect(layout.children[0].transformation.offset?.emus).to.deep.equal({ x: 0, y: 228600 });
    });

    it("should throw on an empty list, a repeated id or an unknown id", () => {
        expect(() => layoutShapeDrawing([])).to.throw("Expected at least 1 child shape");
        expect(() => layoutShapeDrawing([box("a", 0, 0), box("a", 100, 0)])).to.throw('Invalid shape id "a"');
        expect(() => layoutShapeDrawing([box("a", 0, 0), connect("a", "missing")])).to.throw('No shape has the id "missing"');
    });
});
