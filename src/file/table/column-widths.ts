/**
 * Column width resolution for tables.
 *
 * Word lays a table out from its preferred widths (`w:tblW` / `w:tcW`) and only treats
 * the table grid (`w:tblGrid`) as a hint. Google Docs, Apple Pages, QuickLook and other
 * consumers do the opposite: they take the grid's absolute twip values as the physical
 * column widths and ignore percentage preferences. A grid of placeholder values therefore
 * collapses every column in those consumers, which is the long-standing "tables are
 * broken in Google Docs / Pages" report (#1457, #349, #216, #3015).
 *
 * This module derives a grid in twips from the table's and cells' preferred widths,
 * resolved against the width actually available to the table, so the table renders the
 * same everywhere. It is used when the caller does not supply explicit `columnWidths`.
 *
 * Reference: http://officeopenxml.com/WPtableGrid.php
 *
 * @module
 */
import { sectionMarginDefaults, sectionPageSizeDefaults } from "@file/document/body/section-properties/section-properties";
import { type UniversalMeasure, universalMeasureToTwips } from "@util/values";

import type { TableCell } from "./table-cell";
import type { TableRow } from "./table-row";
import { type ITableWidthProperties, WidthType } from "./table-width";

/**
 * Text width, in twips, of a section with the default page size and margins
 * (A4 portrait with 1 inch margins). Used when a table is formatted without access to
 * its section, e.g. by a bare `Formatter` or inside the patcher.
 */
export const DEFAULT_AVAILABLE_WIDTH =
    sectionPageSizeDefaults.WIDTH - sectionMarginDefaults.LEFT - sectionMarginDefaults.RIGHT - sectionMarginDefaults.GUTTER;

const columnSpanOf = (cell: TableCell): number => cell.options.columnSpan || 1;

/**
 * Resolves a preferred width (`ITableWidthProperties`) into twips.
 *
 * Percentages are taken relative to `referenceWidth`: the available text width for a
 * table, or the table width for a cell. Auto and nil widths express no preference.
 *
 * @param width - The preferred width, if any
 * @param referenceWidth - Width in twips that percentages are relative to
 * @returns The width in twips, or undefined when there is no usable preference
 */
export const resolvePreferredWidth = (width: ITableWidthProperties | undefined, referenceWidth: number): number | undefined => {
    if (!width) {
        return undefined;
    }

    const { type = WidthType.AUTO, size } = width;
    if (type !== WidthType.PERCENTAGE && type !== WidthType.DXA) {
        return undefined;
    }

    const twips =
        typeof size === "number"
            ? type === WidthType.PERCENTAGE
                ? (size / 100) * referenceWidth
                : size
            : size.endsWith("%")
              ? (Number(size.slice(0, -1)) / 100) * referenceWidth
              : universalMeasureToTwips(size as UniversalMeasure);

    return twips > 0 ? twips : undefined;
};

/**
 * Resolves the width of a table in twips.
 *
 * A table without a usable preferred width (auto, nil or non-positive) takes up the
 * whole available width, which is also what Word does when a table is inserted.
 *
 * @param width - The table's preferred width, if any
 * @param availableWidth - Width in twips available to the table
 * @returns The table width in twips
 */
export const resolveTableWidth = (width: ITableWidthProperties | undefined, availableWidth: number): number =>
    resolvePreferredWidth(width, availableWidth) ?? availableWidth;

/**
 * Counts the grid columns of a table: the largest number of columns (taking
 * `columnSpan` into account) spanned by any of its rows.
 */
export const countGridColumns = (rows: readonly TableRow[]): number =>
    Math.max(0, ...rows.map((row) => row.cells.reduce((count, cell) => count + columnSpanOf(cell), 0)));

/**
 * Derives the widths of a table's grid columns, in twips.
 *
 * The algorithm mirrors what Word writes into `w:tblGrid` after laying a table out:
 *
 * 1. The table width is resolved against the available width.
 * 2. Each column takes the preferred width of the first cell (top to bottom) that
 *    occupies exactly that column. Percentages are relative to the table width.
 * 3. Cells spanning several columns share their width among the spanned columns that
 *    are still unresolved.
 * 4. Any column still unresolved gets an equal share of what is left of the table
 *    width (or an equal share of the table width if nothing is left).
 *
 * @param options.rows - The table rows (including any vertical-merge continuation cells)
 * @param options.width - The table's preferred width
 * @param options.availableWidth - Width in twips available to the table (text width of the section, or the parent cell for nested tables)
 * @returns One width per grid column, rounded to whole twips
 *
 * @example
 * ```typescript
 * // A 100% table with 90% / 10% cells in a 9026 twip wide section
 * resolveColumnWidths({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, availableWidth: 9026 });
 * // => [8123, 903]
 * ```
 */
export const resolveColumnWidths = ({
    rows,
    width,
    availableWidth,
}: {
    readonly rows: readonly TableRow[];
    readonly width?: ITableWidthProperties;
    readonly availableWidth: number;
}): readonly number[] => {
    const columnCount = countGridColumns(rows);
    if (columnCount === 0) {
        return [];
    }

    const tableWidth = resolveTableWidth(width, availableWidth);
    // eslint-disable-next-line functional/prefer-readonly-type
    const widths: (number | undefined)[] = Array.from({ length: columnCount }, () => undefined);
    // eslint-disable-next-line functional/prefer-readonly-type
    const spanningCells: { readonly start: number; readonly span: number; readonly width: number }[] = [];

    for (const row of rows) {
        let column = 0;
        for (const cell of row.cells) {
            const span = columnSpanOf(cell);
            const cellWidth = resolvePreferredWidth(cell.options.width, tableWidth);
            if (cellWidth !== undefined) {
                if (span === 1) {
                    // eslint-disable-next-line functional/immutable-data
                    widths[column] ??= cellWidth;
                } else {
                    // eslint-disable-next-line functional/immutable-data
                    spanningCells.push({ start: column, span, width: cellWidth });
                }
            }
            column += span;
        }
    }

    for (const { start, span, width: cellWidth } of spanningCells) {
        const columns = Array.from({ length: span }, (_, i) => start + i).filter((column) => column < columnCount);
        const unresolvedSpanColumns = columns.filter((column) => widths[column] === undefined);
        const remaining = cellWidth - columns.reduce((sum, column) => sum + (widths[column] ?? 0), 0);
        if (unresolvedSpanColumns.length > 0 && remaining > 0) {
            for (const column of unresolvedSpanColumns) {
                // eslint-disable-next-line functional/immutable-data
                widths[column] = remaining / unresolvedSpanColumns.length;
            }
        }
    }

    const unresolvedColumns = widths.flatMap((columnWidth, column) => (columnWidth === undefined ? [column] : []));
    if (unresolvedColumns.length > 0) {
        const remaining = tableWidth - widths.reduce<number>((sum, columnWidth) => sum + (columnWidth ?? 0), 0);
        const share = remaining > 0 ? remaining / unresolvedColumns.length : tableWidth / columnCount;
        for (const column of unresolvedColumns) {
            // eslint-disable-next-line functional/immutable-data
            widths[column] = share;
        }
    }

    return widths.map((columnWidth) => Math.round(columnWidth as number));
};
