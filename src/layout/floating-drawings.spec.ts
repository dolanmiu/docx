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
    mayOverlap: true,
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
        // By a share of the inside or outside margin, the left or right one, and the top or bottom one, by whether the page
        // is odd or even (`word-stops-drawings.docx` DR4a to DR4d)
        const uneven = { ...FRAME, section: { ...SECTION, marginLeft: 40, marginRight: 80, marginTop: 20, marginBottom: 60 } };
        const sized = (from: string, oddPage: boolean): readonly number[] => {
            const one = placeDrawing(drawingOf({ relativeWidth: { from, share: 0.5 }, relativeHeight: { from, share: 0.5 } }), {
                ...uneven,
                oddPage,
            }) as Box;
            return [one.right - one.left, one.bottom - one.top];
        };
        expect(sized("insideMargin", true)).to.deep.equal([20, 10]);
        expect(sized("insideMargin", false)).to.deep.equal([40, 30]);
        expect(sized("outsideMargin", true)).to.deep.equal([40, 30]);
        expect(sized("outsideMargin", false)).to.deep.equal([20, 10]);
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
        // Lined up inside or outside against what isn't the margins, or the page down it
        expect(placeDrawing(drawingOf({ horizontal: { from: "page", align: "inside" } }), FRAME)).to.equal(
            "a drawing lined up inside or outside, not against the margins or down the page",
        );
        expect(placeDrawing(drawingOf({ horizontal: { from: "column", align: "outside" } }), FRAME)).to.equal(
            "a drawing lined up inside or outside, not against the margins or down the page",
        );
        expect(placeDrawing(drawingOf({ vertical: { from: "paragraph", align: "inside" } }), FRAME)).to.equal(
            "a drawing lined up inside or outside, not against the margins or down the page",
        );
        // One that doesn't say what it is placed against across the page, in a section of more than one column, and the
        // same in one column
        const unsaid = drawingOf({ horizontal: { from: "margin", offset: 0, inColumns: "why it can't" } });
        expect(placeDrawing(unsaid, { ...FRAME, section: { ...FRAME.section, columns: [200, 200] } })).to.equal("why it can't");
        expect(placeDrawing(unsaid, FRAME)).to.deep.include({ left: 72 });
    });

    it("should line a drawing up inside or outside down the page half the header's or footer's distance from its top or bottom (DR6, PV1)", () => {
        // `word-stops-drawings.docx` DR6a, DR6b, `word-stops-floats2.docx` PV1b to PV1h: at the top of the page inside on odd
        // pages and outside on even ones, half the header's distance below it, and at the bottom otherwise, half the footer's
        // distance above it: 354 twips with the distances of 708, 600 with a header's of 1200
        const { header, footer, pageHeight } = SECTION;
        const top = { left: 72, right: 172, top: header / 2, bottom: header / 2 + 50 };
        const bottom = { left: 72, right: 172, top: pageHeight - footer / 2 - 50, bottom: pageHeight - footer / 2 };
        const even = { ...FRAME, oddPage: false };
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "inside" } }), FRAME)).to.deep.equal(top);
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "outside" } }), even)).to.deep.equal(top);
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "inside" } }), even)).to.deep.equal(bottom);
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "outside" } }), FRAME)).to.deep.equal(bottom);
        const tall = { ...FRAME, section: { ...SECTION, header: 60 } };
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "inside" } }), tall)).to.deep.include({ top: 30 });
        // Against the margins, at their top and bottom (DR6c, DR6d), and lined up top or bottom against the page, at its edges
        expect(placeDrawing(drawingOf({ vertical: { from: "margin", align: "inside" } }), FRAME)).to.deep.include({
            top: SECTION.marginTop,
        });
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "top" } }), FRAME)).to.deep.include({ top: 0 });
        expect(placeDrawing(drawingOf({ vertical: { from: "page", align: "bottom" } }), FRAME)).to.deep.include({ bottom: pageHeight });
    });

    it("should move a VML drawing that would go past the right edge of the page back onto it, and stop at one past its other edges (VM28a, VM28b)", () => {
        const { pageWidth, pageHeight } = SECTION;
        const kept = drawingOf({ keptOnPage: true, horizontal: { from: "insideMargin", offset: 144 } });
        // Inside is the left margin on an odd page, and the right one, where it goes past the page's edge, on an even page
        expect(placeDrawing(kept, FRAME)).to.deep.include({ left: 144, right: 244 });
        expect(placeDrawing(kept, { ...FRAME, oddPage: false })).to.deep.include({ left: pageWidth - 100, right: pageWidth });
        // A DrawingML drawing isn't moved
        expect(
            placeDrawing(drawingOf({ horizontal: { from: "insideMargin", offset: 144 } }), { ...FRAME, oddPage: false }),
        ).to.deep.include({
            left: pageWidth - SECTION.marginRight + 144,
        });
        expect(placeDrawing(drawingOf({ keptOnPage: true, horizontal: { from: "page", offset: -10 } }), FRAME)).to.equal(
            "a VML drawing past an edge of the page other than its right edge",
        );
        expect(placeDrawing(drawingOf({ keptOnPage: true, vertical: { from: "page", offset: pageHeight - 10 } }), FRAME)).to.equal(
            "a VML drawing past an edge of the page other than its right edge",
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

    it("should leave a room narrower than 18 points empty, and move a line with no other below the drawing (FT1d, F13, F14, NR2)", () => {
        // 16.8 points left of the drawing, and 18 right of it
        expect(roomBeside([at(88.8, { width: 416.5 })], 100, 14, within)).to.deep.equal({ spans: [{ start: 505.3, end: 523.3 }] });
        // 16.8 and 9 points: no room, so the line goes below, as Word moves one with 17 and 17.5 points (`word-stops-floats2.docx`
        // NR2a to NR2c)
        expect(roomBeside([at(88.8, { width: 425.5 })], 100, 14, within)).to.deep.equal({ below: 150 });
        // A sliver left by lengths that differ only in their arithmetic is no room, and the line goes below the drawing
        expect(roomBeside([at(72.001, { width: 451.299 })], 100, 14, within)).to.deep.equal({ below: 150 });
    });
});
