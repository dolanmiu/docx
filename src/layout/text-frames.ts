/**
 * Reads text frames (`w:framePr`): paragraphs Word takes out of the text and puts in a box of their own, placed on the
 * page as a drawing is, which the text after them flows around, such as docx's `frame` and drop caps.
 *
 * Word's PDFs of scripts/layout-probes/word-frames.ts showed a frame laid out as a drawing that text flows around is, at
 * the place and with the distances its properties give: against the page, the margins, the column, or the paragraph
 * after it, at the top of that paragraph's space before (FM7 to FM10, FM11). A drop cap is a frame like any other, as wide
 * as its letter, and the lines beside it are those its box is beside, whatever its number of lines (FM14).
 *
 * @module
 */
import { TWIPS_PER_POINT, type XmlObject, attributesOf, pointsOf } from "../text-layout";
import type { DrawingPosition } from "./read-document";

/**
 * A text frame's properties (`w:framePr`): its size, where it is, and how the text goes round it. Lengths are in points.
 */
export type FrameProperties = {
    /** Its properties as written, which the paragraphs of one frame share */
    readonly key: string;
    /** Its width, or none when it is as wide as its text */
    readonly width?: number;
    /**
     * Its height, and whether that is its height exactly, the least it is, or nothing, as its text sets it. Word takes a
     * height with no rule as the least (FM1, FM2), though the standard's default is auto
     */
    readonly height: number;
    readonly heightRule: "auto" | "atLeast" | "exact";
    readonly horizontal: DrawingPosition;
    readonly vertical: DrawingPosition;
    /** How the text goes round it (`w:wrap`), as written, or none when it isn't */
    readonly wrap?: string;
    /** How far the text keeps from it across the page (`w:hSpace`) and down it (`w:vSpace`) */
    readonly across: number;
    readonly down: number;
};

/** What a frame is placed against across the page (`w:hAnchor`) and down it (`w:vAnchor`), as drawings name them */
const ACROSS: Readonly<Record<string, string>> = { page: "page", margin: "margin", text: "column" };
const DOWN: Readonly<Record<string, string>> = { page: "page", margin: "margin", text: "paragraph" };
const ACROSS_ALIGNS = new Set(["left", "center", "right", "inside", "outside"]);
const DOWN_ALIGNS = new Set(["top", "center", "bottom", "inside", "outside"]);
const HEIGHT_RULES = new Set<FrameProperties["heightRule"]>(["auto", "atLeast", "exact"]);

const twips = (value: unknown): number | undefined => pointsOf(value, TWIPS_PER_POINT);

// Why a frame that doesn't say what it is placed against across the page can't be laid out in columns
const UNSAID_ACROSS = "a text frame that doesn't say what it is placed against, in columns";

/**
 * Where a frame is across or down the page: what it is placed against, lined up with it or at a distance from it, or why
 * it isn't known. One that doesn't say is placed against the margins, as Word places it: across the page, where the
 * margins and the column are the same in one column, so it stops in columns, and down the page, from the top margin
 * rather than the page, as the standard has it (`word-stops-floats.docx` FR6a, FR6b). Lined up inline down the margins,
 * it is at their top (FR6c)
 */
const positionOf = (
    anchor: unknown,
    align: unknown,
    offset: unknown,
    names: Readonly<Record<string, string>>,
    aligns: ReadonlySet<string>,
): DrawingPosition | string => {
    const from = anchor === undefined ? "margin" : names[String(anchor)];
    if (from === undefined) {
        return "a text frame placed against what isn't followed yet";
    }
    const unsaid = anchor === undefined && names === ACROSS ? { inColumns: UNSAID_ACROSS } : {};
    if (align === "inline" && aligns === DOWN_ALIGNS && from === "margin") {
        return { from, align: "top" };
    }
    if (align !== undefined) {
        return aligns.has(String(align)) ? { from, align: String(align), ...unsaid } : "a text frame lined up in a way not yet followed";
    }
    return { from, offset: twips(offset) ?? 0, ...unsaid };
};

/** Reads a paragraph's frame properties (`w:framePr`), or why the frame can't be laid out */
export const readFrameProperties = (element: unknown): FrameProperties | string => {
    const attributes: XmlObject = attributesOf(element);
    const {
        "w:w": width,
        "w:h": height,
        "w:hRule": heightRule = "atLeast",
        "w:hAnchor": hAnchor,
        "w:vAnchor": vAnchor,
        "w:xAlign": xAlign,
        "w:yAlign": yAlign,
        "w:x": x,
        "w:y": y,
        "w:wrap": wrap,
        "w:hSpace": hSpace,
        "w:vSpace": vSpace,
    } = attributes;
    const horizontal = positionOf(hAnchor, xAlign, x, ACROSS, ACROSS_ALIGNS);
    const vertical = positionOf(vAnchor, yAlign, y, DOWN, DOWN_ALIGNS);
    if (!HEIGHT_RULES.has(String(heightRule) as FrameProperties["heightRule"])) {
        return "a text frame of a height rule not yet followed";
    }
    if (typeof horizontal === "string" || typeof vertical === "string") {
        return typeof horizontal === "string" ? horizontal : (vertical as string);
    }
    const given = twips(width);
    return {
        key: JSON.stringify(Object.entries(attributes).sort(([one], [other]) => one.localeCompare(other))),
        ...(given === undefined || given === 0 ? {} : { width: given }),
        height: twips(height) ?? 0,
        heightRule: String(heightRule) as FrameProperties["heightRule"],
        horizontal,
        vertical,
        ...(wrap === undefined ? {} : { wrap: String(wrap) }),
        across: twips(hSpace) ?? 0,
        down: twips(vSpace) ?? 0,
    };
};
