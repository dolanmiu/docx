/**
 * Floating shapes whose size or position is a percentage of the page, its margins or the space between them
 * (`wp14:sizeRelH`, `wp14:sizeRelV`, `wp14:pctPosHOffset` and `wp14:pctPosVOffset`), which Word keeps as percentages
 * when the page changes.
 *
 * Reference: [MS-ODRAWXML] 2.3.2, the wordprocessingDrawing 2010 schema
 *
 * @module
 */
// cspell:ignore ODRAWXML
import {
    HorizontalPositionRelativeFrom,
    type IContext,
    type IFloating,
    type IHorizontalPositionOptions,
    type IVerticalPositionOptions,
    type IXmlableObject,
    VerticalPositionRelativeFrom,
    XmlComponent,
} from "docx";

/**
 * A percentage, such as `"100%"`.
 *
 * @publicApi
 */
export type ShapePercentage = `${number}%`;

/**
 * Where a floating shape is across the page: as for an image, but the offset can also be a percentage.
 *
 * @publicApi
 */
export type ShapeHorizontalPosition = Omit<IHorizontalPositionOptions, "offset"> & {
    /**
     * Offset in EMUs from the horizontal base, or a percentage of the base's width, such as `"10%"`. A percentage needs
     * a base of the page, the space between its margins, or one of its margins
     */
    readonly offset?: number | ShapePercentage;
};

/**
 * Where a floating shape is down the page: as for an image, but the offset can also be a percentage.
 *
 * @publicApi
 */
export type ShapeVerticalPosition = Omit<IVerticalPositionOptions, "offset"> & {
    /**
     * Offset in EMUs from the vertical base, or a percentage of the base's height, such as `"10%"`. A percentage needs
     * a base of the page, the space between its margins, or one of its margins
     */
    readonly offset?: number | ShapePercentage;
};

/**
 * What a percentage width is a percentage of.
 *
 * @publicApi
 */
export type ShapeWidthRelativeTo = "betweenMargins" | "page" | "leftMargin" | "rightMargin" | "insideMargin" | "outsideMargin";

/**
 * What a percentage height is a percentage of.
 *
 * @publicApi
 */
export type ShapeHeightRelativeTo = "betweenMargins" | "page" | "topMargin" | "bottomMargin" | "insideMargin" | "outsideMargin";

/**
 * How a shape floats on the page. It takes the options of a floating image, and offsets can also be percentages.
 *
 * @publicApi
 */
export type ShapeFloating = Omit<IFloating, "horizontalPosition" | "verticalPosition"> & {
    readonly horizontalPosition: ShapeHorizontalPosition;
    readonly verticalPosition: ShapeVerticalPosition;
    /** What a percentage `width` or `height` is a percentage of. Default is the space between the margins, where the text goes */
    readonly sizeRelativeTo?: {
        readonly width?: ShapeWidthRelativeTo;
        readonly height?: ShapeHeightRelativeTo;
    };
};

/**
 * The sizes, in pixels, of the areas of the library's default page, A4 with 1-inch margins, which a percentage size or
 * offset is written with for applications that don't read percentages.
 */
const PAGE = { width: 11906 / 15, height: 16838 / 15, margin: 96 };
const BETWEEN_MARGINS = { width: PAGE.width - 2 * PAGE.margin, height: PAGE.height - 2 * PAGE.margin };

// Each relative size's OOXML name (`ST_SizeRelFromH` and `ST_SizeRelFromV`), and the length on the default page
const WIDTH_BASES: Readonly<Record<ShapeWidthRelativeTo, readonly [string, number]>> = {
    betweenMargins: ["margin", BETWEEN_MARGINS.width],
    page: ["page", PAGE.width],
    leftMargin: ["leftMargin", PAGE.margin],
    rightMargin: ["rightMargin", PAGE.margin],
    insideMargin: ["insideMargin", PAGE.margin],
    outsideMargin: ["outsideMargin", PAGE.margin],
};

const HEIGHT_BASES: Readonly<Record<ShapeHeightRelativeTo, readonly [string, number]>> = {
    betweenMargins: ["margin", BETWEEN_MARGINS.height],
    page: ["page", PAGE.height],
    topMargin: ["topMargin", PAGE.margin],
    bottomMargin: ["bottomMargin", PAGE.margin],
    insideMargin: ["insideMargin", PAGE.margin],
    outsideMargin: ["outsideMargin", PAGE.margin],
};

// The width or height of each base a position can be relative to, on the default page, for those a percentage can be of
const POSITION_BASES: Readonly<Record<string, number>> = {
    [HorizontalPositionRelativeFrom.MARGIN]: BETWEEN_MARGINS.width,
    [HorizontalPositionRelativeFrom.PAGE]: PAGE.width,
    [HorizontalPositionRelativeFrom.LEFT_MARGIN]: PAGE.margin,
    [HorizontalPositionRelativeFrom.RIGHT_MARGIN]: PAGE.margin,
    [HorizontalPositionRelativeFrom.INSIDE_MARGIN]: PAGE.margin,
    [HorizontalPositionRelativeFrom.OUTSIDE_MARGIN]: PAGE.margin,
};

const VERTICAL_POSITION_BASES: Readonly<Record<string, number>> = {
    [VerticalPositionRelativeFrom.MARGIN]: BETWEEN_MARGINS.height,
    [VerticalPositionRelativeFrom.PAGE]: PAGE.height,
    [VerticalPositionRelativeFrom.TOP_MARGIN]: PAGE.margin,
    [VerticalPositionRelativeFrom.BOTTOM_MARGIN]: PAGE.margin,
    [VerticalPositionRelativeFrom.INSIDE_MARGIN]: PAGE.margin,
    [VerticalPositionRelativeFrom.OUTSIDE_MARGIN]: PAGE.margin,
};

const EMUS_PER_PIXEL = 9525;

/**
 * Reads a percentage, such as `"50%"`, as a number, such as 50.
 *
 * @returns The number, or nothing if the value is a number of pixels or EMUs
 * @throws If the value is a percentage that isn't a number of 0 or more
 */
export const percentageOf = (value: number | string, option: string): number | undefined => {
    if (typeof value === "number" || !value.endsWith("%")) {
        return undefined;
    }
    const percentage = Number(value.slice(0, -1));
    if (!(value.length > 1 && percentage >= 0)) {
        throw new Error(`Invalid ${option} "${value}". Expected a percentage of 0 or more, such as "50%"`);
    }
    return percentage;
};

/**
 * The size, in pixels, of what a floating shape's percentage width and height are percentages of, on the library's
 * default page.
 */
export const relativeSizeBase = (floating: ShapeFloating): { readonly width: number; readonly height: number } => ({
    width: WIDTH_BASES[floating.sizeRelativeTo?.width ?? "betweenMargins"][1],
    height: HEIGHT_BASES[floating.sizeRelativeTo?.height ?? "betweenMargins"][1],
});

/**
 * An offset in EMUs, for a position given as a percentage: the percentage of the base on the library's default page.
 *
 * @throws If the percentage is of a base it can't be of, such as a column
 */
const offsetOf = (
    offset: number | ShapePercentage | undefined,
    relative: string,
    bases: Readonly<Record<string, number>>,
): number | undefined => {
    const percentage = offset === undefined ? undefined : percentageOf(offset, "offset");
    if (percentage === undefined) {
        return offset as number | undefined;
    }
    if (!(relative in bases)) {
        throw new Error(
            `Invalid offset "${offset}". A percentage offset needs a position relative to the page, the space between its margins, or one of its margins`,
        );
    }
    return Math.round(((bases[relative] * percentage) / 100) * EMUS_PER_PIXEL);
};

/**
 * The floating options for a drawing, with percentage offsets turned into EMUs, as they are on the library's default page.
 *
 * @throws If a percentage offset is of a base it can't be of, such as a column
 */
export const toImageFloating = ({ horizontalPosition, verticalPosition, sizeRelativeTo: _, ...rest }: ShapeFloating): IFloating => ({
    ...rest,
    horizontalPosition: {
        ...horizontalPosition,
        offset: offsetOf(horizontalPosition.offset, horizontalPosition.relative ?? HorizontalPositionRelativeFrom.PAGE, POSITION_BASES),
    },
    verticalPosition: {
        ...verticalPosition,
        offset: offsetOf(verticalPosition.offset, verticalPosition.relative ?? VerticalPositionRelativeFrom.PAGE, VERTICAL_POSITION_BASES),
    },
});

/**
 * The percentages a floating drawing is sized and positioned by, in thousandths of a percent, as OOXML writes them.
 */
type RelativePlacement = {
    readonly width?: { readonly relativeFrom: string; readonly percentage: number };
    readonly height?: { readonly relativeFrom: string; readonly percentage: number };
    readonly horizontal?: number;
    readonly vertical?: number;
};

const thousandths = (percentage: number | undefined): number | undefined =>
    percentage === undefined ? undefined : Math.round(percentage * 1000);

/**
 * A position with a percentage offset, for applications that read the Word 2010 drawing extensions, and its offset in
 * EMUs for those that don't, as Word writes a position that older versions can't read.
 */
const withPercentage = ([attributes, offset]: readonly IXmlableObject[], name: string, percentage: number): readonly IXmlableObject[] => [
    attributes,
    {
        "mc:AlternateContent": [
            { "mc:Choice": [{ _attr: { Requires: "wp14" } }, { [name]: [`${percentage}`] }] },
            { "mc:Fallback": [offset] },
        ],
    },
];

/**
 * Adds the percentages to a formatted drawing: offsets in place of the positions' offsets, and sizes after the graphic,
 * where Word writes them.
 */
const addPercentages = (xml: IXmlableObject, { width, height, horizontal, vertical }: RelativePlacement): IXmlableObject => {
    const anchor = (children: readonly IXmlableObject[]): readonly IXmlableObject[] => [
        ...children.map((child) => {
            if ("wp:positionH" in child && horizontal !== undefined) {
                return { "wp:positionH": withPercentage(child["wp:positionH"], "wp14:pctPosHOffset", horizontal) };
            }
            if ("wp:positionV" in child && vertical !== undefined) {
                return { "wp:positionV": withPercentage(child["wp:positionV"], "wp14:pctPosVOffset", vertical) };
            }
            return child;
        }),
        ...(width
            ? [{ "wp14:sizeRelH": [{ _attr: { relativeFrom: width.relativeFrom } }, { "wp14:pctWidth": [`${width.percentage}`] }] }]
            : []),
        ...(height
            ? [{ "wp14:sizeRelV": [{ _attr: { relativeFrom: height.relativeFrom } }, { "wp14:pctHeight": [`${height.percentage}`] }] }]
            : []),
    ];
    // A floating drawing is one anchor
    const [floating] = xml["w:drawing"] as readonly IXmlableObject[];
    return { "w:drawing": [{ "wp:anchor": anchor(floating["wp:anchor"]) }] };
};

/**
 * A floating drawing with a percentage size or position.
 */
class RelativeDrawing extends XmlComponent {
    public constructor(
        private readonly drawing: XmlComponent,
        private readonly placement: RelativePlacement,
    ) {
        super("w:drawing");
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        return addPercentages(this.drawing.prepForXml(context)!, this.placement);
    }
}

/**
 * Writes a floating drawing's percentage size and position, if it has any, so Word keeps them as percentages.
 *
 * @param drawing - The drawing, with its size and position in pixels and EMUs on the library's default page
 * @param size - The width and height the shape was given
 */
export const withRelativePlacement = (
    drawing: XmlComponent,
    floating: ShapeFloating | undefined,
    size: { readonly width: number | string; readonly height: number | string },
): XmlComponent => {
    if (!floating) {
        return drawing;
    }
    const widthPercentage = percentageOf(size.width, "width");
    const heightPercentage = percentageOf(size.height, "height");
    const placement: RelativePlacement = {
        width:
            widthPercentage === undefined
                ? undefined
                : {
                      relativeFrom: WIDTH_BASES[floating.sizeRelativeTo?.width ?? "betweenMargins"][0],
                      percentage: thousandths(widthPercentage)!,
                  },
        height:
            heightPercentage === undefined
                ? undefined
                : {
                      relativeFrom: HEIGHT_BASES[floating.sizeRelativeTo?.height ?? "betweenMargins"][0],
                      percentage: thousandths(heightPercentage)!,
                  },
        horizontal: thousandths(
            floating.horizontalPosition.offset === undefined ? undefined : percentageOf(floating.horizontalPosition.offset, "offset"),
        ),
        vertical: thousandths(
            floating.verticalPosition.offset === undefined ? undefined : percentageOf(floating.verticalPosition.offset, "offset"),
        ),
    };
    return Object.values(placement).every((value) => value === undefined) ? drawing : new RelativeDrawing(drawing, placement);
};
