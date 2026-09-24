/**
 * Lays out the children of a ShapeGroupRun or ShapeCanvasRun: positions the shapes, gives each one
 * a drawing id, and routes the connectors between them. Not part of the public API.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import {
    type ConnectionSite,
    type ConnectorEndpoint,
    type Point,
    type PresetShapeCoreOptions,
    type PresetShapeNonVisualProperties,
    createShapeGuides,
    getConnectionSites,
    getShapeLineOverhang,
    routeConnector,
} from "@file/drawing/inline/graphic/graphic-data/wps";
import type { IMediaTransformation, WpsMediaData } from "@file/media";
import { docPropertiesUniqueNumericId } from "@util/convenience-functions";

import type { ConnectorEnd, ConnectorSide, IShapeConnectorOptions } from "./shape-connector";
import { type ShapeBaseOptions, type WithPresetShape, createPresetShapeData } from "./shape-run-data";

/**
 * A shape or connector inside a {@link ShapeGroupRun} or {@link ShapeCanvasRun}.
 *
 * A shape takes the options of a {@link ShapeRun} except `floating`. `transformation.offset` positions it,
 * in pixels, and `id` names it so connectors can attach to it.
 *
 * @publicApi
 */
export type IShapeGroupChildOptions =
    | WithPresetShape<
          ShapeBaseOptions & {
              /** A name that connectors use to attach to this shape. It must be unique within the group or canvas */
              readonly id?: string;
          }
      >
    | IShapeConnectorOptions;

type ShapeChildOptions = Exclude<IShapeGroupChildOptions, IShapeConnectorOptions>;

type Box = {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
};

type PlacedShape = {
    readonly options: ShapeChildOptions;
    /** The shape's `wps:cNvPr` id */
    readonly drawingId: number;
    /** Position and size in EMUs, before rotation */
    readonly box: Box;
};

/** A connection site on the page. `index` is missing for the sides of a shape without connection sites */
type PageSite = ConnectorEndpoint & { readonly index?: number };

export type ShapeDrawingLayout = {
    readonly children: readonly WpsMediaData[];
    /** The box around the shapes and connectors, in EMUs */
    readonly bounds: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };
    /** How far the widest line reaches past its shape, in EMUs */
    readonly overhang: number;
};

const EMUS_PER_PIXEL = 9525;

const SIDE_ANGLES: Readonly<Record<ConnectorSide, number>> = { right: 0, bottom: 90, left: 180, top: 270 };

const boxOf = ({ offset, width, height }: IMediaTransformation): Box => ({
    x: Math.round((offset?.left ?? 0) * EMUS_PER_PIXEL),
    y: Math.round((offset?.top ?? 0) * EMUS_PER_PIXEL),
    width: Math.round(width * EMUS_PER_PIXEL),
    height: Math.round(height * EMUS_PER_PIXEL),
});

const centreOf = ({ x, y, width, height }: Box): Point => ({ x: x + width / 2, y: y + height / 2 });

/**
 * The shape's connection sites on the page, after it is flipped and rotated.
 * A shape without connection sites, such as a line, is connected at the middle of each side of its box.
 */
const getPageSites = ({ options, box }: PlacedShape): readonly PageSite[] => {
    const { rotation = 0, flip } = options.transformation;
    const sites: readonly (ConnectionSite & { readonly index?: number })[] = getConnectionSites(
        options.type,
        box.width,
        box.height,
        createShapeGuides(options.type, options.adjustments),
    ).map((site, index) => ({ ...site, index }));
    const localSites =
        sites.length > 0
            ? sites
            : [
                  { x: box.width / 2, y: 0, angle: 270 },
                  { x: 0, y: box.height / 2, angle: 180 },
                  { x: box.width / 2, y: box.height, angle: 90 },
                  { x: box.width, y: box.height / 2, angle: 0 },
              ];

    const radians = (rotation * Math.PI) / 180;
    const centre = centreOf(box);
    return localSites.map(({ x, y, angle, index }) => {
        // Flip about the centre, then rotate about it
        const dx = (flip?.horizontal ? box.width - x : x) - box.width / 2;
        const dy = (flip?.vertical ? box.height - y : y) - box.height / 2;
        const flippedAngle = (flip?.horizontal ? 180 - angle : angle) * (flip?.vertical ? -1 : 1);
        return {
            point: {
                x: centre.x + dx * Math.cos(radians) - dy * Math.sin(radians),
                y: centre.y + dx * Math.sin(radians) + dy * Math.cos(radians),
            },
            angle: flippedAngle + rotation,
            index,
        };
    });
};

/**
 * The side of `from` that faces `to`.
 */
const facingSide = (from: Box, to: Box): ConnectorSide => {
    const a = centreOf(from);
    const b = centreOf(to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? "right" : "left";
    }
    return dy >= 0 ? "bottom" : "top";
};

const angleBetween = (a: number, b: number): number => {
    const difference = (((a - b) % 360) + 360) % 360;
    return Math.min(difference, 360 - difference);
};

/**
 * The connection site on a side of a shape: the one facing most nearly that way, then the one
 * furthest out on that side, then the one nearest the middle of the side.
 */
const pickSite = (sites: readonly PageSite[], side: ConnectorSide, box: Box): PageSite => {
    const angle = SIDE_ANGLES[side];
    const direction = { x: Math.round(Math.cos((angle * Math.PI) / 180)), y: Math.round(Math.sin((angle * Math.PI) / 180)) };
    const centre = centreOf(box);
    const along = ({ point }: PageSite): number => (point.x - centre.x) * direction.x + (point.y - centre.y) * direction.y;
    const across = ({ point }: PageSite): number => Math.abs((point.x - centre.x) * direction.y - (point.y - centre.y) * direction.x);

    const isBetter = (site: PageSite, best: PageSite): boolean => {
        const angleDifference = angleBetween(site.angle, angle) - angleBetween(best.angle, angle);
        if (Math.abs(angleDifference) > 0.01) {
            return angleDifference < 0;
        }
        const alongDifference = along(site) - along(best);
        if (Math.abs(alongDifference) > 1) {
            return alongDifference > 0;
        }
        return across(site) < across(best);
    };

    return sites.reduce((best, site) => (isBetter(site, best) ? site : best));
};

/**
 * A shape or connector, positioned in EMUs, before it is written as a `wps:wsp`.
 */
type LaidOutChild = {
    /** Position and size before rotation. Connectors can be positioned between whole EMUs */
    readonly box: Box;
    /** Clockwise rotation in degrees */
    readonly rotation?: number;
    readonly flip?: { readonly horizontal?: boolean; readonly vertical?: boolean };
    readonly data: PresetShapeCoreOptions;
    /** The points the child reaches to, for the box around all the children */
    readonly points: readonly Point[];
};

const createNonVisualDrawingProperties = (id: number, altText?: DocPropertiesOptions): PresetShapeNonVisualProperties => ({
    id,
    name: altText?.name ?? "",
    description: altText?.description,
    title: altText?.title,
});

const layoutShape = (shape: ShapeChildOptions, drawingId: number): LaidOutChild => {
    const box = boxOf(shape.transformation);
    return {
        box,
        rotation: shape.transformation.rotation,
        flip: shape.transformation.flip,
        data: { ...createPresetShapeData(shape), nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, shape.altText) },
        points: [
            { x: box.x, y: box.y },
            { x: box.x + box.width, y: box.y + box.height },
        ],
    };
};

const layoutConnector = (connector: IShapeConnectorOptions, drawingId: number, shapes: ReadonlyMap<string, PlacedShape>): LaidOutChild => {
    const resolve = (connectorEnd: ConnectorEnd): { readonly shape: PlacedShape; readonly side?: ConnectorSide } => {
        const { id, side } = typeof connectorEnd === "string" ? { id: connectorEnd, side: undefined } : connectorEnd;
        const shape = shapes.get(id);
        if (!shape) {
            throw new Error(`Invalid connector. No shape has the id "${id}"`);
        }
        return { shape, side };
    };
    const from = resolve(connector.from);
    const to = resolve(connector.to);
    const start = pickSite(getPageSites(from.shape), from.side ?? facingSide(from.shape.box, to.shape.box), from.shape.box);
    const end = pickSite(getPageSites(to.shape), to.side ?? facingSide(to.shape.box, from.shape.box), to.shape.box);
    const geometry = routeConnector(connector.route ?? "straight", start, end);

    return {
        box: { ...geometry.offset, width: geometry.width, height: geometry.height },
        rotation: geometry.rotation,
        flip: { horizontal: geometry.flip.horizontal || undefined, vertical: geometry.flip.vertical || undefined },
        data: {
            geometry: { type: geometry.type, adjustments: geometry.adjustments },
            line: connector.line,
            // Attach the connector to shapes with connection sites
            connections: {
                start: start.index === undefined ? undefined : { id: from.shape.drawingId, index: start.index },
                end: end.index === undefined ? undefined : { id: to.shape.drawingId, index: end.index },
            },
            nonVisualDrawingProperties: createNonVisualDrawingProperties(drawingId, connector.altText),
        },
        points: geometry.points,
    };
};

const toMediaData = ({ box, rotation, flip, data }: LaidOutChild, shift: Point): WpsMediaData => {
    const x = Math.round(box.x + shift.x);
    const y = Math.round(box.y + shift.y);
    const width = Math.round(box.width);
    const height = Math.round(box.height);
    return {
        type: "wps",
        transformation: {
            offset: { pixels: { x: Math.round(x / EMUS_PER_PIXEL), y: Math.round(y / EMUS_PER_PIXEL) }, emus: { x, y } },
            pixels: { x: Math.round(width / EMUS_PER_PIXEL), y: Math.round(height / EMUS_PER_PIXEL) },
            emus: { x: width, y: height },
            flip,
            rotation: rotation ? rotation * 60000 : undefined,
        },
        data,
    };
};

/**
 * Lays out the shapes and connectors of a group or canvas. Shapes and connectors are drawn in the order given,
 * and connectors can attach to shapes that come after them.
 *
 * @param keepPositive - Moves everything right and down, if needed, so nothing is above or to the left of (0, 0)
 * @throws If there are no children, two shapes have the same `id`, or a connector refers to an `id` no shape has
 */
export const layoutShapeDrawing = (children: readonly IShapeGroupChildOptions[], keepPositive = false): ShapeDrawingLayout => {
    if (children.length === 0) {
        throw new Error("Invalid shape group. Expected at least 1 child shape");
    }

    // Every shape and connector identifies itself with wps:cNvPr, which needs a unique id
    const drawingIds = children.map(() => docPropertiesUniqueNumericId());

    const named = children.flatMap((child, index) =>
        child.type !== "connector" && child.id !== undefined
            ? [[child.id, { options: child, drawingId: drawingIds[index], box: boxOf(child.transformation) }] as const]
            : [],
    );
    const shapes: ReadonlyMap<string, PlacedShape> = new Map(named);
    if (shapes.size < named.length) {
        const repeated = named.find(([id], index) => named.findIndex(([other]) => other === id) !== index)!;
        throw new Error(`Invalid shape id "${repeated[0]}". Each shape in a group or canvas needs a different id`);
    }

    const laidOut = children.map((child, index) =>
        child.type === "connector" ? layoutConnector(child, drawingIds[index], shapes) : layoutShape(child, drawingIds[index]),
    );

    const points = laidOut.flatMap((child) => child.points);
    const left = Math.min(...points.map((point) => point.x));
    const top = Math.min(...points.map((point) => point.y));
    const shift = keepPositive ? { x: Math.max(0, -left), y: Math.max(0, -top) } : { x: 0, y: 0 };

    return {
        children: laidOut.map((child) => toMediaData(child, shift)),
        bounds: {
            left: left + shift.x,
            top: top + shift.y,
            right: Math.max(...points.map((point) => point.x)) + shift.x,
            bottom: Math.max(...points.map((point) => point.y)) + shift.y,
        },
        overhang: Math.max(...children.map((child) => getShapeLineOverhang(child.line))),
    };
};
