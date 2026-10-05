/**
 * Reads VML drawings (`w:pict`), which docx writes for its text boxes and documents made by older versions of Word have
 * for their shapes and pictures: the box one in the line takes, and where one that text flows around is, as the floating
 * drawings of DrawingML are laid out.
 *
 * @module
 */
// cspell:ignore roundrect polyline shapetype textbox txbx anchorx anchory allowoverlap
import { type XmlObject, attributesOf, childrenOf, find, isObject } from "../text-layout";
import type { DrawingPosition, FloatingDrawing } from "./read-document";

// The elements of VML that draw a shape, rather than define a type of one (`v:shapetype`)
const SHAPES = new Set(["v:shape", "v:rect", "v:roundrect", "v:oval", "v:line", "v:polyline", "v:arc", "v:curve", "v:image", "v:group"]);

// Points in each unit a VML style gives lengths in, of those whose reading in Word is known: CSS's, as VML has them,
// with 96 pixels to the inch
const POINTS_PER_UNIT: Readonly<Record<string, number>> = { pt: 1, in: 72, cm: 72 / 2.54, mm: 72 / 25.4, pc: 12, px: 0.75 };

/** Whether a VML true or false value is false: "f", "false", or 0 */
export const isVmlFalse = (value: unknown): boolean => ["f", "false", "0"].includes(String(value).trim().toLowerCase());

/** The properties of a VML style, such as `width:100pt;position:absolute`, by their names in lower case */
export const readVmlStyle = (style: unknown): ReadonlyMap<string, string> =>
    new Map(
        String(style ?? "")
            .split(";")
            .map((declaration) => declaration.split(":"))
            .filter((parts) => parts.length === 2 && parts[0].trim() !== "")
            .map(([name, value]) => [name.trim().toLowerCase(), value.trim()] as const),
    );

/**
 * A length of a VML style in points, or why it isn't known: one in ems, of a font the style doesn't name, or a share of
 * something, or a number with no unit, which isn't 0. Undefined when it isn't given.
 */
export const vmlLength = (value: string | undefined): number | string | undefined => {
    if (value === undefined) {
        return undefined;
    }
    const length = /^(-?\d*\.?\d+)([a-z%]*)$/i.exec(value.trim());
    const amount = Number(length?.[1]);
    const unit = length?.[2].toLowerCase() ?? "";
    if (length === null || Number.isNaN(amount)) {
        return "a VML drawing with a length that isn't a number";
    }
    if (unit === "" && amount === 0) {
        return 0;
    }
    return unit in POINTS_PER_UNIT ? amount * POINTS_PER_UNIT[unit] : "a VML drawing with a length in units not yet followed";
};

/** What a VML drawing is: a shape and its style, the wrapping of the text round it, and the text in it, if it has some */
export type VmlShape = {
    /** The shape's element, such as `v:shape` or `v:rect` */
    readonly element: XmlObject;
    readonly style: ReadonlyMap<string, string>;
    /** The text box's content (`w:txbxContent`), when it is a text box */
    readonly text?: readonly unknown[];
    /** The style of its text box (`v:textbox`), when it is one */
    readonly textStyle?: ReadonlyMap<string, string>;
};

/**
 * The shape a VML drawing (`w:pict`) draws, past the types of shapes it defines (`v:shapetype`), or why it can't be laid
 * out: none, or more than one
 */
export const vmlShapeOf = (pict: unknown): VmlShape | string => {
    const shapes = childrenOf(pict).filter((child) => SHAPES.has(Object.keys(child)[0]));
    if (shapes.length !== 1) {
        return shapes.length === 0 ? "a VML drawing with no shape" : "a VML drawing of more than one shape";
    }
    const [element] = shapes;
    const [name] = Object.keys(element);
    const textbox = find(childrenOf(element[name]), "v:textbox");
    const content = find(childrenOf(textbox), "w:txbxContent");
    return {
        element,
        style: readVmlStyle(attributesOf(element[name]).style),
        ...(textbox === undefined ? {} : { textStyle: readVmlStyle(attributesOf(textbox).style) }),
        ...(content === undefined ? {} : { text: childrenOf(content).filter(isObject) }),
    };
};

/** What a VML shape is placed against across the page (`mso-position-horizontal-relative`), as DrawingML names it */
const ACROSS: ReadonlyMap<string, string> = new Map([
    ["margin", "margin"],
    ["page", "page"],
    ["text", "column"],
    ["char", "character"],
    ["left-margin-area", "leftMargin"],
    ["right-margin-area", "rightMargin"],
    ["inner-margin-area", "insideMargin"],
    ["outer-margin-area", "outsideMargin"],
]);
/**
 * What a VML shape is placed against down the page (`mso-position-vertical-relative`), as DrawingML names it. Word places
 * one against "paragraph", which VML writes as "text", against its paragraph (`word-vml.docx` VM9, VM10)
 */
const DOWN: ReadonlyMap<string, string> = new Map([
    ["margin", "margin"],
    ["page", "page"],
    ["text", "paragraph"],
    ["paragraph", "paragraph"],
    ["line", "line"],
    ["top-margin-area", "topMargin"],
    ["bottom-margin-area", "bottomMargin"],
    ["inner-margin-area", "insideMargin"],
    ["outer-margin-area", "outsideMargin"],
]);
const ACROSS_ALIGNS = new Set(["left", "center", "right", "inside", "outside"]);
const DOWN_ALIGNS = new Set(["top", "center", "bottom", "inside", "outside"]);

/**
 * The wrapping of the text round a VML shape (`w10:wrap`'s type), as DrawingML names it, of those Word has been seen to lay
 * out as DrawingML's: square, and above and below only. Word wraps tightly round a rectangle closer than square wrapping
 * does, in a way not yet followed (`word-vml.docx` VM14)
 */
const WRAPS: Readonly<Record<string, FloatingDrawing["wrap"]>> = { square: "square", topAndBottom: "topAndBottom" };
/** The sides of a VML shape the text goes on (`w10:wrap`'s side), as DrawingML names them */
const SIDES: Readonly<Record<string, FloatingDrawing["side"]>> = { both: "bothSides", left: "left", right: "right", largest: "largest" };

/**
 * Where a VML shape is across or down the page, from its style: what it is placed against, which is the column and the
 * paragraph when it doesn't say, lined up with it, or at a distance from it, its margin-left or margin-top. Or why it
 * isn't known
 */
const positionOf = (
    style: ReadonlyMap<string, string>,
    direction: "horizontal" | "vertical",
    anchor: string | undefined,
): DrawingPosition | string => {
    const names = direction === "horizontal" ? ACROSS : DOWN;
    const relative = style.get(`mso-position-${direction}-relative`) ?? anchor ?? "text";
    const from = names.get(relative);
    const align = style.get(`mso-position-${direction}`) ?? "absolute";
    if (from === undefined) {
        return "a VML drawing placed against what isn't followed yet";
    }
    if (align !== "absolute") {
        return (direction === "horizontal" ? ACROSS_ALIGNS : DOWN_ALIGNS).has(align)
            ? { from, align }
            : "a VML drawing lined up in a way not yet followed";
    }
    const side = direction === "horizontal" ? "left" : "top";
    if (style.has(side)) {
        // Word places a shape by its margins, and how it places one by its left or top isn't known
        return "a VML drawing placed by its left or top";
    }
    const offset = vmlLength(style.get(`margin-${side}`) ?? "0");
    return typeof offset === "string" ? offset : { from, offset: offset! };
};

/**
 * Reads a VML shape that text flows around, from its style and its wrapping (`w10:wrap`), or why it can't be followed:
 * one turned, sized by a share of something, or placed or wrapped in a way not yet followed. The text keeps 9 points from
 * it on the left and right, and none above and below, as VML has it, where its style doesn't say (`word-vml.docx` VM9).
 */
export const readVmlFloating = (shape: VmlShape, wrap: XmlObject, width: number, height: number): FloatingDrawing | string => {
    const { style } = shape;
    const attributes = attributesOf(wrap);
    const type = WRAPS[String(attributes.type)];
    const side = SIDES[String(attributes.side ?? "both")];
    if (type === undefined || side === undefined) {
        return "a VML drawing that text flows around in a way not yet followed";
    }
    if (Number(style.get("rotation") ?? 0) !== 0) {
        return "a turned VML drawing that text flows around";
    }
    if (style.has("mso-width-percent") || style.has("mso-height-percent")) {
        return "a VML drawing sized by a share of what it is placed against";
    }
    const horizontal = positionOf(style, "horizontal", attributes.anchorx === undefined ? undefined : String(attributes.anchorx));
    const vertical = positionOf(style, "vertical", attributes.anchory === undefined ? undefined : String(attributes.anchory));
    const distance = (name: string, otherwise: number): number | string => vmlLength(style.get(`mso-wrap-distance-${name}`)) ?? otherwise;
    const distances = [distance("top", 0), distance("bottom", 0), distance("left", 9), distance("right", 9)];
    const unknown = [horizontal, vertical, ...distances].find((value): value is string => typeof value === "string");
    if (unknown !== undefined) {
        return unknown;
    }
    const [top, bottom, left, right] = distances as readonly number[];
    return {
        wrap: type,
        side,
        width,
        height,
        effects: { top: 0, bottom: 0, left: 0, right: 0 },
        distances: { top, bottom, left, right },
        horizontal: horizontal as DrawingPosition,
        vertical: vertical as DrawingPosition,
        // Whether it may overlap other drawings (`o:allowoverlap`), which VML lets it unless it says not, as DrawingML's
        // `allowOverlap` does: Word wraps the text round a VML shape as round a DrawingML one (VM9 to VM11, VM15), keeping it
        // out of all the room of those that may overlap, and moving one that may not out of the way, where the layout stops
        mayOverlap: !isVmlFalse(attributesOf(shape.element[Object.keys(shape.element)[0]])["o:allowoverlap"] ?? "t"),
    };
};
