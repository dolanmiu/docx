/**
 * The value of `m:limLoc` for a {@link MathLimitsPosition}. Internal: not exported from docx.
 *
 * @module
 */
import type { MathLimitsPosition } from "./math-limit-location";

const LOCATIONS: Readonly<Record<MathLimitsPosition, string>> = { aboveBelow: "undOvr", side: "subSup" };

/**
 * The value of `m:limLoc` for where limits go, or the default when none is given.
 *
 * @throws If the position isn't one of those allowed, for code that isn't type checked
 */
export const limitLocationValue = (owner: string, limits: MathLimitsPosition | undefined, defaultValue: string): string => {
    if (limits === undefined) {
        return defaultValue;
    }
    if (!Object.keys(LOCATIONS).includes(limits)) {
        throw new Error(`${owner}: limits is "${limits}", which isn't one of ${Object.keys(LOCATIONS).join(", ")}`);
    }
    return LOCATIONS[limits];
};
