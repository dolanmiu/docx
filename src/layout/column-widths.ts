/**
 * Sizes the columns of a table whose cells don't all have widths, as Word sizes them to their text, and widens a column
 * of a table whose cells all have widths for a word longer than they give it, or evens out its rows where they give a
 * column different widths.
 *
 * @module
 */
import type { ContentWidths } from "../text-layout";
import type { Block, TableBlock, TableCell, TableRow } from "./read-document";

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

/**
 * The rows Word sizes a table's columns by: those it lays out, and those deleted in a tracked change, which it counts
 * though they take no room (`word-tracked-changes.docx` MK11h, MK11i)
 */
const sizingRows = ({ rows, deletedRows = [] }: TableBlock): readonly TableRow[] => [...rows, ...deletedRows];

/**
 * How narrow and how wide the content of each cell of a table can be, with the cell's margins, as Word sizes the columns
 * by it: with its deleted text in (MK11j)
 */
const measureCells = (table: TableBlock, measure: Measure): ReadonlyMap<TableCell, ContentWidths> =>
    new Map(
        sizingRows(table).flatMap(({ cells }) =>
            cells.map((cell) => {
                const text = measure(cell.sizing ?? cell.blocks);
                const margins = cell.marginLeft + cell.marginRight;
                return [cell, { min: text.min + margins, max: text.max + margins }];
            }),
        ),
    );

/** How far apart two widths, in points, can be and still be the same: a twentieth of a point, a twip */
const SAME = 0.05;

/**
 * How a cell across columns whose one word is wider than their widest lines shares it among them, as Word does: each
 * in proportion to its widest word and its widest line added together (`word-watertight-stops.docx` SP17, `word-probes.docx`
 * U1e). Words of 3000 to 6000 twips across "one" and "two words" gave the first 0.366 of them every time, and across
 * those and "three short words", 0.198, 0.343 and 0.459. In proportion to their widest lines, the first would have had
 * 0.324. Undefined where that isn't known: where a column would come out narrower than its widest line, which none did,
 * and, for columns given widths, where it gives other shares than their widths alone would, as only columns of the same
 * width and widest words have been seen (SP15c)
 */
const wordShares = (covered: readonly Column[], word: number): readonly number[] | undefined => {
    const weights = covered.map(({ min, width }) => min + width);
    const weight = sum(weights);
    const widest = sum(covered.map(({ width }) => width));
    const shares = weights.map((share) => (word * share) / weight);
    const known =
        shares.every((share, index) => share >= covered[index].width - SAME) &&
        (covered.every(({ given }) => !given) ||
            shares.every((share, index) => Math.abs(share - (word * covered[index].width) / widest) <= SAME));
    return known ? shares : undefined;
};

/**
 * Sizes the columns of a table to their text, as Word does (`word-probes.docx` U1), before they are fitted to the room. A
 * column is as wide as its cells across it alone give it, or, without, as their widest line, and never narrower than
 * their widest word. A column without a cell of its own is 0 wide (U1f). Then each cell across several columns, in the
 * rows' order (U1u), shares what its widest line, or the width it gives itself (U1h), needs beyond their widths among
 * them, in proportion to those. A column given a width shares by it, and is widened with the rest (U1g). Columns that
 * are all 0 wide share it equally, which Word's probes didn't show. A cell whose one word is wider than their widest
 * lines shares the word among them as `wordShares` does, and the columns keep its width when the table is narrowed, as
 * Word keeps them (`word-watertight-stops.docx` SP15c).
 */
const sizeColumns = (table: TableBlock, content: ReadonlyMap<TableCell, ContentWidths>): Sizing => {
    const cells = sizingRows(table).flatMap((row) => row.cells);
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
                const sharing = covered.filter(({ width }) => width > 0).length > 1;
                // A word wider than the columns' widest lines, and all the cell needs room for, is shared among them (SP17,
                // SP15c). How Word narrows them around it in a table sized to its text isn't known
                const shares = min > widest && sharing && min >= needed - SAME ? wordShares(covered, min) : undefined;
                if (shares !== undefined) {
                    return {
                        columns: before.map((column, index) =>
                            index >= from && index < to ? { ...column, width: shares[index - from], min: shares[index - from] } : column,
                        ),
                        unsettled: table.fit ? [...unsettled, "narrowed" as const] : unsettled,
                    };
                }
                // A word wider than the columns' widest words changes their widths in a way Word's probes didn't settle (U1m)
                // when they are narrowed, and always when it is wider than their widest lines and shared in a way not yet
                // seen, unless only one of them has any width to take it (U1f)
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
 * A word in a cell across several columns that is wider than their widest lines, and all the cell needs room for, is
 * shared among them in proportion to their widest words and widest lines added together, as Word shares it. Word
 * shares one wider than their widest words in a way not yet followed when the columns are narrowed to the room, and
 * one with more text beside it, or in a way not yet seen, when it is wider than their widest lines too. The table is
 * then returned as unsupported.
 *
 * A table whose cells all have widths keeps them, unless a word is longer than its cell gives it, or its rows give a
 * column different widths. Word then widens that column to the word, and makes each column as wide as the widest any
 * row gives it (`word-watertight-stops.docx` SP14). A table with no width of its own grows, up to the room, and one
 * with a width keeps it, its columns widened in proportion when they are narrower (SP15b), and narrowed toward their
 * widest words, each by its share of the width they would give up, as columns given widths are in a table sized to its
 * text, when they are wider. Columns whose widest words are wider than a table's own width are as wide as those, and
 * the table wider than its width and the page (SP15a). Word evens out the rows of a table laid out fixed in the same
 * way (SP14b), but widens no column of it for a long word.
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
    if (fit && sizingRows(table).some(({ cells }) => cells.some(({ vertical }) => vertical))) {
        return { ...table, unsupported: "text that runs up or down a cell of a table sized to its text" };
    }
    const content = measureCells(table, measure);
    // With space between cells, Word narrows the columns to keep the table's width (word-table-formats2.docx CS9)
    const spaced = table.cellSpacing !== undefined;
    if (widen) {
        const tooLong = sizingRows(table).flatMap(({ cells }) => cells.filter((cell) => content.get(cell)!.min > cell.ownWidth!));
        if (tooLong.length === 0 && !spaced && !widen.uneven) {
            return table;
        }
        if (tooLong.length > 0 && spaced) {
            return { ...table, unsupported: "a long word in a table with space between its cells" };
        }
        // Word widens no column of a table laid out fixed for a long word (`word-long-words.docx` L8), and how it evens out
        // the rows of one with a long word isn't known
        if (tooLong.length > 0 && widen.fixed) {
            return { ...table, unsupported: "a long word in a table laid out fixed whose rows give a column different widths" };
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
        // A table with a width of its own in twips keeps its columns as wide as their widest words when those don't fit in
        // it, past it and the page (`word-watertight-stops.docx` SP15a). Without, Word breaks a word longer than the room in
        // a way not yet followed, narrowing the other columns past their widest words (`word-long-words.docx` L7)
        if (sum(columns.map(({ min }) => min)) > room && (widen.width === undefined || widen.fixed)) {
            return { ...table, unsupported: "a word longer than its table can make room for" };
        }
        // A table wider than its cells has its columns widened in proportion to fill it, after a column is widened for a
        // long word (SP15b). With space between its cells, or laid out fixed, how isn't known
        if (target !== undefined && total < target && (spaced || widen.fixed)) {
            return {
                ...table,
                unsupported: spaced
                    ? "space between the cells of a table wider than its cells"
                    : "a table laid out fixed whose rows give a column different widths, narrower than the table",
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
 * widths of its cells added up, as they are laid out in its own width when it has one (`word-watertight-stops.docx` SP14,
 * SP15). Half of each of its left and right borders is outside its columns.
 *
 * @param measure - How narrow and how wide the content of a cell can be, in points
 */
export const tableWidths = (table: TableBlock, measure: Measure): ContentWidths => {
    const { fit, widen, borderLeft = 0, borderRight = 0 } = table;
    const laidOut = widen?.width === undefined ? table : fitColumns(table, widen.width, measure);
    const rows = laidOut === table || laidOut.unsupported !== undefined ? sizingRows(table) : laidOut.rows;
    const borders = (borderLeft + borderRight) / 2;
    if (fit !== undefined && fit.width === undefined) {
        const { columns } = sizeColumns(table, measureCells(table, measure));
        return { min: sum(columns.map(({ min }) => min)) + borders, max: sum(columns.map((column) => column.width)) + borders };
    }
    const width = fit?.width ?? largest(rows.map(({ cells }) => sum(cells.map((cell) => cell.width + cell.marginLeft + cell.marginRight))));
    return { min: width + borders, max: width + borders };
};
