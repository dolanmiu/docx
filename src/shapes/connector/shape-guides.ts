/**
 * Evaluates the shape guides of a preset shape definition: the formulas that give the positions
 * of a shape's handles, corners and connection sites for a given size.
 *
 * Reference: ECMA-376 Part 1, 20.1.9.11 gd (Shape Guide)
 *
 * @module
 */
import type { PresetShapeGeometryDefinition } from "../preset-shape/preset-shape-geometry";

// Guide formulas measure angles in 60,000ths of a degree
const ANGLE_UNITS_PER_RADIAN = 10800000 / Math.PI;
const FULL_CIRCLE = 21600000;

type Operator = (x: number, y: number, z: number) => number;

/* cspell:disable */
const OPERATORS: ReadonlyMap<string, Operator> = new Map(
    Object.entries({
        "*/": (x, y, z) => (x * y) / z,
        "+-": (x, y, z) => x + y - z,
        "+/": (x, y, z) => (x + y) / z,
        "?:": (x, y, z) => (x > 0 ? y : z),
        abs: (x) => Math.abs(x),
        at2: (x, y) => Math.atan2(y, x) * ANGLE_UNITS_PER_RADIAN,
        cat2: (x, y, z) => x * Math.cos(Math.atan2(z, y)),
        cos: (x, y) => x * Math.cos(y / ANGLE_UNITS_PER_RADIAN),
        max: (x, y) => Math.max(x, y),
        min: (x, y) => Math.min(x, y),
        mod: (x, y, z) => Math.sqrt(x * x + y * y + z * z),
        pin: (x, y, z) => {
            if (y < x) {
                return x;
            }
            return y > z ? z : y;
        },
        sat2: (x, y, z) => x * Math.sin(Math.atan2(z, y)),
        sin: (x, y) => x * Math.sin(y / ANGLE_UNITS_PER_RADIAN),
        sqrt: (x) => Math.sqrt(x),
        tan: (x, y) => x * Math.tan(y / ANGLE_UNITS_PER_RADIAN),
        val: (x) => x,
    } satisfies Record<string, Operator>),
);
/* cspell:enable */

/**
 * The value of a built-in guide, such as `w` (the width), `hc` (the horizontal centre),
 * `wd4` (a quarter of the width) or `3cd4` (three quarters of a circle).
 */
const builtInGuide = (name: string, width: number, height: number): number | undefined => {
    const fixed = new Map([
        ["w", width],
        ["h", height],
        ["l", 0],
        ["t", 0],
        ["r", width],
        ["b", height],
        ["hc", width / 2],
        ["vc", height / 2],
        ["ss", Math.min(width, height)],
        ["ls", Math.max(width, height)],
    ]);
    if (fixed.has(name)) {
        return fixed.get(name);
    }

    const fraction = /^(wd|hd|ssd)(\d+)$/.exec(name);
    if (fraction) {
        const whole = { wd: width, hd: height, ssd: Math.min(width, height) }[fraction[1] as "wd" | "hd" | "ssd"];
        return whole / Number(fraction[2]);
    }

    const circle = /^(\d*)cd(\d+)$/.exec(name);
    return circle ? (Number(circle[1] || 1) * FULL_CIRCLE) / Number(circle[2]) : undefined;
};

/**
 * Evaluates a shape definition's guides for a shape of the given size, in EMUs.
 *
 * @param adjustments - Adjustment guide values (such as `{ adj: 25000 }`) that replace the defaults
 * @returns A function that gives the value of a guide name, built-in guide or number
 * @throws If a formula uses an unknown operator or guide
 */
export const evaluateShapeGuides = (
    { defaults = {}, guides }: PresetShapeGeometryDefinition,
    width: number,
    height: number,
    adjustments: Readonly<Record<string, number>> = {},
): ((token: string) => number) => {
    const values = new Map<string, number>(Object.entries({ ...defaults, ...adjustments }));

    const value = (token: string): number => {
        if (/^-?\d+$/.test(token)) {
            return Number(token);
        }
        const result = values.get(token) ?? builtInGuide(token, width, height);
        if (result === undefined) {
            throw new Error(`Unknown shape guide "${token}"`);
        }
        return result;
    };

    for (const guide of guides ? guides.split("; ") : []) {
        const [name, operatorName, ...args] = guide.split(" ");
        const operator = OPERATORS.get(operatorName);
        if (!operator) {
            throw new Error(`Unknown shape guide operator "${operatorName}"`);
        }
        const [x = 0, y = 0, z = 0] = args.map(value);
        // Guides are calculated in order, and each can use the ones before it
        // eslint-disable-next-line functional/immutable-data
        values.set(name, operator(x, y, z));
    }

    return value;
};
