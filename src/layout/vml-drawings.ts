/**
 * Reads VML drawings (`w:pict`), which docx writes for its text boxes and documents made by older versions of Word have
 * for their shapes and pictures: the box one in the line takes, and where one that text flows around is, as the floating
 * drawings of DrawingML are laid out.
 *
 * @module
 */
// cspell:ignore roundrect polyline shapetype textbox txbx anchorx anchory allowoverlap wrapcoords
import { type XmlObject, attributesOf, childrenOf, find, isObject } from "../text-layout";
import type { DrawingPosition, FloatingDrawing, Sides } from "./read-document";

// The elements of VML that draw a shape, rather than define a type of one (`v:shapetype`)
const SHAPES = new Set(["v:shape", "v:rect", "v:roundrect", "v:oval", "v:line", "v:polyline", "v:arc", "v:curve", "v:image", "v:group"]);

// Points in each unit a VML style gives lengths in, of those whose reading in Word is known: CSS's, as VML has them,
// with 96 pixels to the inch. A number with no unit is in pixels too (`word-stops-vml-shapes.docx` VM29c: a shape of
// 100 by 20 is 75 by 15 points). Word drew a shape of 10 by 2 ems 8 by 1.6 points (VM29b), by no rule found, so ems stop
const POINTS_PER_UNIT: Readonly<Record<string, number>> = { pt: 1, in: 72, cm: 72 / 2.54, mm: 72 / 25.4, pc: 12, px: 0.75 };

/** The weight of a VML shape's outline when it has one and doesn't say, in points: Word draws it 0.72 points wide */
export const DEFAULT_OUTLINE = 0.72;

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
 * something. Undefined when it isn't given.
 */
export const vmlLength = (value: string | undefined): number | string | undefined => {
    if (value === undefined) {
        return undefined;
    }
    const length = /^(-?\d*\.?\d+)([a-z%]*)$/i.exec(value.trim());
    const amount = Number(length?.[1]);
    const unit = length?.[2].toLowerCase() || "px";
    if (length === null || Number.isNaN(amount)) {
        return "a VML drawing with a length that isn't a number";
    }
    return unit in POINTS_PER_UNIT ? amount * POINTS_PER_UNIT[unit] : "a VML drawing with a length in units not yet followed";
};

/**
 * The outline of a VML shape: whether it has one (`stroked`), which it has unless it says not, its weight in points
 * (`strokeweight`), 0.72 when it doesn't say, and whether it is drawn, which a hidden shape's isn't. Or why its weight
 * isn't known
 */
export const vmlOutline = (
    attributes: XmlObject,
    style: ReadonlyMap<string, string>,
): { readonly weight: number; readonly drawn: boolean } | string => {
    const stroked = !isVmlFalse(attributes.stroked ?? "t");
    const weight = stroked
        ? (vmlLength(attributes.strokeweight === undefined ? undefined : String(attributes.strokeweight)) ?? DEFAULT_OUTLINE)
        : 0;
    return typeof weight === "string" ? weight : { weight, drawn: stroked && style.get("visibility") !== "hidden" };
};

/**
 * The room an outline of a weight takes beyond a VML shape that text flows around, on each side, in points: half of it,
 * which Word takes in whole points, down on the left and up on the right, so 0.72 and 1 point take none on the left and
 * one on the right, and 3 points take one and two (`word-stops-vml-shapes.docx` VM24a, VM24b, `word-stops-vml-text-boxes.docx`
 * VM24c). Above and below, half of it, as the line 1.3 twips below a text box's outline of 0.72 points isn't beside it
 * (VM24c)
 */
export const outlineEffects = (weight: number): Sides =>
    weight === 0
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : { top: weight / 2, bottom: weight / 2, left: Math.floor(weight / 2), right: Math.ceil(weight / 2) };

/**
 * Whether any shape of a VML group (`v:group`) has an outline that is drawn, or one whose weight isn't known. A group
 * draws no outline of its own (`word-stops-vml-shapes.docx` VM29f)
 */
export const groupOutlined = (group: XmlObject): boolean =>
    childrenOf(group[Object.keys(group)[0]])
        .filter((child) => SHAPES.has(Object.keys(child)[0]))
        .some((child) => {
            const [name] = Object.keys(child);
            if (name === "v:group") {
                return groupOutlined(child);
            }
            const outline = vmlOutline(attributesOf(child[name]), readVmlStyle(attributesOf(child[name]).style));
            return typeof outline === "string" || outline.drawn;
        });

/** What a VML drawing is: a shape and its style, the wrapping of the text round it, and the text in it, if it has some */
export type VmlShape = {
    /** The shape's element, such as `v:shape` or `v:rect` */
    readonly element: XmlObject;
    /** Its attributes, with those of the type of shape it is (`v:shapetype`) where it doesn't give its own */
    readonly attributes: XmlObject;
    readonly style: ReadonlyMap<string, string>;
    /** The text box's content (`w:txbxContent`), when it is a text box */
    readonly text?: readonly unknown[];
    /** The style of its text box (`v:textbox`), when it is one */
    readonly textStyle?: ReadonlyMap<string, string>;
};

/**
 * The shape a VML drawing (`w:pict`) draws, past the types of shapes it defines (`v:shapetype`), or why it can't be laid
 * out: more than one. One of no shape, such as a `w:pict` of a shape type alone, draws nothing (`word-stops-vml-shape-type.docx`
 * VM29e). A shape of a type (`type="#id"`) has the type's attributes where it doesn't give its own, as Word's type for
 * pictures gives them no outline (`word-stops-vml-pictures2.docx` VM30a to VM30h)
 */
export const vmlShapeOf = (pict: unknown): VmlShape | undefined | string => {
    const children = childrenOf(pict);
    const shapes = children.filter((child) => SHAPES.has(Object.keys(child)[0]));
    if (shapes.length !== 1) {
        return shapes.length === 0 ? undefined : "a VML drawing of more than one shape";
    }
    const [element] = shapes;
    const [name] = Object.keys(element);
    const own = attributesOf(element[name]);
    const type = children.find((child) => "v:shapetype" in child && `#${attributesOf(child["v:shapetype"]).id}` === own.type);
    const inherited = Object.fromEntries(Object.entries(attributesOf(type?.["v:shapetype"])).filter(([key]) => key !== "id"));
    const textbox = find(childrenOf(element[name]), "v:textbox");
    const content = find(childrenOf(textbox), "w:txbxContent");
    return {
        element,
        attributes: { ...inherited, ...own },
        style: readVmlStyle(own.style),
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
 * The wrapping of the text round a VML shape (`w10:wrap`'s type), as DrawingML names it. Word wraps the text tightly
 * round a rectangle, and through it, as it wraps it square, but one point nearer on the right: 160 twips from a shape
 * with a distance of 180 (`word-vml.docx` VM14, `word-stops-vml-shapes.docx` VM27a, VM27b)
 */
const WRAPS: Readonly<Record<string, FloatingDrawing["wrap"]>> = {
    square: "square",
    tight: "square",
    through: "square",
    topAndBottom: "topAndBottom",
};
// How much nearer the text is on the right of a shape wrapped tightly or through, in points
const TIGHTER_RIGHT = 1;
/** The sides of a VML shape the text goes on (`w10:wrap`'s side), as DrawingML names them */
const SIDES: Readonly<Record<string, FloatingDrawing["side"]>> = { both: "bothSides", left: "left", right: "right", largest: "largest" };
// Shares of what a shape is sized by (`mso-width-percent`) are in tenths of a percent
const TENTHS_OF_A_PERCENT = 1000;

/**
 * Where a VML shape is across or down the page, from its style: what it is placed against, which is the column and the
 * paragraph when it doesn't say, lined up with it, or at a distance from it, its margin-left or margin-top, or its left
 * or top, which Word reads as those (`word-stops-vml-shapes.docx` VM27f). Or why it isn't known
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
    if (style.has(side) && style.has(`margin-${side}`)) {
        // Which of the two Word places it by isn't known
        return "a VML drawing placed by its left or top and its margins";
    }
    const offset = vmlLength(style.get(`margin-${side}`) ?? style.get(side) ?? "0");
    return typeof offset === "string" ? offset : { from, offset: offset! };
};

/**
 * A VML shape's width or height as a share of what it is sized by (`mso-width-percent`, `mso-width-relative`), or why
 * that isn't known: Word has been seen sizing one by a share of the margins only (`word-stops-vml-shapes.docx` VM27e)
 */
const shareOf = (
    style: ReadonlyMap<string, string>,
    dimension: "width" | "height",
): { readonly from: string; readonly share: number } | undefined | string => {
    const percent = style.get(`mso-${dimension}-percent`);
    if (percent === undefined) {
        return undefined;
    }
    const share = Number(percent) / TENTHS_OF_A_PERCENT;
    const relative = style.get(`mso-${dimension}-relative`) ?? "margin";
    return Number.isNaN(share)
        ? "a VML drawing with a length that isn't a number"
        : relative === "margin"
          ? { from: "margin", share }
          : "a VML drawing sized by a share of what it is placed against, other than the margins";
};

/**
 * Reads a VML shape that text flows around, from its style, its wrapping (`w10:wrap`) and its outline, whose weight is
 * `outline`, or why it can't be followed: one turned, one wrapped tightly round a polygon of its own (`wrapcoords`), or
 * placed or wrapped in a way not yet followed. The text keeps 9 points from it on the left and right, and none above and
 * below, as VML has it, where its style doesn't say (`word-vml.docx` VM9). Word moves one that would go past the right edge
 * of the page back onto it (`word-stops-vml-shapes.docx` VM28a, VM28b)
 */
export const readVmlFloating = (shape: VmlShape, wrap: XmlObject, width: number, height: number, outline = 0): FloatingDrawing | string => {
    const { style } = shape;
    const attributes = attributesOf(wrap);
    const shapeAttributes = shape.attributes;
    const wrapType = String(attributes.type);
    const type = WRAPS[wrapType];
    const side = SIDES[String(attributes.side ?? "both")];
    if (type === undefined || side === undefined) {
        return "a VML drawing that text flows around in a way not yet followed";
    }
    const tighter = wrapType === "tight" || wrapType === "through";
    if (tighter && shapeAttributes.wrapcoords !== undefined) {
        // Word keeps the text from the polygon's edge at each line's top (VM27c), in a way not yet followed
        return "a VML drawing wrapped tightly round a polygon of its own";
    }
    if (Number(style.get("rotation") ?? 0) !== 0) {
        // Word wraps the text round the box of the turned shape, about 7 twips nearer than that box (VM27d), by a rule not
        // yet found
        return "a turned VML drawing that text flows around";
    }
    const horizontal = positionOf(style, "horizontal", attributes.anchorx === undefined ? undefined : String(attributes.anchorx));
    const vertical = positionOf(style, "vertical", attributes.anchory === undefined ? undefined : String(attributes.anchory));
    const distance = (name: string, otherwise: number): number | string => vmlLength(style.get(`mso-wrap-distance-${name}`)) ?? otherwise;
    const distances = [distance("top", 0), distance("bottom", 0), distance("left", 9), distance("right", 9)];
    const shares = [shareOf(style, "width"), shareOf(style, "height")];
    const unknown = [horizontal, vertical, ...distances, ...shares].find((value): value is string => typeof value === "string");
    if (unknown !== undefined) {
        return unknown;
    }
    const [top, bottom, left, right] = distances as readonly number[];
    const [relativeWidth, relativeHeight] = shares as readonly ({ readonly from: string; readonly share: number } | undefined)[];
    return {
        wrap: type,
        side,
        width,
        height,
        ...(relativeWidth === undefined ? {} : { relativeWidth }),
        ...(relativeHeight === undefined ? {} : { relativeHeight }),
        effects: outlineEffects(outline),
        distances: { top, bottom, left, right: tighter ? Math.max(0, right - TIGHTER_RIGHT) : right },
        horizontal: horizontal as DrawingPosition,
        vertical: vertical as DrawingPosition,
        // Whether it may overlap other drawings (`o:allowoverlap`), which VML lets it unless it says not, as DrawingML's
        // `allowOverlap` does: Word wraps the text round a VML shape as round a DrawingML one (VM9 to VM11, VM15), keeping it
        // out of all the room of those that may overlap, and moving one that may not out of the way, where the layout stops
        mayOverlap: !isVmlFalse(shapeAttributes["o:allowoverlap"] ?? "t"),
        keptOnPage: true,
    };
};
