/**
 * Where Word puts drawings that text flows around on a page, and the room the lines of text have beside them.
 *
 * @module
 */
import type { DrawingPosition, FloatingDrawing, Section } from "./read-document";

/** A rectangle on a page, in points from its top left corner */
export type Box = { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number };

/** A part of a line beside the drawings on its page, across the page, in points from its left edge */
export type Span = { readonly start: number; readonly end: number };

/**
 * A drawing placed on a page: where it is drawn, and the room it keeps the text out of.
 */
export type PlacedDrawing = {
    readonly drawing: FloatingDrawing;
    /** Where it is drawn, without its effects */
    readonly box: Box;
    /** The room it keeps text out of: its box with its effects and its distances from the text */
    readonly keepOut: Box;
    /** What it is anchored in, to know it again: the block and the item */
    readonly anchor: string;
};

/**
 * What a drawing is placed against on its page: the page and its section's margins, the column, and the paragraph and line
 * it is anchored in, with where its anchor is along the line. Lengths are in points, from the page's top left corner.
 */
export type DrawingFrame = {
    readonly section: Section;
    /** Whether the page is odd, as Word counts the pages, which is where the inside and outside margins are */
    readonly oddPage: boolean;
    readonly column: Span;
    /** The top of the paragraph */
    readonly paragraph: number;
    /** The top of the line the drawing is anchored in, and its height */
    readonly line: { readonly top: number; readonly height: number };
    /** Where its anchor is across the page */
    readonly character: number;
};

/** The start and length of what a drawing is placed against, across or down the page, or why it isn't known */
type Base = { readonly start: number; readonly length: number };

/** What a drawing is placed against across the page */
const acrossBase = (from: string, { section, oddPage, column, character }: DrawingFrame): Base | undefined => {
    const { pageWidth, marginLeft, marginRight } = section;
    const leftMargin = { start: 0, length: marginLeft };
    const rightMargin = { start: pageWidth - marginRight, length: marginRight };
    switch (from) {
        case "page":
            return { start: 0, length: pageWidth };
        case "margin":
            return { start: marginLeft, length: pageWidth - marginLeft - marginRight };
        case "column":
            return { start: column.start, length: column.end - column.start };
        case "character":
            return { start: character, length: 0 };
        case "leftMargin":
            return leftMargin;
        case "rightMargin":
            return rightMargin;
        case "insideMargin":
            return oddPage ? leftMargin : rightMargin;
        case "outsideMargin":
            return oddPage ? rightMargin : leftMargin;
        default:
            return undefined;
    }
};

/**
 * What a drawing is placed against down the page. The inside margin is the top one on odd pages, and the bottom one on even
 * pages, and the outside margin the other (`word-floats.docx` F22)
 */
const downBase = (from: string, { section, oddPage, paragraph, line }: DrawingFrame): Base | undefined => {
    const { pageHeight, marginTop, marginBottom } = section;
    const topMargin = { start: 0, length: marginTop };
    const bottomMargin = { start: pageHeight - marginBottom, length: marginBottom };
    switch (from) {
        case "page":
            return { start: 0, length: pageHeight };
        case "margin":
            return { start: marginTop, length: pageHeight - marginTop - marginBottom };
        case "topMargin":
            return topMargin;
        case "bottomMargin":
            return bottomMargin;
        case "insideMargin":
            return oddPage ? topMargin : bottomMargin;
        case "outsideMargin":
            return oddPage ? bottomMargin : topMargin;
        case "paragraph":
            return { start: paragraph, length: 0 };
        case "line":
            return { start: line.top, length: line.height };
        default:
            return undefined;
    }
};

/**
 * Where a drawing of a size, with the room its effects take before and after it, starts across or down what it is placed
 * against: at a distance or share of it from its start, or lined up with its start, middle or end, with its effects, as
 * Word lines it up (`word-floats.docx` F38b, F38c). Inside is the start on odd pages, and outside the end
 */
const startOf = (
    position: DrawingPosition,
    base: Base,
    size: number,
    before: number,
    after: number,
    oddPage: boolean,
): number | undefined => {
    const { align, offset, share } = position;
    if (align === undefined) {
        return base.start + (offset ?? (share ?? 0) * base.length);
    }
    const lined = align === "inside" ? (oddPage ? "left" : "right") : align === "outside" ? (oddPage ? "right" : "left") : align;
    switch (lined) {
        case "left":
        case "top":
            return base.start + before;
        case "center":
            return base.start + (base.length - size - before - after) / 2 + before;
        case "right":
        case "bottom":
            return base.start + base.length - size - after;
        default:
            return undefined;
    }
};

/** A drawing's size on its section's pages: its own, or a share of what it is sized by */
const sizeOf = (drawing: FloatingDrawing, section: Section): { readonly width: number; readonly height: number } | undefined => {
    const { pageWidth, pageHeight, marginLeft, marginRight, marginTop, marginBottom } = section;
    const widths: Readonly<Record<string, number>> = {
        page: pageWidth,
        margin: pageWidth - marginLeft - marginRight,
        leftMargin: marginLeft,
        rightMargin: marginRight,
    };
    const heights: Readonly<Record<string, number>> = {
        page: pageHeight,
        margin: pageHeight - marginTop - marginBottom,
        topMargin: marginTop,
        bottomMargin: marginBottom,
    };
    const { relativeWidth, relativeHeight } = drawing;
    const width = relativeWidth === undefined ? drawing.width : (widths[relativeWidth.from] ?? Number.NaN) * relativeWidth.share;
    const height = relativeHeight === undefined ? drawing.height : (heights[relativeHeight.from] ?? Number.NaN) * relativeHeight.share;
    return Number.isNaN(width) || Number.isNaN(height) ? undefined : { width, height };
};

/**
 * Where a drawing is drawn on its page, placed against what its positions say, or why that isn't known. A distance from
 * what it is placed against places its own box, without its effects, as the standard says, which Word hasn't been seen
 * doing yet; lined up, its effects are lined up with it.
 */
export const placeDrawing = (drawing: FloatingDrawing, frame: DrawingFrame): Box | string => {
    const size = sizeOf(drawing, frame.section);
    const across = acrossBase(drawing.horizontal.from, frame);
    const down = downBase(drawing.vertical.from, frame);
    if (size === undefined) {
        return "a drawing sized by a share of what isn't followed yet";
    }
    if (across === undefined || down === undefined) {
        return "a drawing placed against what isn't followed yet";
    }
    const { effects } = drawing;
    const left = startOf(drawing.horizontal, across, size.width, effects.left, effects.right, frame.oddPage);
    const top = startOf(drawing.vertical, down, size.height, effects.top, effects.bottom, frame.oddPage);
    return left === undefined || top === undefined
        ? "a drawing lined up in a way not yet followed"
        : { left, right: left + size.width, top, bottom: top + size.height };
};

/** The room a drawing drawn in a box keeps text out of: the box, with its effects and its distances from the text */
export const keepOutOf = ({ effects, distances }: FloatingDrawing, box: Box): Box => ({
    left: box.left - effects.left - distances.left,
    right: box.right + effects.right + distances.right,
    top: box.top - effects.top - distances.top,
    bottom: box.bottom + effects.bottom + distances.bottom,
});

/** Whether two boxes overlap */
export const overlap = (one: Box, other: Box): boolean =>
    one.left < other.right && other.left < one.right && one.top < other.bottom && other.top < one.bottom;

/**
 * The room a line from `top`, `height` tall, has in the room across the page it is in (`within`), beside the drawings
 * on its page: the parts not beside one, from the left, as Word gives a line beside a drawing the room either side of it,
 * the left first (`word-floats.docx` F9). A line is beside a drawing when they overlap at all, with the drawing's effects
 * and its distances from the text, so 5 lines of 268.55 twips are beside a drawing 1328 tall, and 6 beside one 1358
 * tall (F3, F4). The text goes on each side of a drawing its wrapping lets it go on: the left, the right, both, or the
 * larger (F10 to F12). A drawing with its text above and below it takes the line's room across the page. With no room, the
 * line goes down to below the drawings beside it (`below`), as Word moves it (F5, F6, F33).
 */
export const roomBeside = (
    drawings: readonly PlacedDrawing[],
    top: number,
    height: number,
    within: Span,
): { readonly spans: readonly Span[] } | { readonly below: number } => {
    // A drawing beside the line, and across the room it is in: one in a margin, even with text above and below it, leaves
    // the line as it is (`word-floats.docx` F7, F8)
    const beside = drawings.filter(
        ({ keepOut }) => keepOut.top < top + height && top < keepOut.bottom && keepOut.left < within.end && within.start < keepOut.right,
    );
    const spans = beside.reduce<readonly Span[]>(
        (free, { drawing, keepOut }) => {
            const out = keepOutAcross(drawing, keepOut, within);
            return free.flatMap((span) =>
                out.end <= span.start || out.start >= span.end
                    ? [span]
                    : [
                          ...(out.start > span.start ? [{ start: span.start, end: out.start }] : []),
                          ...(out.end < span.end ? [{ start: out.end, end: span.end }] : []),
                      ],
            );
        },
        [within],
    );
    return spans.length > 0 ? { spans } : { below: Math.min(...beside.map(({ keepOut }) => keepOut.bottom)) };
};

/**
 * The room across the page a drawing keeps text out of, in the room a line is in: its own across, and the side of it the
 * text doesn't go on, to the edge of the room, or the line's room for a drawing that text goes above and below
 */
const keepOutAcross = ({ wrap, side }: FloatingDrawing, keepOut: Box, within: Span): Span => {
    if (wrap === "topAndBottom") {
        return within;
    }
    const larger = keepOut.left - within.start >= within.end - keepOut.right ? "left" : "right";
    const textSide = side === "largest" ? larger : side;
    return textSide === "left"
        ? { start: keepOut.left, end: within.end }
        : textSide === "right"
          ? { start: within.start, end: keepOut.right }
          : { start: keepOut.left, end: keepOut.right };
};
