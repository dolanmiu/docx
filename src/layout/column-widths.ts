/**
 * Sizes the columns of a table whose cells don't all have widths, as Word sizes them to their text.
 *
 * @module
 */
import type { ContentWidths } from "../text-layout";
import type { Block, TableBlock } from "./read-document";

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

type Column = { readonly min: number; readonly width: number; readonly given: boolean };

/**
 * Narrows columns to fit the room, toward their widest words, each by its share of the width they would give up. Columns
 * whose widest words don't fit are as narrow as those.
 */
const narrowed = (columns: readonly Column[], room: number): readonly number[] => {
    const total = sum(columns.map(({ width }) => width));
    const least = sum(columns.map(({ min }) => min));
    return total <= room
        ? columns.map(({ width }) => width)
        : columns.map(({ min, width }) => (least >= room ? min : min + ((width - min) * (room - least)) / (total - least)));
};

/**
 * Sizes the columns of a table whose cells don't all have widths, as Word does, and gives each cell the width of its
 * column, less its margins. A column is as wide as its cells give it, or, without, as its widest line of text, and never
 * narrower than its widest word. A table with a width of its own has its columns widened in proportion to fill it.
 * When the columns are too wide for the room, those sized to their text are narrowed toward their widest words, each by
 * its share of the width they would give up, and those given widths keep them unless that isn't enough.
 *
 * @param available - The width the table is in, in points: the page's text, a column's, or a table cell's
 * @param measure - How narrow and how wide the content of a cell can be, in points
 */
export const fitColumns = (table: TableBlock, available: number, measure: (blocks: readonly Block[]) => ContentWidths): TableBlock => {
    const { fit, rows } = table;
    if (!fit) {
        return table;
    }
    const cells = rows.flatMap((row) => row.cells);
    const count = Math.max(0, ...cells.map(({ column }) => column + 1));
    const columns = Array.from({ length: count }, (_, column): Column => {
        const inColumn = cells.filter((cell) => cell.column === column);
        const content = inColumn.map((cell) => {
            const text = measure(cell.blocks);
            const margins = cell.marginLeft + cell.marginRight;
            return { min: text.min + margins, max: text.max + margins };
        });
        const min = Math.max(0, ...content.map((cell) => cell.min));
        const own = inColumn.flatMap(({ ownWidth }) => (ownWidth === undefined ? [] : [ownWidth]));
        const width = own.length > 0 ? Math.max(min, ...own) : Math.max(min, ...content.map((cell) => cell.max));
        return { min, width, given: own.length > 0 };
    });
    const total = sum(columns.map(({ width }) => width));
    const target = fit.width ?? (fit.share === undefined ? undefined : fit.share * available);
    const room = target ?? available;
    const given = columns.filter((column) => column.given);
    const sized = columns.filter((column) => !column.given);
    // The columns given widths are narrowed only as far as those sized to their text, at their widest words, need
    const givenWidths = narrowed(given, room - sum(sized.map(({ min }) => min)));
    const sizedWidths = narrowed(sized, room - sum(givenWidths));
    const widths = columns.map((column) => {
        if (target !== undefined && total < target && total > 0) {
            return (column.width * target) / total;
        }
        return column.given ? givenWidths[given.indexOf(column)] : sizedWidths[sized.indexOf(column)];
    });
    return {
        ...table,
        rows: rows.map((row) => ({
            ...row,
            cells: row.cells.map((cell) => ({ ...cell, width: widths[cell.column] - cell.marginLeft - cell.marginRight })),
        })),
    };
};
