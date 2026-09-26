/**
 * Dates as a chart's categories: Excel's serial numbers for them, and the unit a date axis spaces them by.
 *
 * @module
 */

const MILLISECONDS_PER_DAY = 86_400_000;

// Excel counts days from 30 December 1899, which is right from 1 March 1900, after the 29 February 1900 Excel counts
// though there wasn't one
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const FIRST_DATE = Date.UTC(1900, 2, 1);
const LAST_DATE = Date.UTC(9999, 11, 31);

/**
 * The unit a date axis spaces its categories by, and draws each bar as wide as (`ST_TimeUnit`).
 */
export type TimeUnit = "days" | "months" | "years";

/**
 * How dates are written in the sheet and on the axis, for each unit: unambiguous in any locale.
 */
export const DATE_FORMATS: Readonly<Record<TimeUnit, string>> = {
    days: "d mmm yyyy",
    months: "mmm yyyy",
    years: "yyyy",
};

/**
 * Checks that a category is a date Excel can hold.
 *
 * @throws If it isn't a valid date from 1 March 1900 to 31 December 9999
 */
export const checkDate = (date: Date): void => {
    const time = date.getTime();
    if (!(time >= FIRST_DATE && time < LAST_DATE + MILLISECONDS_PER_DAY)) {
        throw new Error(`Invalid category date ${String(date)}. Expected a date from 1900-03-01 to 9999-12-31`);
    }
};

/**
 * A date as Excel's serial number: days since 30 December 1899, with the time of day as a fraction. Dates are read in
 * UTC, as `docx` writes every date, so `new Date("2025-01-31")` is 31 January 2025.
 */
export const serialDate = (date: Date): number => (date.getTime() - EXCEL_EPOCH) / MILLISECONDS_PER_DAY;

/**
 * The unit dates are spaced by, as Excel chooses it: years when they are all the 1st of January, months when they are
 * all the 1st of a month, and otherwise days.
 */
export const timeUnitOf = (dates: readonly Date[]): TimeUnit => {
    const startsOf = (date: Date): boolean => date.getTime() % MILLISECONDS_PER_DAY === 0 && date.getUTCDate() === 1;
    if (!dates.every(startsOf)) {
        return "days";
    }
    return dates.every((date) => date.getUTCMonth() === 0) ? "years" : "months";
};
