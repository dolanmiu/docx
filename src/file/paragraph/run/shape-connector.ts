/**
 * Connectors: lines that join two shapes in a ShapeGroupRun or ShapeCanvasRun.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { ConnectorRoute, ShapeFill, ShapeLine } from "@file/drawing/inline/graphic/graphic-data/wps";
import type { Paragraph } from "@file/paragraph";

export type { ConnectorRoute } from "@file/drawing/inline/graphic/graphic-data/wps";

/**
 * A side of a shape that a connector can attach to.
 *
 * @publicApi
 */
export type ConnectorSide = "top" | "right" | "bottom" | "left";

/**
 * A point on a shape, as percentages of the shape's width and height before it is rotated or flipped:
 * `{ x: 0, y: 0 }` is the top-left corner and `{ x: 100, y: 100 }` the bottom-right corner.
 *
 * @publicApi
 */
export type ConnectorPoint = {
    /** From 0 (the left edge) to 100 (the right edge) */
    readonly x: number;
    /** From 0 (the top edge) to 100 (the bottom edge) */
    readonly y: number;
};

/**
 * One end of a connector: the `id` of the shape it attaches to, or the `id` with a `side` or `point` of the shape.
 * Without either, the connector attaches to the side that faces the shape at its other end.
 *
 * @publicApi
 */
export type ConnectorEnd =
    | string
    | {
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
 * Where a label goes along a connector's route: near where it starts, in the middle, or near where it ends.
 *
 * @publicApi
 */
export type ConnectorLabelPosition = "start" | "middle" | "end";

/**
 * Text on a connector, in a box centred on its route.
 *
 * @publicApi
 */
export type ConnectorLabel = {
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
export type IShapeConnectorOptions = {
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
