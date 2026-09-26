/**
 * Describes a chart for screen readers, from its type, title and data. Not part of the public API.
 *
 * @module
 */
import type { DocPropertiesOptions } from "docx";

import { type TimeUnit, timeUnitOf } from "./chart-dates";
import type { ChartRunOptions, ChartType } from "./chart-options";
import { titleOf } from "./chart-text";

/** The longest description written. A longer one is cut at the end of a value, and ends with an ellipsis */
export const MAX_DESCRIPTION_LENGTH = 1000;

// Each type by the name Word gives it
const TYPE_NAMES: Readonly<Record<ChartType, string>> = {
    column: "Column",
    bar: "Bar",
    line: "Line",
    area: "Area",
    pie: "Pie",
    doughnut: "Doughnut",
    radar: "Radar",
    scatter: "Scatter",
    bubble: "Bubble",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A date as the axis labels it by default, in UTC, as the chart reads it: "3 Jan 2025", "Jan 2025" or "2025", by the
 * unit the dates are spaced by.
 */
const dateText = (date: Date, unit: TimeUnit): string => {
    const year = String(date.getUTCFullYear());
    const month = `${MONTHS[date.getUTCMonth()]} ${year}`;
    switch (unit) {
        case "years":
            return year;
        case "months":
            return month;
        default:
            return `${date.getUTCDate()} ${month}`;
    }
};

/**
 * The categories as a screen reader reads them.
 */
const categoryTexts = (categories: readonly (string | number | Date)[]): readonly string[] => {
    const dates = categories.filter((category): category is Date => category instanceof Date);
    const unit = timeUnitOf(dates);
    return categories.map((category) => (category instanceof Date ? dateText(category, unit) : String(category)));
};

const listOf = (name: string, items: readonly string[]): string => `${name}: ${items.length === 0 ? "no values" : items.join(", ")}.`;

/**
 * A sentence for each series: its name, then each category's value, or each point. Gaps are left out.
 */
const describeSeries = (options: ChartRunOptions): readonly string[] => {
    switch (options.type) {
        case "scatter":
            return options.series.map(({ name, points }) =>
                listOf(
                    name,
                    points.map(({ x, y }) => `(${x}, ${y})`),
                ),
            );
        case "bubble":
            return options.series.map(({ name, points }) =>
                listOf(
                    name,
                    points.map(({ x, y, size }) => `(${x}, ${y}) size ${size}`),
                ),
            );
        default: {
            const categories = categoryTexts(options.categories);
            return options.series.map(({ name, values }) =>
                listOf(
                    name,
                    values.flatMap((value, index) => (value === null ? [] : [`${categories[index]} ${value}`])),
                ),
            );
        }
    }
};

/**
 * Cuts a description that is too long at the end of the last value that fits, or in a title too long to fit, and ends
 * it with an ellipsis.
 *
 * @param heading - The length of the chart's type and title, which start the description
 */
const limitLength = (description: string, heading: number): string => {
    if (description.length <= MAX_DESCRIPTION_LENGTH) {
        return description;
    }
    const start = description.slice(0, MAX_DESCRIPTION_LENGTH - 1);
    const end = Math.max(start.lastIndexOf(", "), start.lastIndexOf(". "));
    return `${end >= heading ? start.slice(0, end) : start}…`;
};

/**
 * Describes a chart: its type and title, then each series' values, such as "Column chart, Sales. 2024: Jan 10, Feb 20,
 * Mar 30. 2025: Jan 15, Feb 25." It is at most {@link MAX_DESCRIPTION_LENGTH} characters long.
 */
export const describeChart = (options: ChartRunOptions): string => {
    const title = options.title === undefined ? "" : titleOf(options.title).text.replace(/\s+/g, " ").trim();
    const heading = `${TYPE_NAMES[options.type]} chart${title ? `, ${title}` : ""}.`;
    return limitLength([heading, ...describeSeries(options)].join(" "), heading.length);
};

/**
 * The chart's alternative text: its own, with a description of the chart when it has none and isn't decorative.
 */
export const chartAltText = (options: ChartRunOptions): DocPropertiesOptions | undefined => {
    const { altText, decorative } = options;
    if (decorative || altText?.description) {
        return altText;
    }
    const description = describeChart(options);
    return altText ? { ...altText, description } : { name: "", description, title: "" };
};
