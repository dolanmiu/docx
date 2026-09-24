/**
 * Converts the human units shape options are given in (points, degrees and percentages from 0 to 100)
 * to the units DrawingML stores (EMUs, 60,000ths of a degree and thousandths of a percent).
 *
 * @module
 */

export const EMUS_PER_POINT = 12700;
export const EMUS_PER_PIXEL = 9525;

// ST_LineWidth allows up to 20116800 EMUs. Other lengths in points, such as blurs and glows, are held to the same limit
const MAX_POINTS = 1584;
const ANGLE_UNITS_PER_DEGREE = 60000;

/**
 * Checks that a percentage option is between 0 and 100 and returns it.
 *
 * @throws If the value is outside 0 to 100
 */
export const percentageValue = (value: number, option: string): number => {
    if (!(value >= 0 && value <= 100)) {
        throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
    }
    return value;
};

/**
 * Converts a length in points to EMUs.
 *
 * @throws If the length is negative or more than 1584 points (22 inches)
 */
export const pointsToEmus = (points: number, option: string): number => {
    if (!(points >= 0 && points <= MAX_POINTS)) {
        throw new Error(`Invalid ${option} ${points}. Expected a number of points from 0 to ${MAX_POINTS}`);
    }
    return Math.round(points * EMUS_PER_POINT);
};

/**
 * Converts an angle in degrees to an `ST_PositiveFixedAngle`: 60,000ths of a degree, from 0 up to (not including) 360 degrees.
 * Negative angles and angles of a full turn or more are brought into that range.
 */
export const positiveFixedAngle = (degrees: number): number =>
    Math.round((((degrees % 360) + 360) % 360) * ANGLE_UNITS_PER_DEGREE) % (360 * ANGLE_UNITS_PER_DEGREE);
