import { DocPropertiesOptions } from 'docx';
import { DrawingLinkOptions } from 'docx';
import { ICropOptions } from 'docx';
import { IFloating } from 'docx';
import { IHorizontalPositionOptions } from 'docx';
import { IMediaTransformation } from 'docx';
import { IRunPropertiesOptions } from 'docx';
import { IVerticalPositionOptions } from 'docx';
import { Paragraph } from 'docx';
import { Run } from 'docx';
import { ThemeColor } from 'docx';
import { ThemeColorName } from 'docx';

/**
 * An arrowhead at one end of a line: a style, or a style with a size.
 *
 * @publicApi
 */
export declare type Arrowhead = ArrowheadType | {
    readonly type: ArrowheadType;
    /** Width of the arrowhead. Default is `"medium"` */
    readonly width?: ArrowheadSize;
    /** Length of the arrowhead. Default is `"medium"` */
    readonly length?: ArrowheadSize;
};

/**
 * The size of an arrowhead relative to the line width.
 *
 * @publicApi
 */
export declare type ArrowheadSize = "small" | "medium" | "large";

/**
 * The style of an arrowhead (`ST_LineEndType`).
 *
 * @publicApi
 */
export declare type ArrowheadType = "triangle" | "stealth" | "diamond" | "oval" | "arrow";

/**
 * One end of a connector: the `id` of the shape it attaches to, or the `id` with a `side` or `point` of the shape.
 * Without either, the connector attaches to the side that faces the shape at its other end.
 *
 * @publicApi
 */
export declare type ConnectorEnd = string | {
    /** The `id` of the shape */
    readonly id: string;
    /** The side of the shape to attach to */
    readonly side?: ConnectorSide;
    /**
     * Attaches to the connection point nearest this point, such as `{ x: 0, y: 100 }` for the one nearest the
     * bottom-left corner. On a shape without connection points, the connector ends at this point
     */
    readonly point?: ConnectorPoint;
};

/**
 * Text on a connector, in a box centred on its route.
 *
 * @publicApi
 */
export declare type ConnectorLabel = {
    /** The text, or paragraphs for text with formatting */
    readonly text: string | readonly Paragraph[];
    /**
     * Where the label goes along the route. `"start"` and `"end"` put it just clear of the shape at that end, such as
     * `"Yes"` and `"No"` beside a decision. A label that would sit on a shape moves along the route until it doesn't.
     * Default is `"middle"`
     */
    readonly position?: ConnectorLabelPosition;
    /** Width of the label's box in pixels. Default fits the text, from the widths of common fonts */
    readonly width?: number;
    /** Height of the label's box in pixels. Default fits the text */
    readonly height?: number;
    /** The label's background, such as `"FFFFFF"` to hide the line behind the text. Default is none */
    readonly fill?: ShapeFill;
    /** The label's outline. Default is none */
    readonly line?: ShapeLine;
};

/**
 * Where a label goes along a connector's route: near where it starts, in the middle, or near where it ends.
 *
 * @publicApi
 */
export declare type ConnectorLabelPosition = "start" | "middle" | "end";

/**
 * A point on a shape, as percentages of the shape's width and height before it is rotated or flipped:
 * `{ x: 0, y: 0 }` is the top-left corner and `{ x: 100, y: 100 }` the bottom-right corner.
 *
 * @publicApi
 */
export declare type ConnectorPoint = {
    /** From 0 (the left edge) to 100 (the right edge) */
    readonly x: number;
    /** From 0 (the top edge) to 100 (the bottom edge) */
    readonly y: number;
};

/**
 * How a connector gets from one shape to the other: in a straight line, with right-angled bends, or with curves.
 *
 * @publicApi
 */
export declare type ConnectorRoute = "straight" | "elbow" | "curved";

/**
 * A side of a shape that a connector can attach to.
 *
 * @publicApi
 */
export declare type ConnectorSide = "top" | "right" | "bottom" | "left";

/**
 * A dash pattern of your own: dashes and gaps, repeated along the line.
 *
 * @publicApi
 */
export declare type CustomLineDash = readonly {
    /** Length of the dash, in multiples of the line width */
    readonly length: number;
    /** Length of the gap after the dash, in multiples of the line width */
    readonly gap: number;
}[];

/**
 * A point of a custom shape that connectors attach to, in the units of its paths.
 *
 * @publicApi
 */
export declare type CustomShapeConnectionPoint = {
    readonly x: number;
    readonly y: number;
    /**
     * The side of the shape the point faces. Connectors leave the point towards it, and a connector's end with this
     * `side` attaches here. Default is the side the point is nearest, as a share of the shape's width and height
     */
    readonly side?: ConnectorSide;
};

/**
 * The outline of a custom shape, and where its text and connection points go.
 *
 * @publicApi
 */
export declare type CustomShapeGeometry = {
    /**
     * Where the text goes, in the units of the paths, such as the body of a speech bubble without its tail. Default is
     * the whole shape
     */
    readonly textArea?: CustomShapeTextArea;
    /**
     * The points connectors attach to, in the units of the paths. Default is every corner and end of the paths
     */
    readonly connectionPoints?: readonly CustomShapeConnectionPoint[];
} & ({
    /**
     * The outline of the shape as SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"` for a triangle.
     * It can use the commands M, L, H, V, C, S, Q, T, A and Z, in any units: the path is scaled so the
     * box around it fills the shape. A closed part of the path inside another part is a hole in it
     */
    readonly path: string;
    readonly paths?: undefined;
} | {
    /**
     * Several paths, in the same units, each with its own fill and line. The box around all of them is scaled to
     * fill the shape. Later paths are drawn over earlier ones
     */
    readonly paths: readonly CustomShapePath[];
    readonly path?: undefined;
});

/**
 * One of the paths of a custom shape. Each path is filled with the shape's `fill` and outlined with its `line`, on its
 * own, so paths can overlap without cutting holes in each other.
 *
 * @publicApi
 */
export declare type CustomShapePath = {
    /** SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"`, in the same units as the shape's other paths */
    readonly path: string;
    /** How the path is filled. Default is `true`, the shape's `fill` */
    readonly fill?: CustomShapePathFill;
    /** Whether the shape's `line` is drawn along the path. Default is `true` */
    readonly line?: boolean;
};

/**
 * How a path of a custom shape is filled: with the shape's `fill` (`true`), not at all (`false`), or with the shape's
 * fill made lighter or darker, as Word's preset shapes shade the top of a cube or the inside of a can.
 *
 * @publicApi
 */
export declare type CustomShapePathFill = boolean | "lighter" | "slightlyLighter" | "darker" | "slightlyDarker";

/**
 * A box in a custom shape, in the units of its paths.
 *
 * @publicApi
 */
export declare type CustomShapeTextArea = {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};

/**
 * The outline a radial gradient spreads out in from the centre.
 *
 * @publicApi
 */
export declare type GradientPath = "circle" | "rectangle" | "shape";

/**
 * A gradient fill. It is linear unless `path` is set.
 *
 * @publicApi
 */
export declare type GradientShapeFill = {
    readonly type: "gradient";
    /** At least two colour stops */
    readonly stops: readonly GradientStop[];
    /** Direction of a linear gradient in degrees, clockwise from left-to-right. Default is 0 */
    readonly angle?: number;
    /** Makes the gradient radiate from the centre: in a circle, a rectangle, or following the shape's outline */
    readonly path?: GradientPath;
};

/**
 * A colour stop in a gradient fill.
 *
 * @publicApi
 */
export declare type GradientStop = {
    /** Where the stop sits along the gradient, from 0 to 100 */
    readonly position: number;
    /** A 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }` */
    readonly color: ShapeColor;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * A picture: its format and data.
 *
 * @publicApi
 */
export declare type ImageSource = RasterImageSource | SvgImageSource;

/**
 * Image data: a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string.
 */
declare type ImageSourceData = Buffer | string | Uint8Array | ArrayBuffer;

/**
 * A shape, picture, group or connector on a canvas. It takes the same options as a child of a {@link ShapeGroupRun}.
 *
 * @see {@link ShapeCanvasRun}
 * @publicApi
 */
export declare type IShapeCanvasChildOptions = IShapeGroupChildOptions;

/**
 * Options for creating a drawing canvas.
 *
 * @see {@link ShapeCanvasRun}
 * @publicApi
 */
export declare type IShapeCanvasOptions = DrawingLinkOptions & {
    /** The shapes, pictures and groups on the canvas, and the connectors between them */
    readonly children: readonly IShapeCanvasChildOptions[];
    /**
     * Size of the canvas in pixels. Defaults to reaching from the top-left corner to the right and bottom
     * of the shapes, including their lines and effects, so an `offset` leaves space above and to the left of a shape.
     * The shapes are not scaled.
     */
    readonly transformation?: {
        readonly width: number;
        readonly height: number;
    };
    /** The canvas's background. Default is none */
    readonly fill?: ShapeFill;
    /** The canvas's outline. Default is none */
    readonly line?: ShapeLine;
    /**
     * Places the shapes, pictures and groups that have no `offset`: in levels along their connectors like a flowchart,
     * as a tree like an org chart, or in a grid
     */
    readonly layout?: ShapeLayout;
    /** Floats the canvas on the page instead of placing it inline with text */
    readonly floating?: IFloating;
    /**
     * Whether to write the same diagram as a group too, for applications that can't draw canvases, such as Apple Pages.
     * Default is `true`. Without it, the canvas takes up half as much of the document, and those applications draw nothing
     */
    readonly fallback?: boolean;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
    /** Formatting of the run the canvas is in, such as `position` to raise or lower it from the text's baseline */
    readonly run?: IRunPropertiesOptions;
};

/**
 * A connector between two shapes in a {@link ShapeGroupRun} or {@link ShapeCanvasRun}.
 *
 * The connector is drawn from one shape to the other, so it doesn't need a size or position.
 * On a {@link ShapeCanvasRun}, Word keeps it attached when either shape is moved.
 *
 * When several connectors with arrowheads meet at the same point of a shape with straight sides, such as a rectangle,
 * or several connectors join the same two shapes, their ends are spread out along the side so they don't overlap.
 *
 * @publicApi
 */
export declare type IShapeConnectorOptions = {
    readonly type: "connector";
    /** Where the connector starts */
    readonly from: ConnectorEnd;
    /** Where the connector ends */
    readonly to: ConnectorEnd;
    /**
     * A straight line, right-angled bends, or curves. Default is `"straight"`, or `"elbow"` when a straight line
     * would go through another shape
     */
    readonly route?: ConnectorRoute;
    /** How far, in pixels, an elbow or curved connector goes past a shape before it turns. Default is 24 (a quarter of an inch) */
    readonly margin?: number;
    /** The connector's line, including any arrowheads. `startArrow` is at `from` and `endArrow` at `to`. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /**
     * Text on the connector, such as `"Yes"`, in a box centred on the route. The box is a separate
     * shape, so Word doesn't move it when the connector moves
     */
    readonly label?: string | ConnectorLabel;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * A shape, picture, group or connector inside a {@link ShapeGroupRun} or {@link ShapeCanvasRun}.
 *
 * A shape takes the options of a {@link ShapeRun} except `floating`. `transformation.offset` positions it,
 * in pixels, unless a `layout` places it, and `id` names it so connectors can attach to it.
 *
 * @publicApi
 */
export declare type IShapeGroupChildOptions = WithPresetShape<ShapeBaseOptions & {
    /** A name that connectors use to attach to this shape. It must be unique within the group or canvas */
    readonly id?: string;
    /** The lane of the flow the shape goes in, by its name. See `ShapeFlowLayout.lanes` */
    readonly lane?: string;
}> | IShapeConnectorOptions | IShapePictureOptions | IShapeNestedGroupOptions;

/**
 * Options for creating a group of shapes.
 *
 * @see {@link ShapeGroupRun}
 * @publicApi
 */
export declare type IShapeGroupOptions = DrawingLinkOptions & {
    /** The shapes, pictures and groups in the group, and the connectors between them */
    readonly children: readonly IShapeGroupChildOptions[];
    /**
     * Size of the group in pixels, with optional rotation and flip. Defaults to the size of
     * the box around the children. A different size scales every shape in the group.
     */
    readonly transformation?: IMediaTransformation;
    /**
     * Places the shapes, pictures and groups that have no `offset`: in levels along their connectors like a flowchart,
     * as a tree like an org chart, or in a grid
     */
    readonly layout?: ShapeLayout;
    /** Floats the group on the page instead of placing it inline with text */
    readonly floating?: IFloating;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
    /** Formatting of the run the group is in, such as `position` to raise or lower it from the text's baseline */
    readonly run?: IRunPropertiesOptions;
};

/**
 * A group of shapes inside a {@link ShapeGroupRun} or {@link ShapeCanvasRun}, which moves, scales and rotates as one.
 *
 * Its children are positioned relative to each other, like the children of a `ShapeGroupRun`, and `transformation.offset`
 * places the group's top-left corner. Connectors in the group can only join shapes in the group, but connectors
 * outside it can attach to the shapes in it.
 *
 * @publicApi
 */
export declare type IShapeNestedGroupOptions = DrawingLinkOptions & {
    readonly type: "group";
    /** The shapes, pictures, groups and connectors in the group */
    readonly children: readonly IShapeGroupChildOptions[];
    /**
     * Position and size of the group in pixels, with optional rotation (degrees) and flip. The size defaults to the
     * box around the children, and a different size scales every child
     */
    readonly transformation?: Omit<IMediaTransformation, "width" | "height"> & {
        readonly width?: number;
        readonly height?: number;
    };
    /** Places the children that have no `offset`, such as in a flowchart, tree or grid */
    readonly layout?: ShapeLayout;
    /** The lane of the flow the group goes in, by its name. See `ShapeFlowLayout.lanes` */
    readonly lane?: string;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * Options for creating a shape.
 *
 * `adjustments` depends on `type`: each shape has its own, such as `cornerRadius` for a `"roundedRectangle"`
 * or `startAngle` and `endAngle` for a `"pie"`.
 *
 * @see {@link ShapeRun}
 * @publicApi
 */
export declare type IShapeOptions = WithPresetShape<ShapeBaseOptions & {
    /**
     * Floats the shape on the page instead of placing it inline with text. A floating shape's size and offsets can be
     * percentages of the page, its margins or the space between them
     */
    readonly floating?: ShapeFloating;
    /**
     * The name of a text flow the shape is in: text that flows from one shape to the next, such as an article that
     * continues on another page. The first shape of the flow in the document holds the text, from its `text` and
     * `children`, and the text that doesn't fit flows on into the next shape of the flow, and so on
     */
    readonly textFlow?: string;
    /** Formatting of the run the shape is in, such as `position` to raise or lower it from the text's baseline */
    readonly run?: IRunPropertiesOptions;
}>;

/**
 * A picture in a {@link ShapeGroupRun} or {@link ShapeCanvasRun}. Connectors can attach to the middle of its sides.
 *
 * @publicApi
 */
export declare type IShapePictureOptions = DrawingLinkOptions & {
    readonly type: "picture";
    /** The picture: its format and data, as for an `ImageRun`, such as `{ type: "png", data: fs.readFileSync("logo.png") }` */
    readonly image: ImageSource;
    /** Size in pixels, with optional rotation (degrees) and flip. `offset` positions the picture, in pixels */
    readonly transformation: IMediaTransformation;
    /** A name that connectors use to attach to this picture. It must be unique within the group or canvas */
    readonly id?: string;
    /** The lane of the flow the picture goes in, by its name. See `ShapeFlowLayout.lanes` */
    readonly lane?: string;
    /** Crops the picture by a percentage of each side, from 0 to 100 */
    readonly crop?: ICropOptions;
    /** An outline around the picture. Default is none */
    readonly line?: ShapeLine;
    /** Shadows, glow, soft edges and reflection */
    readonly effects?: ShapeEffects;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

declare const LINE_DASH_OOXML_NAMES: {
    readonly solid: "solid";
    readonly dot: "dot";
    readonly dash: "dash";
    readonly longDash: "lgDash";
    readonly dashDot: "dashDot";
    readonly longDashDot: "lgDashDot";
    readonly longDashDotDot: "lgDashDotDot";
    readonly shortDash: "sysDash";
    readonly shortDot: "sysDot";
    readonly shortDashDot: "sysDashDot";
    readonly shortDashDotDot: "sysDashDotDot";
};

/**
 * A preset dash pattern.
 *
 * @publicApi
 */
export declare type LineDash = keyof typeof LINE_DASH_OOXML_NAMES;

declare const PATTERN_OOXML_NAMES: {
    readonly percent5: "pct5";
    readonly percent10: "pct10";
    readonly percent20: "pct20";
    readonly percent25: "pct25";
    readonly percent30: "pct30";
    readonly percent40: "pct40";
    readonly percent50: "pct50";
    readonly percent60: "pct60";
    readonly percent70: "pct70";
    readonly percent75: "pct75";
    readonly percent80: "pct80";
    readonly percent90: "pct90";
    readonly horizontal: "horz";
    readonly vertical: "vert";
    readonly lightHorizontal: "ltHorz";
    readonly lightVertical: "ltVert";
    readonly darkHorizontal: "dkHorz";
    readonly darkVertical: "dkVert";
    readonly narrowHorizontal: "narHorz";
    readonly narrowVertical: "narVert";
    readonly dashedHorizontal: "dashHorz";
    readonly dashedVertical: "dashVert";
    readonly cross: "cross";
    readonly downwardDiagonal: "dnDiag";
    readonly upwardDiagonal: "upDiag";
    readonly lightDownwardDiagonal: "ltDnDiag";
    readonly lightUpwardDiagonal: "ltUpDiag";
    readonly darkDownwardDiagonal: "dkDnDiag";
    readonly darkUpwardDiagonal: "dkUpDiag";
    readonly wideDownwardDiagonal: "wdDnDiag";
    readonly wideUpwardDiagonal: "wdUpDiag";
    readonly dashedDownwardDiagonal: "dashDnDiag";
    readonly dashedUpwardDiagonal: "dashUpDiag";
    readonly diagonalCross: "diagCross";
    readonly smallCheckerBoard: "smCheck";
    readonly largeCheckerBoard: "lgCheck";
    readonly smallGrid: "smGrid";
    readonly largeGrid: "lgGrid";
    readonly dottedGrid: "dotGrid";
    readonly smallConfetti: "smConfetti";
    readonly largeConfetti: "lgConfetti";
    readonly horizontalBrick: "horzBrick";
    readonly diagonalBrick: "diagBrick";
    readonly solidDiamond: "solidDmnd";
    readonly openDiamond: "openDmnd";
    readonly dottedDiamond: "dotDmnd";
    readonly plaid: "plaid";
    readonly sphere: "sphere";
    readonly weave: "weave";
    readonly divot: "divot";
    readonly shingle: "shingle";
    readonly wave: "wave";
    readonly trellis: "trellis";
    readonly zigZag: "zigZag";
};

/**
 * A fill of a repeating pattern of lines or dots in one colour over another.
 *
 * @publicApi
 */
export declare type PatternShapeFill = {
    readonly type: "pattern";
    /** The pattern, such as `"percent20"`, `"horizontal"` or `"smallCheckerBoard"` */
    readonly pattern: ShapePattern;
    /** The colour of the pattern's lines and dots: a hex colour or a colour of the document's theme. Default is `"000000"` */
    readonly color?: ShapeColor;
    /** The colour of the space behind the pattern: a hex colour or a colour of the document's theme. Default is `"FFFFFF"` */
    readonly backgroundColor?: ShapeColor;
};

/**
 * A fill of a picture, such as a photo in a circle. The shape's outline crops the picture.
 *
 * @publicApi
 */
export declare type PictureShapeFill = {
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
 * How a picture is repeated across a shape.
 *
 * @publicApi
 */
export declare type PictureTile = {
    /** Size of each tile, as a percentage of the picture's own size. Default is 100 */
    readonly scale?: number;
    /** Where the first tile is placed. Default is `"topLeft"` */
    readonly alignment?: PictureTileAlignment;
    /** Mirrors every other tile. Default is `"none"` */
    readonly mirror?: PictureTileMirror;
};

/**
 * Where the first tile of a tiled picture is placed. The other tiles are laid out from it.
 *
 * @publicApi
 */
export declare type PictureTileAlignment = "topLeft" | "top" | "topRight" | "left" | "center" | "right" | "bottomLeft" | "bottom" | "bottomRight";

/**
 * Which tiles of a tiled picture are mirrored: every other tile across, every other tile down, or both.
 *
 * @publicApi
 */
export declare type PictureTileMirror = "none" | "horizontal" | "vertical" | "both";

/**
 * Every preset shape, by the name this library gives it, mapped to its name in OOXML (`a:prstGeom/@prst`).
 * The OOXML names are often abbreviated (`roundRect`) or numbered (`ribbon2`), so the library uses names
 * that say what the shape is.
 */
declare const PRESET_SHAPE_OOXML_NAMES: {
    readonly line: "line";
    readonly inverseLine: "lineInv";
    readonly straightConnector: "straightConnector1";
    readonly elbowConnectorOneBend: "bentConnector2";
    readonly elbowConnector: "bentConnector3";
    readonly elbowConnectorThreeBends: "bentConnector4";
    readonly elbowConnectorFourBends: "bentConnector5";
    readonly curvedConnectorOneBend: "curvedConnector2";
    readonly curvedConnector: "curvedConnector3";
    readonly curvedConnectorThreeBends: "curvedConnector4";
    readonly curvedConnectorFourBends: "curvedConnector5";
    readonly triangle: "triangle";
    readonly rightTriangle: "rtTriangle";
    readonly diamond: "diamond";
    readonly parallelogram: "parallelogram";
    readonly trapezoid: "trapezoid";
    readonly nonIsoscelesTrapezoid: "nonIsoscelesTrapezoid";
    readonly pentagon: "pentagon";
    readonly hexagon: "hexagon";
    readonly heptagon: "heptagon";
    readonly octagon: "octagon";
    readonly decagon: "decagon";
    readonly dodecagon: "dodecagon";
    readonly ellipse: "ellipse";
    readonly teardrop: "teardrop";
    readonly pieWedge: "pieWedge";
    readonly pie: "pie";
    readonly blockArc: "blockArc";
    readonly donut: "donut";
    readonly noSymbol: "noSmoking";
    readonly chord: "chord";
    readonly arc: "arc";
    readonly frame: "frame";
    readonly halfFrame: "halfFrame";
    readonly lShape: "corner";
    readonly diagonalStripe: "diagStripe";
    readonly cross: "plus";
    readonly plaque: "plaque";
    readonly cylinder: "can";
    readonly cube: "cube";
    readonly beveledRectangle: "bevel";
    readonly foldedCorner: "foldedCorner";
    readonly smileyFace: "smileyFace";
    readonly heart: "heart";
    readonly lightningBolt: "lightningBolt";
    readonly sun: "sun";
    readonly moon: "moon";
    readonly cloud: "cloud";
    readonly leftBracket: "leftBracket";
    readonly rightBracket: "rightBracket";
    readonly leftBrace: "leftBrace";
    readonly rightBrace: "rightBrace";
    readonly bracketPair: "bracketPair";
    readonly bracePair: "bracePair";
    readonly rectangle: "rect";
    readonly roundedRectangle: "roundRect";
    readonly roundedCornerRectangle: "round1Rect";
    readonly topRoundedCornersRectangle: "round2SameRect";
    readonly diagonalRoundedCornersRectangle: "round2DiagRect";
    readonly snippedCornerRectangle: "snip1Rect";
    readonly topSnippedCornersRectangle: "snip2SameRect";
    readonly diagonalSnippedCornersRectangle: "snip2DiagRect";
    readonly roundedAndSnippedCornersRectangle: "snipRoundRect";
    readonly rightArrow: "rightArrow";
    readonly leftArrow: "leftArrow";
    readonly upArrow: "upArrow";
    readonly downArrow: "downArrow";
    readonly leftRightArrow: "leftRightArrow";
    readonly upDownArrow: "upDownArrow";
    readonly quadArrow: "quadArrow";
    readonly leftRightUpArrow: "leftRightUpArrow";
    readonly bentArrow: "bentArrow";
    readonly uTurnArrow: "uturnArrow";
    readonly leftUpArrow: "leftUpArrow";
    readonly bentUpArrow: "bentUpArrow";
    readonly curvedRightArrow: "curvedRightArrow";
    readonly curvedLeftArrow: "curvedLeftArrow";
    readonly curvedUpArrow: "curvedUpArrow";
    readonly curvedDownArrow: "curvedDownArrow";
    readonly stripedRightArrow: "stripedRightArrow";
    readonly notchedRightArrow: "notchedRightArrow";
    readonly pentagonArrow: "homePlate";
    readonly chevron: "chevron";
    readonly rightArrowCallout: "rightArrowCallout";
    readonly downArrowCallout: "downArrowCallout";
    readonly leftArrowCallout: "leftArrowCallout";
    readonly upArrowCallout: "upArrowCallout";
    readonly leftRightArrowCallout: "leftRightArrowCallout";
    readonly upDownArrowCallout: "upDownArrowCallout";
    readonly quadArrowCallout: "quadArrowCallout";
    readonly circularArrow: "circularArrow";
    readonly leftCircularArrow: "leftCircularArrow";
    readonly leftRightCircularArrow: "leftRightCircularArrow";
    readonly swooshArrow: "swooshArrow";
    readonly mathPlus: "mathPlus";
    readonly mathMinus: "mathMinus";
    readonly mathMultiply: "mathMultiply";
    readonly mathDivide: "mathDivide";
    readonly mathEqual: "mathEqual";
    readonly mathNotEqual: "mathNotEqual";
    readonly flowChartProcess: "flowChartProcess";
    readonly flowChartAlternateProcess: "flowChartAlternateProcess";
    readonly flowChartDecision: "flowChartDecision";
    readonly flowChartInputOutput: "flowChartInputOutput";
    readonly flowChartPredefinedProcess: "flowChartPredefinedProcess";
    readonly flowChartInternalStorage: "flowChartInternalStorage";
    readonly flowChartDocument: "flowChartDocument";
    readonly flowChartMultidocument: "flowChartMultidocument";
    readonly flowChartTerminator: "flowChartTerminator";
    readonly flowChartPreparation: "flowChartPreparation";
    readonly flowChartManualInput: "flowChartManualInput";
    readonly flowChartManualOperation: "flowChartManualOperation";
    readonly flowChartConnector: "flowChartConnector";
    readonly flowChartOffpageConnector: "flowChartOffpageConnector";
    readonly flowChartPunchedCard: "flowChartPunchedCard";
    readonly flowChartPunchedTape: "flowChartPunchedTape";
    readonly flowChartSummingJunction: "flowChartSummingJunction";
    readonly flowChartOr: "flowChartOr";
    readonly flowChartCollate: "flowChartCollate";
    readonly flowChartSort: "flowChartSort";
    readonly flowChartExtract: "flowChartExtract";
    readonly flowChartMerge: "flowChartMerge";
    readonly flowChartOfflineStorage: "flowChartOfflineStorage";
    readonly flowChartOnlineStorage: "flowChartOnlineStorage";
    readonly flowChartDelay: "flowChartDelay";
    readonly flowChartMagneticTape: "flowChartMagneticTape";
    readonly flowChartMagneticDisk: "flowChartMagneticDisk";
    readonly flowChartMagneticDrum: "flowChartMagneticDrum";
    readonly flowChartDisplay: "flowChartDisplay";
    readonly explosion12: "irregularSeal1";
    readonly explosion14: "irregularSeal2";
    readonly star4: "star4";
    readonly star5: "star5";
    readonly star6: "star6";
    readonly star7: "star7";
    readonly star8: "star8";
    readonly star10: "star10";
    readonly star12: "star12";
    readonly star16: "star16";
    readonly star24: "star24";
    readonly star32: "star32";
    readonly ribbonUp: "ribbon2";
    readonly ribbonDown: "ribbon";
    readonly curvedRibbonUp: "ellipseRibbon2";
    readonly curvedRibbonDown: "ellipseRibbon";
    readonly leftRightRibbon: "leftRightRibbon";
    readonly verticalScroll: "verticalScroll";
    readonly horizontalScroll: "horizontalScroll";
    readonly wave: "wave";
    readonly doubleWave: "doubleWave";
    readonly rectangularCallout: "wedgeRectCallout";
    readonly roundedRectangularCallout: "wedgeRoundRectCallout";
    readonly ellipticalCallout: "wedgeEllipseCallout";
    readonly cloudCallout: "cloudCallout";
    readonly lineCallout: "borderCallout1";
    readonly bentLineCallout: "borderCallout2";
    readonly doubleBentLineCallout: "borderCallout3";
    readonly lineCalloutWithAccentBar: "accentCallout1";
    readonly bentLineCalloutWithAccentBar: "accentCallout2";
    readonly doubleBentLineCalloutWithAccentBar: "accentCallout3";
    readonly lineCalloutWithNoBorder: "callout1";
    readonly bentLineCalloutWithNoBorder: "callout2";
    readonly doubleBentLineCalloutWithNoBorder: "callout3";
    readonly lineCalloutWithBorderAndAccentBar: "accentBorderCallout1";
    readonly bentLineCalloutWithBorderAndAccentBar: "accentBorderCallout2";
    readonly doubleBentLineCalloutWithBorderAndAccentBar: "accentBorderCallout3";
    readonly actionButtonBlank: "actionButtonBlank";
    readonly actionButtonHome: "actionButtonHome";
    readonly actionButtonHelp: "actionButtonHelp";
    readonly actionButtonInformation: "actionButtonInformation";
    readonly actionButtonForwardNext: "actionButtonForwardNext";
    readonly actionButtonBackPrevious: "actionButtonBackPrevious";
    readonly actionButtonEnd: "actionButtonEnd";
    readonly actionButtonBeginning: "actionButtonBeginning";
    readonly actionButtonReturn: "actionButtonReturn";
    readonly actionButtonDocument: "actionButtonDocument";
    readonly actionButtonSound: "actionButtonSound";
    readonly actionButtonMovie: "actionButtonMovie";
    readonly gear6: "gear6";
    readonly gear9: "gear9";
    readonly funnel: "funnel";
    readonly cornerTabs: "cornerTabs";
    readonly squareTabs: "squareTabs";
    readonly plaqueTabs: "plaqueTabs";
    readonly chartX: "chartX";
    readonly chartStar: "chartStar";
    readonly chartPlus: "chartPlus";
};

/**
 * The adjustments of each preset shape that has them, by shape type.
 *
 * Angles are measured clockwise from 3 o'clock. Word keeps each value within the range the shape
 * allows, so a value that is too large acts like the largest allowed value.
 *
 * @publicApi
 */
export declare type PresetShapeAdjustments = {
    readonly arc: {
        /** Angle where the arc starts, in degrees clockwise from 3 o'clock. Default `270` */
        readonly startAngle?: number;
        /** Angle where the arc ends, in degrees clockwise from 3 o'clock. Default `0` */
        readonly endAngle?: number;
    };
    readonly bentArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Outer radius of the bend, as a percent of the shorter side. Default `43.75` */
        readonly bendRadius?: number;
    };
    readonly bentLineCallout: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly bentLineCalloutWithAccentBar: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly bentLineCalloutWithBorderAndAccentBar: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly bentLineCalloutWithNoBorder: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** Bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly bendX?: number;
        /** Bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly bendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-46.667` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly bentUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly beveledRectangle: {
        /** Width of the bevelled edge, as a percent of the shorter side. Default `12.5` */
        readonly bevelWidth?: number;
    };
    readonly blockArc: {
        /** Angle where the arc starts, in degrees clockwise from 3 o'clock. Default `180` */
        readonly startAngle?: number;
        /** Angle where the arc ends, in degrees clockwise from 3 o'clock. Default `0` */
        readonly endAngle?: number;
        /** Thickness of the arc, as a percent of the shorter side. Default `25` */
        readonly thickness?: number;
    };
    readonly bracePair: {
        /** Radius of the curves in the braces, as a percent of the shorter side. Default `8.333` */
        readonly curveRadius?: number;
    };
    readonly bracketPair: {
        /** Radius of the corners of the brackets, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly chevron: {
        /** Length of the point, as a percent of the shorter side. Default `50` */
        readonly pointLength?: number;
    };
    readonly chord: {
        /** Angle where the chord starts, in degrees clockwise from 3 o'clock. Default `45` */
        readonly startAngle?: number;
        /** Angle where the chord ends, in degrees clockwise from 3 o'clock. Default `270` */
        readonly endAngle?: number;
    };
    readonly circularArrow: {
        /** Thickness of the arrow's body, as a percent of the shorter side. Default `12.5` */
        readonly shaftThickness?: number;
        /** Angle the arrowhead covers, in degrees. Default `19.039` */
        readonly headAngle?: number;
        /** Angle where the arrow ends, in degrees clockwise from 3 o'clock. Default `340.961` */
        readonly endAngle?: number;
        /** Angle where the arrow starts, in degrees clockwise from 3 o'clock. Default `180` */
        readonly startAngle?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headWidth?: number;
    };
    readonly cloudCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
    };
    readonly cross: {
        /** Size of the cut-away corners, as a percent of the shorter side. Larger values make thinner arms. Default `25` */
        readonly cornerSize?: number;
    };
    readonly cube: {
        /** Depth of the top and side faces, as a percent of the shorter side. Default `25` */
        readonly depth?: number;
    };
    readonly curvedConnector: {
        /** Where the connector bends, from the left edge, as a percent of the width. Default `50` */
        readonly bendX?: number;
    };
    readonly curvedConnectorFourBends: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
        /** Where the connector bends a third time, from the left edge, as a percent of the width. Default `50` */
        readonly thirdBendX?: number;
    };
    readonly curvedConnectorThreeBends: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
    };
    readonly curvedDownArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly curvedLeftArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly curvedRibbonDown: {
        /** Thickness of the ribbon, as a percent of the height. Default `25` */
        readonly thickness?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
        /** How far the ribbon curves, as a percent of the height. Default `12.5` */
        readonly curveDepth?: number;
    };
    readonly curvedRibbonUp: {
        /** Thickness of the ribbon, as a percent of the height. Default `25` */
        readonly thickness?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
        /** How far the ribbon curves, as a percent of the height. Default `12.5` */
        readonly curveDepth?: number;
    };
    readonly curvedRightArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly curvedUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly cylinder: {
        /** Height of the elliptical top, as a percent of the shorter side. Default `25` */
        readonly topHeight?: number;
    };
    readonly diagonalRoundedCornersRectangle: {
        /** Radius of the top-left and bottom-right corners, as a percent of the shorter side. Default `16.667` */
        readonly topLeftBottomRightRadius?: number;
        /** Radius of the top-right and bottom-left corners, as a percent of the shorter side. Default `0` */
        readonly topRightBottomLeftRadius?: number;
    };
    readonly diagonalSnippedCornersRectangle: {
        /** Size of the cut top-left and bottom-right corners, as a percent of the shorter side. Default `0` */
        readonly topLeftBottomRightSize?: number;
        /** Size of the cut top-right and bottom-left corners, as a percent of the shorter side. Default `16.667` */
        readonly topRightBottomLeftSize?: number;
    };
    readonly diagonalStripe: {
        /** How much of the top and left edges the stripe covers, as a percent of the width and height. Default `50` */
        readonly stripeWidth?: number;
    };
    readonly donut: {
        /** Thickness of the ring, as a percent of the shorter side. Default `25` */
        readonly thickness?: number;
    };
    readonly doubleBentLineCallout: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly doubleBentLineCalloutWithAccentBar: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly doubleBentLineCalloutWithBorderAndAccentBar: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly doubleBentLineCalloutWithNoBorder: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** First bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly firstBendX?: number;
        /** First bend in the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly firstBendY?: number;
        /** Second bend in the callout line, from the left edge, as a percent of the width. Default `-16.667` */
        readonly secondBendX?: number;
        /** Second bend in the callout line, from the top edge, as a percent of the height. Default `100` */
        readonly secondBendY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.963` */
        readonly lineEndY?: number;
    };
    readonly doubleWave: {
        /** Height of the waves, as a percent of the height. Default `6.25` */
        readonly waveHeight?: number;
        /** Shifts the waves sideways, as a percent of the width, from -10 to 10. Default `0` */
        readonly skew?: number;
    };
    readonly downArrow: {
        /** Thickness of the shaft, as a percent of the width. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly downArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Height of the box, as a percent of the height. Default `64.977` */
        readonly boxHeight?: number;
    };
    readonly elbowConnector: {
        /** Where the connector bends, from the left edge, as a percent of the width. Default `50` */
        readonly bendX?: number;
    };
    readonly elbowConnectorFourBends: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
        /** Where the connector bends a third time, from the left edge, as a percent of the width. Default `50` */
        readonly thirdBendX?: number;
    };
    readonly elbowConnectorThreeBends: {
        /** Where the connector first bends, from the left edge, as a percent of the width. Default `50` */
        readonly firstBendX?: number;
        /** Where the connector bends a second time, from the top edge, as a percent of the height. Default `50` */
        readonly secondBendY?: number;
    };
    readonly ellipticalCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
    };
    readonly foldedCorner: {
        /** Size of the folded corner, as a percent of the shorter side. Default `16.667` */
        readonly foldSize?: number;
    };
    readonly frame: {
        /** Thickness of the frame, as a percent of the shorter side. Default `12.5` */
        readonly thickness?: number;
    };
    readonly gear6: {
        /** Height of the teeth, as a percent of the shorter side. Default `15` */
        readonly toothHeight?: number;
        /** Width of the top of each tooth, as a percent of the shorter side. Default `3.526` */
        readonly toothWidth?: number;
    };
    readonly gear9: {
        /** Height of the teeth, as a percent of the shorter side. Default `10` */
        readonly toothHeight?: number;
        /** Width of the top of each tooth, as a percent of the shorter side. Default `1.763` */
        readonly toothWidth?: number;
    };
    readonly halfFrame: {
        /** Thickness of the horizontal arm, as a percent of the shorter side. Default `33.333` */
        readonly horizontalArmThickness?: number;
        /** Thickness of the vertical arm, as a percent of the shorter side. Default `33.333` */
        readonly verticalArmThickness?: number;
    };
    readonly hexagon: {
        /** How far the left and right points stick out, as a percent of the shorter side. Default `25` */
        readonly pointLength?: number;
    };
    readonly horizontalScroll: {
        /** Size of the rolled ends, as a percent of the shorter side. Default `12.5` */
        readonly rollSize?: number;
    };
    readonly leftArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly leftArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Width of the box, as a percent of the width. Default `64.977` */
        readonly boxWidth?: number;
    };
    readonly leftBrace: {
        /** Height of the curves, as a percent of the shorter side. Default `8.333` */
        readonly curveHeight?: number;
        /** Where the middle point is, from the top, as a percent of the height. Default `50` */
        readonly pointPosition?: number;
    };
    readonly leftBracket: {
        /** Height of the curved corners, as a percent of the shorter side. Default `8.333` */
        readonly cornerHeight?: number;
    };
    readonly leftCircularArrow: {
        /** Thickness of the arrow's body, as a percent of the shorter side. Default `12.5` */
        readonly shaftThickness?: number;
        /** Angle the arrowhead covers, in degrees. Negative, because the arrow turns anticlockwise. Default `-19.039` */
        readonly headAngle?: number;
        /** Angle where the arrow ends, in degrees clockwise from 3 o'clock. Default `19.039` */
        readonly endAngle?: number;
        /** Angle where the arrow starts, in degrees clockwise from 3 o'clock. Default `180` */
        readonly startAngle?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headWidth?: number;
    };
    readonly leftRightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly leftRightArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Width of the box, as a percent of the width. Default `48.123` */
        readonly boxWidth?: number;
    };
    readonly leftRightCircularArrow: {
        /** Thickness of the arrow's body, as a percent of the shorter side. Default `12.5` */
        readonly shaftThickness?: number;
        /** Angle each arrowhead covers, in degrees. Default `19.039` */
        readonly headAngle?: number;
        /** Angle where the arrow ends, in degrees clockwise from 3 o'clock. Default `340.961` */
        readonly endAngle?: number;
        /** Angle where the arrow starts, in degrees clockwise from 3 o'clock. Default `199.039` */
        readonly startAngle?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headWidth?: number;
    };
    readonly leftRightRibbon: {
        /** Thickness of the ribbon, as a percent of the height. Default `50` */
        readonly thickness?: number;
        /** Length of the pointed ends, as a percent of the shorter side. Default `50` */
        readonly endLength?: number;
        /** How far the right half is offset from the left half, as a percent of the height. Default `16.667` */
        readonly verticalOffset?: number;
    };
    readonly leftRightUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly leftUpArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
    };
    readonly lineCallout: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly lineCalloutWithAccentBar: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly lineCalloutWithBorderAndAccentBar: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly lineCalloutWithNoBorder: {
        /** Start of the callout line, from the left edge, as a percent of the width. Default `-8.333` */
        readonly lineStartX?: number;
        /** Start of the callout line, from the top edge, as a percent of the height. Default `18.75` */
        readonly lineStartY?: number;
        /** End of the callout line, where it points, from the left edge, as a percent of the width. Default `-38.333` */
        readonly lineEndX?: number;
        /** End of the callout line, where it points, from the top edge, as a percent of the height. Default `112.5` */
        readonly lineEndY?: number;
    };
    readonly lShape: {
        /** Thickness of the horizontal arm, as a percent of the shorter side. Default `50` */
        readonly horizontalArmThickness?: number;
        /** Thickness of the vertical arm, as a percent of the shorter side. Default `50` */
        readonly verticalArmThickness?: number;
    };
    readonly mathDivide: {
        /** Thickness of the bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
        /** Gap between the bar and each dot, as a percent of the height. Default `5.88` */
        readonly gap?: number;
        /** Radius of the dots, as a percent of the height. Default `11.76` */
        readonly dotRadius?: number;
    };
    readonly mathEqual: {
        /** Thickness of each bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
        /** Gap between the bars, as a percent of the height. Default `11.76` */
        readonly gap?: number;
    };
    readonly mathMinus: {
        /** Thickness of the bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
    };
    readonly mathMultiply: {
        /** Thickness of the strokes, as a percent of the shorter side. Default `23.52` */
        readonly thickness?: number;
    };
    readonly mathNotEqual: {
        /** Thickness of each bar, as a percent of the height. Default `23.52` */
        readonly thickness?: number;
        /** Angle of the slash, in degrees. Default `110` */
        readonly slashAngle?: number;
        /** Gap between the bars, as a percent of the height. Default `11.76` */
        readonly gap?: number;
    };
    readonly mathPlus: {
        /** Thickness of the strokes, as a percent of the shorter side. Default `23.52` */
        readonly thickness?: number;
    };
    readonly moon: {
        /** Thickness of the crescent at its widest, as a percent of the shorter side. Default `50` */
        readonly thickness?: number;
    };
    readonly nonIsoscelesTrapezoid: {
        /** How far in the top-left corner is, as a percent of the shorter side. Default `25` */
        readonly leftSlant?: number;
        /** How far in the top-right corner is, as a percent of the shorter side. Default `25` */
        readonly rightSlant?: number;
    };
    readonly noSymbol: {
        /** Thickness of the ring and the bar, as a percent of the shorter side. Default `18.75` */
        readonly thickness?: number;
    };
    readonly notchedRightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly octagon: {
        /** Size of the cut corners, as a percent of the shorter side. Default `29.289` */
        readonly cornerSize?: number;
    };
    readonly parallelogram: {
        /** How far right the top edge is shifted, as a percent of the shorter side. Default `25` */
        readonly slant?: number;
    };
    readonly pentagonArrow: {
        /** Length of the point, as a percent of the shorter side. Default `50` */
        readonly pointLength?: number;
    };
    readonly pie: {
        /** Angle where the slice starts, in degrees clockwise from 3 o'clock. Default `0` */
        readonly startAngle?: number;
        /** Angle where the slice ends, in degrees clockwise from 3 o'clock. Default `270` */
        readonly endAngle?: number;
    };
    readonly plaque: {
        /** Radius of the curved-in corners, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly quadArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `22.5` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `45` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `22.5` */
        readonly headLength?: number;
    };
    readonly quadArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `18.515` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `37.03` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `18.515` */
        readonly headLength?: number;
        /** Size of the box, as a percent of the width and height. Default `48.123` */
        readonly boxSize?: number;
    };
    readonly rectangularCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
    };
    readonly ribbonDown: {
        /** How far the ends are offset from the centre section, as a percent of the height. Default `16.667` */
        readonly endOffset?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
    };
    readonly ribbonUp: {
        /** How far the ends are offset from the centre section, as a percent of the height. Default `16.667` */
        readonly endOffset?: number;
        /** Width of the centre section, as a percent of the width. Default `50` */
        readonly centerWidth?: number;
    };
    readonly rightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly rightArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Width of the box, as a percent of the width. Default `64.977` */
        readonly boxWidth?: number;
    };
    readonly rightBrace: {
        /** Height of the curves, as a percent of the shorter side. Default `8.333` */
        readonly curveHeight?: number;
        /** Where the middle point is, from the top, as a percent of the height. Default `50` */
        readonly pointPosition?: number;
    };
    readonly rightBracket: {
        /** Height of the curved corners, as a percent of the shorter side. Default `8.333` */
        readonly cornerHeight?: number;
    };
    readonly roundedAndSnippedCornersRectangle: {
        /** Radius of the rounded top-left corner, as a percent of the shorter side. Default `16.667` */
        readonly roundedCornerRadius?: number;
        /** Size of the cut top-right corner, as a percent of the shorter side. Default `16.667` */
        readonly snippedCornerSize?: number;
    };
    readonly roundedCornerRectangle: {
        /** Radius of the top-right corner, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly roundedRectangle: {
        /** Radius of the corners, as a percent of the shorter side. 50 makes the ends fully round. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly roundedRectangularCallout: {
        /** Tip of the pointer, from the centre, as a percent of the width. Negative values are to the left. Default `-20.833` */
        readonly pointerX?: number;
        /** Tip of the pointer, from the centre, as a percent of the height. Negative values are above the centre. Default `62.5` */
        readonly pointerY?: number;
        /** Radius of the corners, as a percent of the shorter side. Default `16.667` */
        readonly cornerRadius?: number;
    };
    readonly smileyFace: {
        /** How much the mouth curves, as a percent of the height. Negative values frown. Default `4.653` */
        readonly smile?: number;
    };
    readonly snippedCornerRectangle: {
        /** Size of the cut top-right corner, as a percent of the shorter side. Default `16.667` */
        readonly cornerSize?: number;
    };
    readonly star10: {
        /** Radius of the inner points, as a percent of the outer radius. Default `85.066` */
        readonly innerRadius?: number;
    };
    readonly star12: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star16: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star24: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star32: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly star4: {
        /** Radius of the inner points, as a percent of the outer radius. Default `25` */
        readonly innerRadius?: number;
    };
    readonly star5: {
        /** Radius of the inner points, as a percent of the outer radius. Default `38.196` */
        readonly innerRadius?: number;
    };
    readonly star6: {
        /** Radius of the inner points, as a percent of the outer radius. Default `57.736` */
        readonly innerRadius?: number;
    };
    readonly star7: {
        /** Radius of the inner points, as a percent of the outer radius. Default `69.202` */
        readonly innerRadius?: number;
    };
    readonly star8: {
        /** Radius of the inner points, as a percent of the outer radius. Default `75` */
        readonly innerRadius?: number;
    };
    readonly stripedRightArrow: {
        /** Thickness of the shaft, as a percent of the height. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly sun: {
        /** Length of the rays, from the edge to the central disc, as a percent of the width and height. Default `25` */
        readonly rayLength?: number;
    };
    readonly swooshArrow: {
        /** Thickness of the shaft where it meets the arrowhead, as a percent of the height. Default `25` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `16.667` */
        readonly headLength?: number;
    };
    readonly teardrop: {
        /** How far the point reaches, as a percent of the distance from the centre to the top-right corner. Default `100` */
        readonly pointLength?: number;
    };
    readonly topRoundedCornersRectangle: {
        /** Radius of the top corners, as a percent of the shorter side. Default `16.667` */
        readonly topCornerRadius?: number;
        /** Radius of the bottom corners, as a percent of the shorter side. Default `0` */
        readonly bottomCornerRadius?: number;
    };
    readonly topSnippedCornersRectangle: {
        /** Size of the cut top corners, as a percent of the shorter side. Default `16.667` */
        readonly topCornerSize?: number;
        /** Size of the cut bottom corners, as a percent of the shorter side. Default `0` */
        readonly bottomCornerSize?: number;
    };
    readonly trapezoid: {
        /** How far in the top corners are, as a percent of the shorter side. Default `25` */
        readonly slant?: number;
    };
    readonly triangle: {
        /** Where the top point is, from the left edge, as a percent of the width. Default `50` */
        readonly apexPosition?: number;
    };
    readonly upArrow: {
        /** Thickness of the shaft, as a percent of the width. Default `50` */
        readonly shaftThickness?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly upArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Height of the box, as a percent of the height. Default `64.977` */
        readonly boxHeight?: number;
    };
    readonly upDownArrow: {
        /** Thickness of the shaft, as a percent of the width. Default `50` */
        readonly shaftThickness?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headLength?: number;
    };
    readonly upDownArrowCallout: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of each arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of each arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Height of the box, as a percent of the height. Default `48.123` */
        readonly boxHeight?: number;
    };
    readonly uTurnArrow: {
        /** Thickness of the shaft, as a percent of the shorter side. Default `25` */
        readonly shaftThickness?: number;
        /** Width of the arrowhead, as a percent of the shorter side. Default `50` */
        readonly headWidth?: number;
        /** Length of the arrowhead, as a percent of the shorter side. Default `25` */
        readonly headLength?: number;
        /** Outer radius of the bend, as a percent of the shorter side. Default `43.75` */
        readonly bendRadius?: number;
        /** How far down the tip of the arrowhead reaches, as a percent of the height. Default `75` */
        readonly tipPosition?: number;
    };
    readonly verticalScroll: {
        /** Size of the rolled ends, as a percent of the shorter side. Default `12.5` */
        readonly rollSize?: number;
    };
    readonly wave: {
        /** Height of the waves, as a percent of the height. Default `12.5` */
        readonly waveHeight?: number;
        /** Shifts the waves sideways, as a percent of the width, from -10 to 10. Default `0` */
        readonly skew?: number;
    };
};

/**
 * The name of a preset shape.
 *
 * Covers all 187 preset shapes in OOXML, from basic shapes such as `"rectangle"`, `"ellipse"` and `"triangle"`
 * to lines and connectors, block arrows, stars, callouts and flowchart symbols.
 *
 * @publicApi
 */
export declare type PresetShapeType = keyof typeof PRESET_SHAPE_OOXML_NAMES;

/**
 * A picture in a raster format.
 */
declare type RasterImageSource = {
    /** The image format */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: ImageSourceData;
};

/**
 * The adjustments a shape of type `T` accepts, such as `{ cornerRadius?: number }` for `"roundedRectangle"`.
 * It is `never` for shapes without handles, which take no adjustments.
 *
 * @publicApi
 */
export declare type ShapeAdjustments<T extends PresetShapeType = PresetShapeType> = T extends keyof PresetShapeAdjustments ? PresetShapeAdjustments[T] : never;

/**
 * Options every shape has, whatever its type.
 */
declare type ShapeBaseOptions = DrawingLinkOptions & {
    /**
     * Size in pixels, with optional rotation (degrees) and flip. `"fitText"` sizes the shape to fit its text.
     * Inside a group, `offset` positions the shape
     */
    readonly transformation: ShapeTransformation;
    /** How the shape is filled. Default is no fill */
    readonly fill?: ShapeFill;
    /** The shape's line. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /** Shadows, glow, soft edges and reflection */
    readonly effects?: ShapeEffects;
    /** Text inside the shape, centred. Each line is a paragraph. For text with formatting, use `children` */
    readonly text?: string;
    /** Paragraphs of text inside the shape, after `text` */
    readonly children?: readonly Paragraph[];
    /** How the text inside the shape is laid out: alignment, margins, autofit, direction, columns and warps */
    readonly textOptions?: ShapeTextOptions;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

/**
 * Represents a drawing canvas in a WordprocessingML document.
 *
 * A canvas holds shapes like a {@link ShapeGroupRun}, but its shapes keep their own size, and Word
 * keeps connectors attached to their shapes when the shapes are moved. Use it for flowcharts and
 * diagrams that people will edit.
 *
 * The shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner, or by a `layout`.
 *
 * Applications that can't draw canvases, such as Apple Pages, draw the same shapes as a group instead: the canvas is
 * written in `mc:AlternateContent`, with the group as its fallback, unless `fallback` is `false`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ShapeCanvasRun({
 *   children: [
 *     { id: "start", type: "flowChartTerminator", transformation: { width: 120, height: 48 } },
 *     { id: "step", type: "flowChartProcess", transformation: { offset: { top: 100 }, width: 120, height: 48 } },
 *     { type: "connector", from: "start", to: "step", route: "elbow", line: { endArrow: "triangle" } },
 *   ],
 * });
 * ```
 */
export declare class ShapeCanvasRun extends Run {
    constructor(options: IShapeCanvasOptions);
}

/**
 * A colour: a 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }`.
 *
 * @publicApi
 */
export declare type ShapeColor = string | ShapeThemeColor;

/**
 * A line drawn as one or more parallel lines.
 *
 * - `"single"`: one line
 * - `"double"`: two lines of the same width
 * - `"thickThin"`: a thick line and a thin one
 * - `"thinThick"`: a thin line and a thick one
 * - `"triple"`: three lines, the middle one thicker
 *
 * @publicApi
 */
export declare type ShapeCompoundLine = "single" | "double" | "thickThin" | "thinThick" | "triple";

/**
 * Visual effects on a shape. Each one is optional, and they can be combined.
 *
 * @publicApi
 */
export declare type ShapeEffects = {
    /** A shadow behind the shape. `{}` gives Word's "Offset: Bottom Right" shadow */
    readonly shadow?: ShapeShadow;
    /** A shadow inside the shape, as if it were cut out of the page */
    readonly innerShadow?: ShapeShadow;
    /** A coloured glow around the shape */
    readonly glow?: ShapeGlow;
    /** Blurs the shape's edges inwards by this many points */
    readonly softEdges?: number;
    /** A reflection below the shape. `{}` gives a half reflection touching the shape */
    readonly reflection?: ShapeReflection;
};

/**
 * How a shape is filled: a hex colour, a colour of the document's theme such as `{ theme: "accent1" }`, `"none"`, or a
 * solid, gradient, pattern or picture fill.
 *
 * @publicApi
 */
export declare type ShapeFill = string | ShapeThemeColor | SolidShapeFill | GradientShapeFill | PatternShapeFill | PictureShapeFill;

/**
 * How a shape floats on the page. It takes the options of a floating image, and offsets can also be percentages.
 *
 * @publicApi
 */
export declare type ShapeFloating = Omit<IFloating, "horizontalPosition" | "verticalPosition"> & {
    readonly horizontalPosition: ShapeHorizontalPosition;
    readonly verticalPosition: ShapeVerticalPosition;
    /** What a percentage `width` or `height` is a percentage of. Default is the space between the margins, where the text goes */
    readonly sizeRelativeTo?: {
        readonly width?: ShapeWidthRelativeTo;
        readonly height?: ShapeHeightRelativeTo;
    };
};

/**
 * Places shapes in levels along their connectors, as in a flowchart: each shape goes on a level after the shapes
 * that connect to it, and the shapes on each level are ordered so connectors cross as little as they can.
 *
 * @publicApi
 */
export declare type ShapeFlowLayout = {
    readonly type: "flow";
    /** The way the flow runs. Default is `"down"` */
    readonly direction?: ShapeLayoutDirection;
    /** Space between shapes on the same level, in pixels. Default is 40 */
    readonly spacing?: number;
    /** Space between one level and the next, in pixels. Default is 50 */
    readonly levelSpacing?: number;
    /**
     * Bands the flow runs along, such as the people or teams that do each step of a process (swimlanes). Each shape
     * with a `lane` goes in the band of that name, and shapes without one go in the first. The bands are side by side,
     * across the direction the flow runs in, each with a header at the start of the flow
     */
    readonly lanes?: readonly (string | ShapeLane)[];
};

/**
 * A coloured glow around the outside of a shape.
 *
 * @publicApi
 */
export declare type ShapeGlow = {
    /** A 6-digit hex colour such as `"FFC000"`, or a colour of the document's theme such as `{ theme: "accent4" }` */
    readonly color: ShapeColor;
    /** How far the glow reaches past the shape, in points. Default is 5 */
    readonly size?: number;
    /** From 0 (opaque) to 100 (invisible). Default is 60 */
    readonly transparency?: number;
};

/**
 * Places shapes in rows and columns, in the order they are given.
 *
 * @publicApi
 */
export declare type ShapeGridLayout = {
    readonly type: "grid";
    /** The number of columns. Default is enough to make the grid about as wide as it is tall, counted in shapes */
    readonly columns?: number;
    /** Space between rows and columns, in pixels. Default is 40 */
    readonly spacing?: number;
};

/**
 * Represents a group of shapes in a WordprocessingML document.
 *
 * The shapes are positioned with `transformation.offset`, in pixels, and the group is
 * as big as the box around them. Give the group its own `transformation` to scale,
 * rotate or flip all of them together.
 *
 * Connectors are drawn between the shapes they name. Word only keeps connectors attached
 * when shapes are moved on a {@link ShapeCanvasRun}; in a group they stay where they are drawn.
 *
 * Reference: http://officeopenxml.com/drwSp-group.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ShapeGroupRun({
 *   children: [
 *     { id: "start", type: "rectangle", transformation: { width: 120, height: 48 }, fill: "4472C4" },
 *     { id: "end", type: "ellipse", transformation: { offset: { left: 160 }, width: 120, height: 48 }, fill: "ED7D31" },
 *     { type: "connector", from: "start", to: "end", line: { endArrow: "triangle" } },
 *   ],
 * });
 * ```
 */
export declare class ShapeGroupRun extends Run {
    constructor(options: IShapeGroupOptions);
}

/**
 * What a percentage height is a percentage of.
 *
 * @publicApi
 */
export declare type ShapeHeightRelativeTo = "betweenMargins" | "page" | "topMargin" | "bottomMargin" | "insideMargin" | "outsideMargin";

/**
 * Where a floating shape is across the page: as for an image, but the offset can also be a percentage.
 *
 * @publicApi
 */
export declare type ShapeHorizontalPosition = Omit<IHorizontalPositionOptions, "offset"> & {
    /**
     * Offset in EMUs from the horizontal base, or a percentage of the base's width, such as `"10%"`. A percentage needs
     * a base of the page, the space between its margins, or one of its margins
     */
    readonly offset?: number | ShapePercentage;
};

/**
 * A lane of a flow: a band, with a header, that the shapes given its name go in.
 *
 * @publicApi
 */
export declare type ShapeLane = {
    /** The lane's name, written in its header. A shape goes in the lane when its `lane` is this name */
    readonly name: string;
    /** The lane's background. Default is none */
    readonly fill?: ShapeFill;
    /** The background of the lane's header. Default is light grey */
    readonly headerFill?: ShapeFill;
    /** The line around the lane and its header. Default is a thin grey line */
    readonly line?: ShapeLine;
};

/**
 * How a {@link ShapeGroupRun} or {@link ShapeCanvasRun} places the shapes, pictures and groups that have no `offset`.
 * Shapes with an `offset` stay where it puts them: those that connect to the shapes the layout places take part in the
 * layout, which is placed around them. Connectors are routed after the shapes are placed.
 *
 * @publicApi
 */
export declare type ShapeLayout = ShapeFlowLayout | ShapeTreeLayout | ShapeGridLayout;

/**
 * The way a flow or tree runs, from its first shapes to its last.
 *
 * @publicApi
 */
export declare type ShapeLayoutDirection = "down" | "right" | "up" | "left";

/**
 * A shape's line: a hex colour, a colour of the document's theme such as `{ theme: "accent1" }`, `"none"`, or line
 * options.
 *
 * @publicApi
 */
export declare type ShapeLine = string | ShapeThemeColor | ShapeLineOptions;

/**
 * The shape of the ends of a line, and of the ends of each dash.
 *
 * - `"flat"`: the line stops at its end point
 * - `"round"`: a half circle past the end point
 * - `"square"`: a half square past the end point
 *
 * @publicApi
 */
export declare type ShapeLineCap = "flat" | "round" | "square";

/**
 * The shape of the corners where a line turns.
 *
 * - `"miter"`: sharp corners
 * - `"round"`: rounded corners
 * - `"bevel"`: corners cut off square
 *
 * @publicApi
 */
export declare type ShapeLineJoin = "miter" | "round" | "bevel";

/**
 * Line options for a shape.
 *
 * @publicApi
 */
export declare type ShapeLineOptions = {
    /** A 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }`. Default is `"000000"` */
    readonly color?: ShapeColor;
    /** Line width in points, from 0 to 1584. Default is 1 */
    readonly width?: number;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
    /** Colours the line with a gradient instead of `color` */
    readonly gradient?: Omit<GradientShapeFill, "type">;
    /** A preset dash pattern, or dashes and gaps of your own. Default is a solid line */
    readonly dash?: LineDash | CustomLineDash;
    /** The shape of the line's ends and of the ends of each dash */
    readonly cap?: ShapeLineCap;
    /** The shape of the corners where the line turns */
    readonly join?: ShapeLineJoin;
    /** Draws the line as two or three parallel lines within its width. Default is `"single"` */
    readonly compound?: ShapeCompoundLine;
    /** Arrowhead at the start of the line */
    readonly startArrow?: Arrowhead;
    /** Arrowhead at the end of the line */
    readonly endArrow?: Arrowhead;
};

/**
 * A preset pattern, such as `"percent20"` (20% of dots), `"horizontal"` lines or `"smallCheckerBoard"`.
 *
 * @publicApi
 */
export declare type ShapePattern = keyof typeof PATTERN_OOXML_NAMES;

/**
 * A percentage, such as `"100%"`.
 *
 * @publicApi
 */
export declare type ShapePercentage = `${number}%`;

/**
 * A mirror image of a shape below it, fading away from the shape.
 *
 * @publicApi
 */
export declare type ShapeReflection = {
    /** Transparency where the reflection meets the shape, from 0 (opaque) to 100 (invisible). Default is 50 */
    readonly transparency?: number;
    /** How much of the shape is reflected before the reflection fades out, from 0 to 100 percent. Default is 50 */
    readonly size?: number;
    /** How far the reflection is below the shape, in points. Default is 0 */
    readonly distance?: number;
    /** How much the reflection is blurred, in points. Default is 0.5 */
    readonly blur?: number;
};

/**
 * Represents a shape in a WordprocessingML document.
 *
 * A shape is one of the 187 DrawingML presets, such as a rectangle, ellipse, line,
 * arrow, star, callout or flowchart symbol. It can have a fill, a line with dashes
 * and arrowheads, and text inside it. It sits inline with text unless `floating` is set.
 *
 * Reference: http://officeopenxml.com/drwSp.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // A black bar inline with text
 * new Paragraph({
 *   children: [
 *     new TextRun("Name: "),
 *     new ShapeRun({ type: "rectangle", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
 *   ],
 * });
 *
 * // An arrow
 * new ShapeRun({
 *   type: "line",
 *   transformation: { width: 300, height: 0 },
 *   line: { color: "C00000", width: 2, endArrow: "triangle" },
 * });
 * ```
 */
export declare class ShapeRun extends Run {
    constructor(options: IShapeOptions);
}

/**
 * A shadow cast by a shape, or thrown inside it.
 *
 * @publicApi
 */
export declare type ShapeShadow = {
    /** A 6-digit hex colour such as `"000000"`, or a colour of the document's theme such as `{ theme: "dark1" }`. Default is black */
    readonly color?: ShapeColor;
    /** From 0 (opaque) to 100 (invisible). Default is 60 */
    readonly transparency?: number;
    /** How far the shadow's edge is blurred, in points. Default is 4 */
    readonly blur?: number;
    /** How far the shadow is from the shape, in points. Default is 3 */
    readonly distance?: number;
    /** The direction the shadow falls in, in degrees clockwise from 3 o'clock. Default is 45, down and to the right */
    readonly angle?: number;
};

/**
 * A size in pixels, `"fitText"` to fit the shape's text, or a percentage, such as `"100%"`, for a floating shape: a
 * percentage of the space between the page's margins, or of what `floating.sizeRelativeTo` gives.
 *
 * @publicApi
 */
export declare type ShapeSize = number | "fitText" | ShapePercentage;

/**
 * The direction text runs in inside a shape.
 *
 * - `"horizontal"`: left to right, the default
 * - `"topToBottom"`: turned a quarter turn clockwise, so each line reads downwards
 * - `"bottomToTop"`: turned a quarter turn anticlockwise, so each line reads upwards
 * - `"stacked"`: upright letters stacked one below the other, with lines running left to right
 * - `"stackedRightToLeft"`: upright letters stacked one below the other, with lines running right to left
 * - `"eastAsianVertical"`: East Asian characters upright and other text turned, with lines running right to left
 * - `"mongolianVertical"`: as `"eastAsianVertical"`, with lines running left to right
 *
 * @publicApi
 */
export declare type ShapeTextDirection = keyof typeof TEXT_DIRECTION_OOXML_NAMES;

/**
 * How text is laid out inside a shape.
 *
 * @publicApi
 */
export declare type ShapeTextOptions = {
    /** Where the text sits between the top and bottom of the shape. Default is `"center"` */
    readonly verticalAlignment?: ShapeTextVerticalAlignment;
    /** Space between the shape's edges and its text, in points. Word's defaults are 7.2 (0.1") on the left and right and 3.6 (0.05") on the top and bottom */
    readonly margins?: {
        readonly top?: number;
        readonly right?: number;
        readonly bottom?: number;
        readonly left?: number;
    };
    /** Whether lines of text wrap at the shape's edges. Default is `true` */
    readonly wrap?: boolean;
    /** Grows or shrinks the shape to fit its text. Can't be used with `shrinkTextOnOverflow` */
    readonly resizeShapeToFitText?: boolean;
    /** Makes the text smaller when there is too much of it for the shape. Can't be used with `resizeShapeToFitText` */
    readonly shrinkTextOnOverflow?: boolean;
    /** The direction the text runs in. Default is `"horizontal"` */
    readonly direction?: ShapeTextDirection;
    /** Lays the text out in columns */
    readonly columns?: {
        /** The number of columns, from 1 to 16 */
        readonly count: number;
        /** Space between the columns, in points. Default is 0 */
        readonly spacing?: number;
    };
    /** Bends or stretches the text to a shape, like WordArt */
    readonly warp?: ShapeTextWarp;
};

/**
 * Where text sits between the top and bottom of a shape.
 *
 * @publicApi
 */
export declare type ShapeTextVerticalAlignment = "top" | "center" | "bottom";

/**
 * A WordArt-style warp that bends or stretches the text to a shape, such as `"archUp"`, `"wave"` or `"inflate"`.
 * The `...Filled` arches, circle and button spread the text over the whole shape, where the others follow a single line.
 *
 * @publicApi
 */
export declare type ShapeTextWarp = keyof typeof TEXT_WARP_OOXML_NAMES;

/**
 * A colour of the document's theme, lighter or darker if you like, as Word's colour menus offer them: "Blue, Accent 1,
 * Lighter 40%" is `{ theme: "accent1", lighter: 40 }`. The shape changes colour when the theme's colours change. The
 * same as `docx`'s `ThemeColor`, which text, borders and shading take.
 *
 * @publicApi
 */
export declare type ShapeThemeColor = ThemeColor;

/**
 * One of the twelve colours of the document's theme, as `Document`'s `theme.colors` names them. The same as `docx`'s
 * `ThemeColorName`.
 *
 * @publicApi
 */
export declare type ShapeThemeColorName = ThemeColorName;

/**
 * A shape's size in pixels, with optional rotation (degrees) and flip. Inside a group, `offset` positions the shape.
 *
 * @publicApi
 */
export declare type ShapeTransformation = Omit<IMediaTransformation, "width" | "height"> & {
    /**
     * Width in pixels, `"fitText"` for as wide as the longest line of the shape's text, or a percentage of the space
     * between the margins for a floating shape, such as `"100%"`
     */
    readonly width: ShapeSize;
    /** Height in pixels, `"fitText"` for as tall as the shape's text, wrapped at the shape's width, or a percentage for a floating shape */
    readonly height: ShapeSize;
};

/**
 * Places shapes as a tree, such as an org chart: each connector joins a parent (`from`) to a child (`to`), and
 * children are placed side by side below their parent, which is centred over them.
 *
 * @publicApi
 */
export declare type ShapeTreeLayout = {
    readonly type: "tree";
    /** The way the tree grows from its root. Default is `"down"` */
    readonly direction?: ShapeLayoutDirection;
    /** Space between shapes on the same level, in pixels. Default is 20 */
    readonly spacing?: number;
    /** Space between one level and the next, in pixels. Default is 40 */
    readonly levelSpacing?: number;
};

/**
 * Where a floating shape is down the page: as for an image, but the offset can also be a percentage.
 *
 * @publicApi
 */
export declare type ShapeVerticalPosition = Omit<IVerticalPositionOptions, "offset"> & {
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
export declare type ShapeWidthRelativeTo = "betweenMargins" | "page" | "leftMargin" | "rightMargin" | "insideMargin" | "outsideMargin";

/**
 * A solid colour fill.
 *
 * @publicApi
 */
export declare type SolidShapeFill = {
    readonly type?: "solid";
    /** A 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }` */
    readonly color: ShapeColor;
    /** From 0 (opaque) to 100 (invisible) */
    readonly transparency?: number;
};

/**
 * An SVG picture, with a raster picture for applications that can't draw SVG.
 */
declare type SvgImageSource = {
    /** The image format */
    readonly type: "svg";
    /** The SVG data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: ImageSourceData;
    /** A picture in a raster format, for Word processors that can't draw SVG */
    readonly fallback: RasterImageSource;
};

declare const TEXT_DIRECTION_OOXML_NAMES: {
    readonly horizontal: "horz";
    readonly topToBottom: "vert";
    readonly bottomToTop: "vert270";
    readonly stacked: "wordArtVert";
    readonly stackedRightToLeft: "wordArtVertRtl";
    readonly eastAsianVertical: "eaVert";
    readonly mongolianVertical: "mongolianVert";
};

declare const TEXT_WARP_OOXML_NAMES: {
    readonly square: "textPlain";
    readonly stop: "textStop";
    readonly triangleUp: "textTriangle";
    readonly triangleDown: "textTriangleInverted";
    readonly chevronUp: "textChevron";
    readonly chevronDown: "textChevronInverted";
    readonly ringInside: "textRingInside";
    readonly ringOutside: "textRingOutside";
    readonly archUp: "textArchUp";
    readonly archDown: "textArchDown";
    readonly circle: "textCircle";
    readonly button: "textButton";
    readonly archUpFilled: "textArchUpPour";
    readonly archDownFilled: "textArchDownPour";
    readonly circleFilled: "textCirclePour";
    readonly buttonFilled: "textButtonPour";
    readonly curveUp: "textCurveUp";
    readonly curveDown: "textCurveDown";
    readonly canUp: "textCanUp";
    readonly canDown: "textCanDown";
    readonly wave: "textWave1";
    readonly waveInverted: "textWave2";
    readonly doubleWave: "textDoubleWave1";
    readonly doubleWaveInverted: "textWave4";
    readonly inflate: "textInflate";
    readonly deflate: "textDeflate";
    readonly inflateBottom: "textInflateBottom";
    readonly deflateBottom: "textDeflateBottom";
    readonly inflateTop: "textInflateTop";
    readonly deflateTop: "textDeflateTop";
    readonly deflateInflate: "textDeflateInflate";
    readonly deflateInflateDeflate: "textDeflateInflateDeflate";
    readonly fadeRight: "textFadeRight";
    readonly fadeLeft: "textFadeLeft";
    readonly fadeUp: "textFadeUp";
    readonly fadeDown: "textFadeDown";
    readonly slantUp: "textSlantUp";
    readonly slantDown: "textSlantDown";
    readonly cascadeUp: "textCascadeUp";
    readonly cascadeDown: "textCascadeDown";
};

/**
 * Adds `type`, and the `adjustments` that go with it, to a set of shape options.
 *
 * There is one member per preset shape, so `adjustments` only accepts the names of that shape's handles.
 * Another member takes any shape type without adjustments, for when the type is only known at runtime,
 * and the last one is a custom shape drawn from a `path` or `paths`.
 */
declare type WithPresetShape<Options> = {
    readonly [T in PresetShapeType]: Options & {
        /** The preset shape, such as `"rectangle"`, `"ellipse"`, `"line"` or `"rightArrow"` */
        readonly type: T;
        /** The shape's handles, such as `{ cornerRadius: 25 }` for a `"roundedRectangle"`. Lengths are percentages and angles are degrees */
        readonly adjustments?: ShapeAdjustments<T>;
    };
}[PresetShapeType] | (Options & {
    readonly type: PresetShapeType;
    readonly adjustments?: undefined;
}) | (Options & CustomShapeGeometry & {
    /** A shape of your own, drawn from `path` or `paths` */
    readonly type: "custom";
    readonly adjustments?: undefined;
});

export { }
