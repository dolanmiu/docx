/**
 * Sizes the columns of a table whose cells don't all have widths, as Word sizes them to their text, and widens a column
 * of a table whose cells all have widths for a word longer than they give it.
 *
 * @module
 */
import type { ContentWidths } from "../text-layout";
import type { Block, TableBlock, TableCell } from "./read-document";

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** The largest of the values and the least given, without spreading them into `Math.max`, which takes too few for a long table */
const largest = (values: readonly number[], least = 0): number => values.reduce((most, value) => Math.max(most, value), least);

type Column = { readonly min: number; readonly width: number; readonly given: boolean };

type Measure = (blocks: readonly Block[]) => ContentWidths;

/**
 * The columns of a table sized to its text, and, for each cell across several columns with a word wider than their widest
 * words together, when Word shares it among them in a way not yet followed: always, or only when they are narrowed
 */
type Sizing = { readonly columns: readonly Column[]; readonly unsettled: readonly ("always" | "narrowed")[] };

/** How narrow and how wide the content of each cell of a table can be, with the cell's margins */
const measureCells = (table: TableBlock, measure: Measure): ReadonlyMap<TableCell, ContentWidths> =>
    new Map(
        table.rows.flatMap(({ cells }) =>
            cells.map((cell) => {
                const text = measure(cell.blocks);
                const margins = cell.marginLeft + cell.marginRight;
                return [cell, { min: text.min + margins, max: text.max + margins }];
            }),
        ),
    );

/**
 * Sizes the columns of a table to their text, as Word does (`word-probes.docx` U1), before they are fitted to the room. A
 * column is as wide as its cells across it alone give it, or, without, as their widest line, and never narrower than
 * their widest word. A column without a cell of its own is 0 wide (U1f). Then each cell across several columns, in the
 * rows' order (U1u), shares what its widest line, or the width it gives itself (U1h), needs beyond their widths among
 * them, in proportion to those. A column given a width shares by it, and is widened with the rest (U1g). Columns that
 * are all 0 wide share it equally, which Word's probes didn't show.
 */
const sizeColumns = (table: TableBlock, content: ReadonlyMap<TableCell, ContentWidths>): Sizing => {
    const cells = table.rows.flatMap((row) => row.cells);
    const spanOf = (cell: TableCell): number => cell.span ?? 1;
    const count = largest(cells.map((cell) => cell.column + spanOf(cell)));
    const columns = Array.from({ length: count }, (_, column): Column => {
        const inColumn = cells.filter((cell) => cell.column === column && spanOf(cell) === 1);
        const widths = inColumn.map((cell) => content.get(cell)!);
        const min = largest(widths.map((cell) => cell.min));
        const own = inColumn.flatMap(({ ownWidth }) => (ownWidth === undefined ? [] : [ownWidth]));
        const width = largest(own.length > 0 ? own : widths.map((cell) => cell.max), min);
        return { min, width, given: own.length > 0 };
    });
    return cells
        .filter((cell) => spanOf(cell) > 1)
        .reduce<Sizing>(
            ({ columns: before, unsettled }, cell) => {
                const { min, max } = content.get(cell)!;
                const from = cell.column;
                const to = from + spanOf(cell);
                const covered = before.slice(from, to);
                const widest = sum(covered.map(({ width }) => width));
                const needed = cell.ownWidth === undefined ? max : Math.max(min, cell.ownWidth);
                // A word wider than the columns' widest words changes their widths in a way Word's probes didn't settle (U1e,
                // U1m) when they are narrowed, and always when it is wider than their widest lines, unless only one of them
                // has any width to take it (U1f)
                const sharing = covered.filter(({ width }) => width > 0).length > 1;
                const longWord =
                    min > sum(covered.map((column) => column.min))
                        ? [min > widest && sharing ? ("always" as const) : ("narrowed" as const)]
                        : [];
                const share = (column: Column): number => (widest > 0 ? column.width / widest : 1 / covered.length);
                return {
                    columns:
                        needed > widest
                            ? before.map((column, index) =>
                                  index >= from && index < to
                                      ? { ...column, width: column.width + (needed - widest) * share(column) }
                                      : column,
                              )
                            : before,
                    unsettled: [...unsettled, ...longWord],
                };
            },
            { columns, unsettled: [] },
        );
};

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
 * columns, less its margins. A column is as wide as its cells across it alone give it, or, without, as their widest
 * line of text, and never narrower than their widest word. A cell across several columns widens them, in proportion to
 * their widths, where its widest line, or its own width, needs more. A table with a width of its own has its columns
 * widened in proportion to fill it. When the columns are too wide for the room, those sized to their text are narrowed
 * toward their widest words, each by its share of the width they would give up, and those given widths keep them unless
 * that isn't enough.
 *
 * Word shares a word in a cell across several columns that is wider than their widest words together in a way not yet
 * followed, when it is wider than their widest lines too, or when the columns are narrowed to the room. The table is
 * then returned as unsupported.
 *
 * A table whose cells all have widths keeps them, unless a word is longer than its cell gives it. Word then widens that
 * column to the word. A table with no width of its own grows, up to the room, and one with a width keeps it, and the
 * other columns are narrowed toward their widest words, each by its share of the width they would give up, as columns
 * given widths are in a table sized to its text.
 *
 * @param available - The width the table is in, in points: the page's text, a column's, or a table cell's
 * @param measure - How narrow and how wide the content of a cell can be, in points
 */
export const fitColumns = (table: TableBlock, available: number, measure: Measure): TableBlock => {
    const { fit, widen, rows, indent = 0 } = table;
    if (!fit && !widen) {
        return table;
    }
    // How Word sizes a column whose text runs up or down isn't known
    if (fit && rows.some(({ cells }) => cells.some(({ vertical }) => vertical))) {
        return { ...table, unsupported: "text that runs up or down a cell of a table sized to its text" };
    }
    const content = measureCells(table, measure);
    // With space between cells, Word narrows the columns to keep the table's width (word-table-formats2.docx CS9)
    const spaced = table.cellSpacing !== undefined;
    if (widen) {
        const tooLong = rows.flatMap(({ cells }) => cells.filter((cell) => content.get(cell)!.min > cell.ownWidth!));
        if (tooLong.length === 0 && !spaced) {
            return table;
        }
        if (tooLong.length > 0 && widen.acrossColumns) {
            return { ...table, unsupported: "a word longer than its cell in a table with cells merged across columns" };
        }
        if (tooLong.length > 0 && spaced) {
            return { ...table, unsupported: "a long word in a table with space between its cells" };
        }
        if (tooLong.some(({ vertical }) => vertical)) {
            return { ...table, unsupported: "a long word in text that runs up or down a table cell" };
        }
    }
    const { columns, unsettled } = sizeColumns(table, content);
    const total = sum(columns.map(({ width }) => width));
    const tableWidth = fit ?? widen!;
    const target = tableWidth.width ?? (tableWidth.share === undefined ? undefined : tableWidth.share * available);
    // A table sized to its text in the width it is in, or one whose cells all have widths, which grows up to it for a long
    // word, takes its indent from it, as in Word (`word-watertight-tables.docx` TB9, `word-table-formats.docx` TI1, TI3
    // and TI4). One with a width of its own, or a share of the width, keeps it (TI2)
    const room = target ?? available - indent;
    if (widen) {
        // Word breaks a word longer than the room in a way not yet followed, narrowing the other columns past their widest
        // words, and how it widens a table wider than its cells around a long word isn't known
        if (sum(columns.map(({ min }) => min)) > room) {
            return { ...table, unsupported: "a word longer than its table can make room for" };
        }
        if (target !== undefined && total < target) {
            return {
                ...table,
                unsupported: spaced
                    ? "space between the cells of a table wider than its cells"
                    : "a long word in a table wider than its cells",
            };
        }
    }
    if (unsettled.includes("always") || (unsettled.length > 0 && total > room)) {
        return { ...table, unsupported: "a long word in cells merged across columns" };
    }
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
            cells: row.cells.map((cell) => ({
                ...cell,
                width: sum(widths.slice(cell.column, cell.column + (cell.span ?? 1))) - cell.marginLeft - cell.marginRight,
            })),
        })),
    };
};

/**
 * How narrow and how wide a table in a table cell is, as Word counts it to size the cell's column (`word-probes.docx` U1n
 * to U1t): its own width in points, or, sized to its text, its columns' widest words and widest lines added up, or the
 * widths of its cells added up. Half of each of its left and right borders is outside its columns.
 *
 * @param measure - How narrow and how wide the content of a cell can be, in points
 */
export const tableWidths = (table: TableBlock, measure: Measure): ContentWidths => {
    const { fit, rows, borderLeft = 0, borderRight = 0 } = table;
    const borders = (borderLeft + borderRight) / 2;
    if (fit !== undefined && fit.width === undefined) {
        const { columns } = sizeColumns(table, measureCells(table, measure));
        return { min: sum(columns.map(({ min }) => min)) + borders, max: sum(columns.map((column) => column.width)) + borders };
    }
    const width = fit?.width ?? largest(rows.map(({ cells }) => sum(cells.map((cell) => cell.width + cell.marginLeft + cell.marginRight))));
    return { min: width + borders, max: width + borders };
};
