/**
 * References to the cells of the embedded workbook's sheet, as a chart's formulas and the sheet's cells write them.
 *
 * @module
 */

/** The name of the workbook's only sheet, as Word names it */
export const SHEET_NAME = "Sheet1";

/**
 * The letters of a column, such as A for the first, Z for the 26th and AA for the 27th.
 *
 * @param column - The column's index, from 0
 */
export const columnName = (column: number): string =>
    (column >= 26 ? columnName(Math.floor(column / 26) - 1) : "") + String.fromCharCode(65 + (column % 26));

/**
 * A cell's name, such as B2.
 *
 * @param column - The column's index, from 0
 * @param row - The row's index, from 0
 */
export const cellName = (column: number, row: number): string => `${columnName(column)}${row + 1}`;

/**
 * A formula for a cell, or for cells down a column, such as `Sheet1!$B$1` or `Sheet1!$B$2:$B$5`.
 *
 * @param column - The column's index, from 0
 * @param firstRow - The first row's index, from 0
 * @param rows - The number of rows
 */
export const sheetReference = (column: number, firstRow: number, rows = 1): string => {
    const first = `$${columnName(column)}$${firstRow + 1}`;
    return rows === 1 ? `${SHEET_NAME}!${first}` : `${SHEET_NAME}!${first}:$${columnName(column)}$${firstRow + rows}`;
};
