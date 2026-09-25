/**
 * Fills for preset shapes: none, solid, gradient, pattern or picture.
 *
 * @module
 */
import {
    BuilderElement,
    type IContext,
    type ICropOptions,
    type IMediaData,
    type IXmlableObject,
    NextAttributeComponent,
    XmlComponent,
} from "docx";

import { type ShapeColor, type ShapeThemeColor, createShapeColor, isThemeColor } from "./shape-color";
import { percentageValue, positiveFixedAngle } from "./shape-units";
import { createNoFill, createSourceRectangle, createStretch, createSvgBlipExtension } from "../drawing/drawing-parts";
import { type ImageSource, createImageMediaData } from "../picture/image-data";

export type { ImageSource } from "../picture/image-data";

/**
 * A colour stop in a gradient fill.
 *
 * @publicApi
 */
export type GradientStop = {
    /** Where the stop sits along the gradient, from 0 to 100 */
    readonly position: number;
    /** A 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }` */
    readonly color: ShapeColor;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * A solid colour fill.
 *
 * @publicApi
 */
export type SolidShapeFill = {
    readonly type?: "solid";
    /** A 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }` */
    readonly color: ShapeColor;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * The outline a radial gradient spreads out in from the centre.
 *
 * @publicApi
 */
export type GradientPath = "circle" | "rectangle" | "shape";

// OOXML names (`ST_PathShadeType`)
const GRADIENT_PATH_OOXML_NAMES: Readonly<Record<GradientPath, string>> = { circle: "circle", rectangle: "rect", shape: "shape" };

/**
 * A gradient fill. It is linear unless `path` is set.
 *
 * @publicApi
 */
export type GradientShapeFill = {
    readonly type: "gradient";
    /** At least two colour stops */
    readonly stops: readonly GradientStop[];
    /** Direction of a linear gradient in degrees, clockwise from left-to-right. Default is 0 */
    readonly angle?: number;
    /** Makes the gradient radiate from the centre: in a circle, a rectangle, or following the shape's outline */
    readonly path?: GradientPath;
};

/* cspell:disable */
// Each pattern mapped to its OOXML name (`ST_PresetPatternVal`)
const PATTERN_OOXML_NAMES = {
    percent5: "pct5",
    percent10: "pct10",
    percent20: "pct20",
    percent25: "pct25",
    percent30: "pct30",
    percent40: "pct40",
    percent50: "pct50",
    percent60: "pct60",
    percent70: "pct70",
    percent75: "pct75",
    percent80: "pct80",
    percent90: "pct90",
    horizontal: "horz",
    vertical: "vert",
    lightHorizontal: "ltHorz",
    lightVertical: "ltVert",
    darkHorizontal: "dkHorz",
    darkVertical: "dkVert",
    narrowHorizontal: "narHorz",
    narrowVertical: "narVert",
    dashedHorizontal: "dashHorz",
    dashedVertical: "dashVert",
    cross: "cross",
    downwardDiagonal: "dnDiag",
    upwardDiagonal: "upDiag",
    lightDownwardDiagonal: "ltDnDiag",
    lightUpwardDiagonal: "ltUpDiag",
    darkDownwardDiagonal: "dkDnDiag",
    darkUpwardDiagonal: "dkUpDiag",
    wideDownwardDiagonal: "wdDnDiag",
    wideUpwardDiagonal: "wdUpDiag",
    dashedDownwardDiagonal: "dashDnDiag",
    dashedUpwardDiagonal: "dashUpDiag",
    diagonalCross: "diagCross",
    smallCheckerBoard: "smCheck",
    largeCheckerBoard: "lgCheck",
    smallGrid: "smGrid",
    largeGrid: "lgGrid",
    dottedGrid: "dotGrid",
    smallConfetti: "smConfetti",
    largeConfetti: "lgConfetti",
    horizontalBrick: "horzBrick",
    diagonalBrick: "diagBrick",
    solidDiamond: "solidDmnd",
    openDiamond: "openDmnd",
    dottedDiamond: "dotDmnd",
    plaid: "plaid",
    sphere: "sphere",
    weave: "weave",
    divot: "divot",
    shingle: "shingle",
    wave: "wave",
    trellis: "trellis",
    zigZag: "zigZag",
} as const;
/* cspell:enable */

/**
 * A preset pattern, such as `"percent20"` (20% of dots), `"horizontal"` lines or `"smallCheckerBoard"`.
 *
 * @publicApi
 */
export type ShapePattern = keyof typeof PATTERN_OOXML_NAMES;

/**
 * A fill of a repeating pattern of lines or dots in one colour over another.
 *
 * @publicApi
 */
export type PatternShapeFill = {
    readonly type: "pattern";
    /** The pattern, such as `"percent20"`, `"horizontal"` or `"smallCheckerBoard"` */
    readonly pattern: ShapePattern;
    /** The colour of the pattern's lines and dots: a hex colour or a colour of the document's theme. Default is `"000000"` */
    readonly color?: ShapeColor;
    /** The colour of the space behind the pattern: a hex colour or a colour of the document's theme. Default is `"FFFFFF"` */
    readonly backgroundColor?: ShapeColor;
};

/**
 * Where the first tile of a tiled picture is placed. The other tiles are laid out from it.
 *
 * @publicApi
 */
export type PictureTileAlignment = "topLeft" | "top" | "topRight" | "left" | "center" | "right" | "bottomLeft" | "bottom" | "bottomRight";

// OOXML names (`ST_RectAlignment`)
const TILE_ALIGNMENT_OOXML_NAMES: Readonly<Record<PictureTileAlignment, string>> = {
    topLeft: "tl",
    top: "t",
    topRight: "tr",
    left: "l",
    center: "ctr",
    right: "r",
    bottomLeft: "bl",
    bottom: "b",
    bottomRight: "br",
};

/**
 * Which tiles of a tiled picture are mirrored: every other tile across, every other tile down, or both.
 *
 * @publicApi
 */
export type PictureTileMirror = "none" | "horizontal" | "vertical" | "both";

// OOXML names (`ST_TileFlipMode`)
const TILE_MIRROR_OOXML_NAMES: Readonly<Record<PictureTileMirror, string>> = { none: "none", horizontal: "x", vertical: "y", both: "xy" };

/**
 * How a picture is repeated across a shape.
 *
 * @publicApi
 */
export type PictureTile = {
    /** Size of each tile, as a percentage of the picture's own size. Default is 100 */
    readonly scale?: number;
    /** Where the first tile is placed. Default is `"topLeft"` */
    readonly alignment?: PictureTileAlignment;
    /** Mirrors every other tile. Default is `"none"` */
    readonly mirror?: PictureTileMirror;
};

/**
 * A fill of a picture, such as a photo in a circle. The shape's outline crops the picture.
 *
 * @publicApi
 */
export type PictureShapeFill = {
    readonly type: "picture";
    /** The picture: its format and data, as for an `ImageRun`, such as `{ type: "png", data: fs.readFileSync("photo.png") }` */
    readonly image: ImageSource;
    /** Repeats the picture across the shape at its own size, instead of stretching it to fill the shape */
    readonly tile?: PictureTile;
    /** Crops the picture by a percentage of each side, from 0 to 100, before stretching it to fill the shape */
    readonly crop?: ICropOptions;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * How a shape is filled: a hex colour, a colour of the document's theme such as `{ theme: "accent1" }`, `"none"`, or a
 * solid, gradient, pattern or picture fill.
 *
 * @publicApi
 */
export type ShapeFill = string | ShapeThemeColor | SolidShapeFill | GradientShapeFill | PatternShapeFill | PictureShapeFill;

// <xsd:complexType name="CT_GradientStop">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="pos" type="ST_PositiveFixedPercentage" use="required"/>
// </xsd:complexType>
const createGradientStop = ({ position, color, transparency }: GradientStop): XmlComponent =>
    new BuilderElement<{ readonly position: number }>({
        name: "a:gs",
        attributes: {
            position: { key: "pos", value: Math.round(position * 1000) },
        },
        children: [createShapeColor(color, transparency)],
    });

const createLinearShade = (angle: number): XmlComponent =>
    new BuilderElement<{ readonly angle: number }>({
        name: "a:lin",
        attributes: {
            angle: { key: "ang", value: positiveFixedAngle(angle) },
        },
    });

const createPathShade = (path: GradientPath): XmlComponent =>
    new BuilderElement<{ readonly path: string }>({
        name: "a:path",
        attributes: {
            path: { key: "path", value: GRADIENT_PATH_OOXML_NAMES[path] },
        },
        children: [
            // Focus the gradient on the centre of the shape
            new BuilderElement<{ readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }>({
                name: "a:fillToRect",
                attributes: {
                    left: { key: "l", value: 50000 },
                    top: { key: "t", value: 50000 },
                    right: { key: "r", value: 50000 },
                    bottom: { key: "b", value: 50000 },
                },
            }),
        ],
    });

/**
 * Creates an `a:gradFill` element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_GradientFillProperties">
 *   <xsd:sequence>
 *     <xsd:element name="gsLst" type="CT_GradientStopList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_ShadeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tileRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
 *   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @throws If there are fewer than two stops or a stop position is outside 0 to 100
 */
const createGradientFill = ({ stops, angle = 0, path }: GradientShapeFill): XmlComponent => {
    if (stops.length < 2) {
        throw new Error(`Invalid gradient fill. Expected at least 2 stops, got ${stops.length}`);
    }

    const sortedStops = [...stops]
        .map((stop) => ({ ...stop, position: percentageValue(stop.position, "gradient stop position") }))
        .sort((a, b) => a.position - b.position);

    return new BuilderElement<{ readonly rotateWithShape: boolean }>({
        name: "a:gradFill",
        attributes: {
            rotateWithShape: { key: "rotWithShape", value: true },
        },
        children: [
            new BuilderElement({
                name: "a:gsLst",
                children: sortedStops.map(createGradientStop),
            }),
            path ? createPathShade(path) : createLinearShade(angle),
        ],
    });
};

/**
 * Creates an `a:pattFill` element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PatternFillProperties">
 *   <xsd:sequence>
 *     <xsd:element name="fgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="bgClr" type="CT_Color" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="prst" type="ST_PresetPatternVal" use="optional"/>
 * </xsd:complexType>
 * ```
 */
const createPatternFill = ({ pattern, color = "000000", backgroundColor = "FFFFFF" }: PatternShapeFill): XmlComponent =>
    new BuilderElement<{ readonly pattern: string }>({
        name: "a:pattFill",
        attributes: {
            pattern: { key: "prst", value: PATTERN_OOXML_NAMES[pattern] },
        },
        children: [
            new BuilderElement({ name: "a:fgClr", children: [createShapeColor(color)] }),
            new BuilderElement({ name: "a:bgClr", children: [createShapeColor(backgroundColor)] }),
        ],
    });

// <xsd:complexType name="CT_TileInfoProperties">
//     <xsd:attribute name="tx" type="ST_Coordinate" use="optional"/>
//     <xsd:attribute name="ty" type="ST_Coordinate" use="optional"/>
//     <xsd:attribute name="sx" type="ST_Percentage" use="optional"/>
//     <xsd:attribute name="sy" type="ST_Percentage" use="optional"/>
//     <xsd:attribute name="flip" type="ST_TileFlipMode" use="optional" default="none"/>
//     <xsd:attribute name="algn" type="ST_RectAlignment" use="optional"/>
// </xsd:complexType>
const createTile = ({ scale = 100, alignment = "topLeft", mirror = "none" }: PictureTile): XmlComponent => {
    if (!(scale > 0)) {
        throw new Error(`Invalid picture tile scale ${scale}. Expected a percentage greater than 0`);
    }
    return new BuilderElement<{
        readonly offsetX: number;
        readonly offsetY: number;
        readonly scaleX: number;
        readonly scaleY: number;
        readonly mirror: string;
        readonly alignment: string;
    }>({
        name: "a:tile",
        attributes: {
            offsetX: { key: "tx", value: 0 },
            offsetY: { key: "ty", value: 0 },
            scaleX: { key: "sx", value: Math.round(scale * 1000) },
            scaleY: { key: "sy", value: Math.round(scale * 1000) },
            mirror: { key: "flip", value: TILE_MIRROR_OOXML_NAMES[mirror] },
            alignment: { key: "algn", value: TILE_ALIGNMENT_OOXML_NAMES[alignment] },
        },
    });
};

// <xsd:complexType name="CT_Blip">
//     <xsd:sequence>
//         <xsd:choice minOccurs="0" maxOccurs="unbounded">
//             ...
//             <xsd:element name="alphaModFix" type="CT_AlphaModulateFixedEffect"/>
//             ...
//         </xsd:choice>
//         <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attribute ref="r:embed"/>
//     ...
// </xsd:complexType>
const createPictureBlip = (mediaData: IMediaData, transparency?: number): XmlComponent =>
    new BuilderElement<{ readonly embed: string }>({
        name: "a:blip",
        attributes: {
            // Replaced by the relationship id of the picture when the document is packed
            embed: { key: "r:embed", value: `rId{${mediaData.type === "svg" ? mediaData.fallback.fileName : mediaData.fileName}}` },
        },
        children: [
            ...(transparency
                ? [
                      new BuilderElement<{ readonly amount: number }>({
                          name: "a:alphaModFix",
                          attributes: {
                              // The picture's opacity in thousandths of a percent
                              amount: { key: "amt", value: Math.round((100 - percentageValue(transparency, "transparency")) * 1000) },
                          },
                      }),
                  ]
                : []),
            ...(mediaData.type === "svg" ? [createSvgBlipExtension(mediaData)] : []),
        ],
    });

/**
 * An `a:blipFill` element: a picture that fills a shape.
 *
 * The picture is added to the document's media when the shape is written, so it is stored in the package
 * and given a relationship from the part (document, header or footer) the shape is in.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_BlipFillProperties">
 *   <xsd:sequence>
 *     <xsd:element name="blip" type="CT_Blip" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="srcRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_FillModeProperties" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="dpi" type="xsd:unsignedInt" use="optional"/>
 *   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 */
class PictureFill extends XmlComponent {
    private readonly mediaData: IMediaData;

    public constructor({ image, tile, crop, transparency }: Omit<PictureShapeFill, "type">, name: string) {
        super(name);

        // The picture's size is set by the shape, so its media data has none of its own
        this.mediaData = createImageMediaData(image, { pixels: { x: 0, y: 0 }, emus: { x: 0, y: 0 } });

        // The picture turns with the shape when the shape is rotated
        this.root.push(
            new NextAttributeComponent<{ readonly rotateWithShape: boolean }>({ rotateWithShape: { key: "rotWithShape", value: true } }),
        );
        this.root.push(createPictureBlip(this.mediaData, transparency));
        this.root.push(createSourceRectangle(tile ? undefined : crop));
        this.root.push(tile ? createTile(tile) : createStretch());
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.mediaData.fileName, this.mediaData);
        if (this.mediaData.type === "svg") {
            context.file.Media.addImage(this.mediaData.fallback.fileName, this.mediaData.fallback);
        }

        return super.prepForXml(context);
    }
}

/**
 * Creates a fill of a picture: `a:blipFill` in a shape, or `pic:blipFill` in a picture. The picture is added to the
 * document's media when it is written.
 */
export const createPictureFill = (fill: Omit<PictureShapeFill, "type">, name: "a:blipFill" | "pic:blipFill" = "a:blipFill"): XmlComponent =>
    new PictureFill(fill, name);

/**
 * Creates the fill element for a preset shape.
 *
 * - `undefined` or `"none"` writes `<a:noFill/>`
 * - A hex colour, a colour of the theme or a solid fill writes `<a:solidFill>`
 * - A gradient fill writes `<a:gradFill>`
 * - A pattern fill writes `<a:pattFill>`
 * - A picture fill writes `<a:blipFill>`, and adds the picture to the document when it is written
 */
export const createShapeFill = (fill: ShapeFill = "none"): XmlComponent => {
    if (fill === "none") {
        return createNoFill();
    }

    if (typeof fill === "string" || isThemeColor(fill)) {
        return new BuilderElement({ name: "a:solidFill", children: [createShapeColor(fill)] });
    }

    if (fill.type === "gradient") {
        return createGradientFill(fill);
    }

    if (fill.type === "pattern") {
        return createPatternFill(fill);
    }

    return fill.type === "picture"
        ? createPictureFill(fill)
        : new BuilderElement({ name: "a:solidFill", children: [createShapeColor(fill.color, fill.transparency)] });
};
