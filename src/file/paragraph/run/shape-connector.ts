/**
 * Connectors: lines that join two shapes in a ShapeGroupRun or ShapeCanvasRun.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { ConnectorRoute, ShapeLine } from "@file/drawing/inline/graphic/graphic-data/wps";

export type { ConnectorRoute } from "@file/drawing/inline/graphic/graphic-data/wps";

/**
 * A side of a shape that a connector can attach to.
 *
 * @publicApi
 */
export type ConnectorSide = "top" | "right" | "bottom" | "left";

/**
 * One end of a connector: the `id` of the shape it attaches to, or the `id` and the `side` of the shape.
 * Without a `side`, the connector attaches to the side that faces the shape at its other end.
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
      };

/**
 * A connector between two shapes in a {@link ShapeGroupRun} or {@link ShapeCanvasRun}.
 *
 * The connector is drawn from one shape to the other, so it doesn't need a size or position.
 * On a {@link ShapeCanvasRun}, Word keeps it attached when either shape is moved.
 *
 * @publicApi
 */
export type IShapeConnectorOptions = {
    readonly type: "connector";
    /** Where the connector starts */
    readonly from: ConnectorEnd;
    /** Where the connector ends */
    readonly to: ConnectorEnd;
    /** A straight line, right-angled bends, or curves. Default is `"straight"` */
    readonly route?: ConnectorRoute;
    /** The connector's line, including any arrowheads. `startArrow` is at `from` and `endArrow` at `to`. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};
