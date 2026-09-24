/**
 * Connection sites: the points on a preset shape where connectors attach.
 *
 * Reference: ECMA-376 Part 1, 20.1.9.9 cxn (Shape Connection Site)
 *
 * @module
 */
import { evaluateShapeGuides } from "./shape-guides";
import { PRESET_SHAPE_GEOMETRY } from "../preset-shape/preset-shape-geometry";
import type { PresetShapeType } from "../preset-shape/preset-shape-type";

/**
 * A point where a connector can attach to a shape.
 */
export type ConnectionSite = {
    /** Distance from the left of the shape, in EMUs */
    readonly x: number;
    /** Distance from the top of the shape, in EMUs */
    readonly y: number;
    /** The direction a connector leaves the shape in, in degrees clockwise from 3 o'clock */
    readonly angle: number;
};

/**
 * The connection sites of a preset shape of the given size, in the order OOXML numbers them (`a:stCxn/@idx`).
 *
 * @param adjustments - The shape's adjustment guide values, such as `{ adj: 25000 }`. Missing values take their defaults
 * @returns No sites for shapes without any, such as lines and connectors
 */
export const getConnectionSites = (
    type: PresetShapeType,
    width: number,
    height: number,
    adjustments?: Readonly<Record<string, number>>,
): readonly ConnectionSite[] => {
    const definition = PRESET_SHAPE_GEOMETRY[type];
    if (!definition?.sites) {
        return [];
    }

    const value = evaluateShapeGuides(definition, width, height, adjustments);
    return definition.sites.split("; ").map((site) => {
        const [angle, x, y] = site.split(" ");
        return { x: value(x), y: value(y), angle: value(angle) / 60000 };
    });
};
