import { describe, expect, it } from "vitest";

import { type Box, type DrawingFrame, type PlacedDrawing, keepOutOf, overlap, placeDrawing, roomBeside } from "./floating-drawings";
import type { FloatingDrawing, Section } from "./read-document";

// A4, with inch margins, in points
const SECTION: Section = {
    pageWidth: 595.3,
    pageHeight: 841.9,
    marginTop: 72,
    marginBottom: 72,
    marginLeft: 72,
    marginRight: 72,
    header: 36,
    footer: 36,
    gutter: 0,
    topGutter: 0,
    start: "nextPage",
    titlePage: false,
    columns: [451.3],
    numberFormat: "decimal",
    headers: {},
    footers: {},
};

const FRAME: DrawingFrame = {
    section: SECTION,
    oddPage: true,
    column: { start: 72, end: 523.3 },
    paragraph: 100,
    line: { top: 120, height: 14 },
    character: 200,
};

const NONE = { top: 0, bottom: 0, left: 0, right: 0 };

/** A drawing 100 points wide and 50 tall, placed as given */
const drawingOf = (placed: Partial<FloatingDrawing> = {}): FloatingDrawing => ({
    wrap: "square",
    side: "bothSides",
    width: 100,
    height: 50,
    effects: NONE,
    distances: NONE,
    horizontal: { from: "margin", offset: 0 },
    vertical: { from: "paragraph", offset: 0 },
    ...placed,
});

const placedOf = (drawing: FloatingDrawing, frame = FRAME): PlacedDrawing => {
    const box = placeDrawing(drawing, frame);
    if (typeof box === "string") {
        throw new Error(box);
    }
    return { drawing, box, keepOut: keepOutOf(drawing, box), anchor: "0 0" };
};

describe("placeDrawing", () => {
    it("should place a drawing at a distance from the start of what it is placed against across the page", () => {
        const leftOf = (from: string, offset = 10): number =>
            (placeDrawing(drawingOf({ horizontal: { from, offset } }), FRAME) as Box).left;
        expect(leftOf("page")).to.equal(10);
        expect(leftOf("margin")).to.equal(82);
        expect(leftOf("column")).to.equal(82);
        expect(leftOf("character")).to.equal(210);
        expect(leftOf("leftMargin")).to.equal(10);
        expect(leftOf("rightMargin")).to.be.closeTo(533.3, 0.01);
        // The inside margin is the left one on odd pages, and the outside the right one
        expect(leftOf("insideMargin")).to.equal(10);
        expect(leftOf("outsideMargin")).to.be.closeTo(533.3, 0.01);
        const even = { ...FRAME, oddPage: false };
        expect((placeDrawing(drawingOf({ horizontal: { from: "insideMargin", offset: 0 } }), even) as Box).left).to.be.closeTo(523.3, 0.01);
        expect((placeDrawing(drawingOf({ horizontal: { from: "outsideMargin", offset: 0 } }), even) as Box).left).to.equal(0);
    });

    it("should place a drawing at a distance from the start of what it is placed against down the page", () => {
        const topOf = (from: string, offset = 10): number => (placeDrawing(drawingOf({ vertical: { from, offset } }), FRAME) as Box).top;
        expect(topOf("page")).to.equal(10);
        expect(topOf("margin")).to.equal(82);
        expect(topOf("topMargin")).to.equal(10);
        expect(topOf("bottomMargin")).to.be.closeTo(779.9, 0.01);
        expect(topOf("paragraph")).to.equal(110);
        // The inside margin is the top one on odd pages, and the bottom one on even pages, and the outside margin the other
        expect(topOf("insideMargin")).to.equal(10);
        expect(topOf("outsideMargin")).to.be.closeTo(779.9, 0.01);
        const even = { ...FRAME, oddPage: false };
        expect((placeDrawing(drawingOf({ vertical: { from: "insideMargin", offset: 0 } }), even) as Box).top).to.be.closeTo(769.9, 0.01);
        expect((placeDrawing(drawingOf({ vertical: { from: "outsideMargin", offset: 0 } }), even) as Box).top).to.equal(0);
        expect(topOf("line")).to.equal(130);
    });

    it("should line a drawing up with the start, middle or end of what it is placed against, and inside or outside", () => {
        const boxOf = (horizontal: string, vertical: string, oddPage = true): Box =>
            placeDrawing(drawingOf({ horizontal: { from: "margin", align: horizontal }, vertical: { from: "margin", align: vertical } }), {
                ...FRAME,
                oddPage,
            }) as Box;
        expect(boxOf("left", "top")).to.deep.include({ left: 72, top: 72 });
        expect(boxOf("center", "center").left).to.be.closeTo(247.65, 0.01);
        expect(boxOf("center", "center").top).to.be.closeTo(395.95, 0.01);
        expect(boxOf("right", "bottom").left).to.be.closeTo(423.3, 0.01);
        expect(boxOf("right", "bottom").top).to.be.closeTo(719.9, 0.01);
        expect(boxOf("inside", "inside").left).to.equal(72);
        expect(boxOf("inside", "inside", false).left).to.be.closeTo(423.3, 0.01);
        expect(boxOf("outside", "outside").left).to.be.closeTo(423.3, 0.01);
        expect(boxOf("outside", "outside", false).left).to.equal(72);
        expect(boxOf("inside", "inside").top).to.equal(72);
    });

    it("should place a drawing at a share of what it is placed against, and size it by a share of what it is sized by", () => {
        const box = placeDrawing(
            drawingOf({
                horizontal: { from: "margin", share: 0.5 },
                vertical: { from: "page", share: 0.1 },
                relativeWidth: { from: "margin", share: 0.25 },
                relativeHeight: { from: "topMargin", share: 0.5 },
            }),
            FRAME,
        ) as Box;
        expect(box.left).to.be.closeTo(297.65, 0.01);
        expect(box.right - box.left).to.be.closeTo(112.825, 0.01);
        expect(box.top).to.be.closeTo(84.19, 0.01);
        expect(box.bottom - box.top).to.equal(36);
        // A place given as neither a distance nor a share is at the start
        expect((placeDrawing(drawingOf({ horizontal: { from: "page" } }), FRAME) as Box).left).to.equal(0);
    });

    it("should say why it can't place a drawing against or sized by what isn't followed, or lined up in ways Word doesn't have", () => {
        expect(placeDrawing(drawingOf({ horizontal: { from: "bogus", offset: 0 } }), FRAME)).to.equal(
            "a drawing placed against what isn't followed yet",
        );
        expect(placeDrawing(drawingOf({ vertical: { from: "bogus", offset: 0 } }), FRAME)).to.equal(
            "a drawing placed against what isn't followed yet",
        );
        expect(placeDrawing(drawingOf({ horizontal: { from: "page", align: "bogus" } }), FRAME)).to.equal(
            "a drawing lined up in a way not yet followed",
        );
        expect(placeDrawing(drawingOf({ relativeWidth: { from: "bogus", share: 1 } }), FRAME)).to.equal(
            "a drawing sized by a share of what isn't followed yet",
        );
        expect(placeDrawing(drawingOf({ relativeHeight: { from: "bogus", share: 1 } }), FRAME)).to.equal(
            "a drawing sized by a share of what isn't followed yet",
        );
    });
});

describe("keepOutOf", () => {
    it("should keep text out of a drawing's box, its effects and its distances", () => {
        const drawing = drawingOf({
            effects: { top: 1, bottom: 2, left: 3, right: 4 },
            distances: { top: 10, bottom: 20, left: 30, right: 40 },
        });
        expect(keepOutOf(drawing, { left: 100, right: 200, top: 100, bottom: 150 })).to.deep.equal({
            left: 67,
            right: 244,
            top: 89,
            bottom: 172,
        });
    });
});

describe("overlap", () => {
    it("should say whether two boxes overlap, and not when they only touch", () => {
        const box = { left: 0, right: 10, top: 0, bottom: 10 };
        expect(overlap(box, { left: 5, right: 15, top: 5, bottom: 15 })).to.equal(true);
        expect(overlap(box, { left: 10, right: 15, top: 0, bottom: 10 })).to.equal(false);
        expect(overlap(box, { left: 0, right: 10, top: 10, bottom: 15 })).to.equal(false);
    });
});

describe("roomBeside", () => {
    const within = { start: 72, end: 523.3 };
    const at = (left: number, placedAs: Partial<FloatingDrawing> = {}): PlacedDrawing =>
        placedOf(drawingOf({ horizontal: { from: "page", offset: left }, ...placedAs }));

    it("should give a line the room beside a drawing on each side its wrapping lets the text go on", () => {
        // A drawing from 200 to 300 across, and 100 to 150 down
        expect(roomBeside([at(200)], 100, 14, within)).to.deep.equal({
            spans: [
                { start: 72, end: 200 },
                { start: 300, end: 523.3 },
            ],
        });
        expect(roomBeside([at(200, { side: "left" })], 100, 14, within)).to.deep.equal({ spans: [{ start: 72, end: 200 }] });
        expect(roomBeside([at(200, { side: "right" })], 100, 14, within)).to.deep.equal({ spans: [{ start: 300, end: 523.3 }] });
        expect(roomBeside([at(200, { side: "largest" })], 100, 14, within)).to.deep.equal({ spans: [{ start: 300, end: 523.3 }] });
        expect(roomBeside([at(350, { side: "largest" })], 100, 14, within)).to.deep.equal({ spans: [{ start: 72, end: 350 }] });
    });

    it("should leave a line not beside a drawing its room", () => {
        expect(roomBeside([at(200)], 150, 14, within)).to.deep.equal({ spans: [within] });
        expect(roomBeside([at(200)], 86, 14, within)).to.deep.equal({ spans: [within] });
        expect(roomBeside([at(600)], 100, 14, within)).to.deep.equal({ spans: [within] });
    });

    it("should move a line with no room beside a drawing down below it, and below one text goes above and below", () => {
        expect(roomBeside([at(72, { width: 451.3 })], 110, 14, within)).to.deep.equal({ below: 150 });
        expect(roomBeside([at(200, { wrap: "topAndBottom" })], 110, 14, within)).to.deep.equal({ below: 150 });
    });
});
