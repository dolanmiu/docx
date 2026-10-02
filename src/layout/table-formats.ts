/**
 * Reads the formatting of a table that changes how its rows and cells are laid out, beyond their widths: its borders and
 * its cells', the space between its cells, and which parts of its table style apply to each cell.
 *
 * @module
 */
import { TWIPS_PER_POINT, attributesOf, childrenOf, find, isOff, numberOf, pointsOf } from "../text-layout";

// Border widths are in eighths of a point
const EIGHTHS_PER_POINT = 8;

/**
 * A border as it is written: its style, its width in points, and the space between it and the text, in points. One that
 * is nil or none, or has no width, is "none"
 */
export type Border = { readonly style: string; readonly width: number; readonly space?: number };

/** The borders of a table or of a cell, by their side, each when it is given */
export type BorderSet = Partial<Record<"top" | "bottom" | "left" | "right" | "insideH" | "insideV", Border>>;

const NONE: Border = { style: "none", width: 0 };

/**
 * The room a border of each style takes from what is beside it, in points, from its width, as Word's PDFs showed it at
 * half a point, 1.5 points and 3 points (`word-table-formats.docx` and `word-table-formats2.docx` BS, `word-rules.docx`
 * P5): a line its width, a double line three times it, a triple five times it, and lines with gaps between them their
 * thick line's width, or twice or three times it, and 1.5, 2.25 or 3 points more. A double wave and a stroked dash-dot
 * line take 5.25 and 3 points whatever their width
 */
const ROOMS: Readonly<Record<string, (width: number) => number>> = {
    ...Object.fromEntries(
        ["single", "thick", "dotted", "dashed", "dotDash", "dotDotDash", "dashSmallGap", "outset", "inset"].map((style) => [
            style,
            (width: number) => width,
        ]),
    ),
    double: (width) => 3 * width,
    triple: (width) => 5 * width,
    thinThickSmallGap: (width) => width + 1.5,
    thickThinSmallGap: (width) => width + 1.5,
    thinThickThinSmallGap: (width) => width + 3,
    thinThickMediumGap: (width) => 2 * width,
    thickThinMediumGap: (width) => 2 * width,
    thinThickThinMediumGap: (width) => 3 * width,
    thinThickLargeGap: (width) => width + 2.25,
    thickThinLargeGap: (width) => width + 2.25,
    thinThickThinLargeGap: (width) => 2 * width + 3,
    doubleWave: () => 5.25,
    dashDotStroked: () => 3,
};

/**
 * The room borders of the styles whose room doesn't follow from their width take, in points, by their width: only at
 * the widths Word's PDFs have shown them at
 */
const ROOMS_BY_WIDTH: Readonly<Record<string, Readonly<Record<number, number>>>> = {
    wave: { 0.5: 3, 1.5: 3.75, 3: 3 },
    threeDEmboss: { 0.5: 2, 1.5: 3, 3: 6 },
    threeDEngrave: { 0.5: 2, 1.5: 3, 3: 6 },
};

/** Reads a border (`w:top` and the others, in `w:tblBorders` and `w:tcBorders`) */
const readBorder = (element: unknown): Border => {
    const attributes = attributesOf(element);
    const style = String(attributes["w:val"] ?? "none");
    const width = (numberOf(attributes["w:sz"]) ?? 0) / EIGHTHS_PER_POINT;
    const space = numberOf(attributes["w:space"]) ?? 0;
    return style === "nil" || style === "none" || width === 0 ? NONE : { style, width, ...(space > 0 ? { space } : {}) };
};

const SIDES = [
    ["top", ["w:top"]],
    ["bottom", ["w:bottom"]],
    ["left", ["w:start", "w:left"]],
    ["right", ["w:end", "w:right"]],
    ["insideH", ["w:insideH"]],
    ["insideV", ["w:insideV"]],
] as const;

/**
 * Reads the borders of a table (`w:tblBorders`) or a cell (`w:tcBorders`): those it gives, by their side. A cell's start
 * and end are its left and right, as they are in text that runs left to right.
 */
export const readBorderSet = (element: unknown): BorderSet => {
    const children = childrenOf(element);
    return Object.fromEntries(
        SIDES.flatMap(([side, names]) => {
            const given = names.map((name) => find(children, name)).find((border) => border !== undefined);
            return given === undefined ? [] : [[side, readBorder(given)]];
        }),
    );
};

/** Whether a border is drawn */
export const isDrawn = (border: Border | undefined): border is Border => border !== undefined && border.style !== "none";

/**
 * The room a border takes from what is beside it, in points: its line's room and the space between it and the text,
 * which Word adds to it (BS31). Undefined for a style or width whose room Word's PDFs haven't shown.
 */
export const roomOf = (border: Border | undefined): number | undefined => {
    if (!isDrawn(border)) {
        return 0;
    }
    const { style, width, space = 0 } = border;
    const room = ROOMS[style]?.(width) ?? ROOMS_BY_WIDTH[style]?.[width];
    return room === undefined ? undefined : room + space;
};

/**
 * The border Word draws where two cells meet: the one there is, when the other is none, and the wider of two of the same
 * style, as in Word (`word-table-formats.docx` BC2 to BC5). Undefined where Word's choice isn't known: between two of
 * different styles.
 */
export const borderBetween = (one: Border, other: Border): Border | undefined => {
    if (!isDrawn(one) || !isDrawn(other)) {
        return isDrawn(one) ? one : other;
    }
    if (one.style !== other.style) {
        return undefined;
    }
    return one.width >= other.width ? one : other;
};

/** A cell's place in its row, and the borders it gives itself, to work out the borders between it and the cells around it */
export type BorderedCell = {
    readonly column: number;
    readonly span?: number;
    readonly verticalMerge?: "restart" | "continue";
    readonly borders: BorderSet;
};

/** The room of the borders of each row of a table, in points */
export type RowBorders = {
    /** Above each row: between it and the row before, or the table's top for the first */
    readonly tops: readonly number[];
    /** Below the last row */
    readonly bottom: number;
    /** Below each row on a page where the table breaks after it */
    readonly breaks: readonly number[];
};

/** The room a border takes, or why it isn't known: one Word's choice of isn't known is undefined */
const roomOrWhy = (border: Border | undefined): number | string =>
    border === undefined
        ? "table cell borders of different styles that meet"
        : (roomOf(border) ?? "a table border in a style not yet followed");

/** The wider of two borders' rooms, or why one isn't known */
const wider = (one: number | string, other: number | string): number | string =>
    typeof one === "string" ? one : typeof other === "string" ? other : Math.max(one, other);

/** The widest room of borders, or why it isn't known */
const widest = (borders: readonly (Border | undefined)[]): number | string =>
    borders.reduce<number | string>((room, border) => wider(room, roomOrWhy(border)), 0);

/**
 * The room the borders of a table's rows take, in points. Each cell's side has its own border, or else the table's
 * there, and where two cells meet Word draws one of their borders (`borderBetween`). Each row is as much taller as the
 * widest of its cells' borders (`word-table-formats.docx` BC1). A cell merged down from the row above has none between
 * them. Where a table breaks across pages, Word draws below the last row on the page its cells' bottom borders, or the
 * table's (BB1 and BB2, `word-line-heights.docx` T1). Why, where Word's choice or a border's room isn't known.
 */
export const rowBorders = (rows: readonly (readonly BorderedCell[])[], table: BorderSet): RowBorders | string => {
    const covering = (cells: readonly BorderedCell[], column: number): BorderedCell | undefined =>
        cells.find((cell) => cell.column <= column && column < cell.column + (cell.span ?? 1));
    const insideH = table.insideH ?? NONE;
    const boundary = (index: number): number | string => {
        const below = rows[index] ?? [];
        const above = rows[index - 1] ?? [];
        const bottomOf = (cell: BorderedCell): Border => cell.borders.bottom ?? (index === rows.length ? (table.bottom ?? NONE) : insideH);
        const topOf = (cell: BorderedCell): Border => cell.borders.top ?? (index === 0 ? (table.top ?? NONE) : insideH);
        const fromBelow = below.reduce<number | string>((room, cell) => {
            if (cell.verticalMerge === "continue") {
                return room;
            }
            const over = covering(above, cell.column);
            return wider(room, roomOrWhy(over === undefined ? topOf(cell) : borderBetween(bottomOf(over), topOf(cell))));
        }, 0);
        // Where the row below has no cell, the cell above has its bottom border
        return above.reduce<number | string>(
            (room, cell) => (covering(below, cell.column) === undefined ? wider(room, roomOrWhy(bottomOf(cell))) : room),
            fromBelow,
        );
    };
    const all = Array.from({ length: rows.length + 1 }, (_, index) => boundary(index));
    const breaks = rows.map((cells) =>
        cells.reduce<number | string>((room, cell) => wider(room, roomOrWhy(cell.borders.bottom ?? table.bottom ?? NONE)), 0),
    );
    const unsupported =
        all.find((room): room is string => typeof room === "string") ?? breaks.find((room): room is string => typeof room === "string");
    return (
        unsupported ?? {
            tops: all.slice(0, -1) as readonly number[],
            bottom: all[all.length - 1] as number,
            breaks: breaks as readonly number[],
        }
    );
};

/**
 * The room the borders left and right of each cell of a row take, in points: its own, or the table's at the table's
 * edges and between its cells, and where two cells meet the one Word draws (`borderBetween`). Why, where Word's choice
 * or a border's room isn't known.
 */
export const sideBorders = (
    cells: readonly BorderedCell[],
    table: BorderSet,
): readonly { readonly left: number; readonly right: number }[] | string => {
    if (cells.length === 0) {
        return [];
    }
    const insideV = table.insideV ?? NONE;
    const leftOf = (index: number): Border => cells[index].borders.left ?? (index === 0 ? (table.left ?? NONE) : insideV);
    const rightOf = (index: number): Border => cells[index].borders.right ?? (index === cells.length - 1 ? (table.right ?? NONE) : insideV);
    const edges = Array.from({ length: cells.length + 1 }, (_, index) =>
        index === 0 ? leftOf(0) : index === cells.length ? rightOf(index - 1) : borderBetween(rightOf(index - 1), leftOf(index)),
    );
    const rooms = edges.map(roomOrWhy);
    const unsupported = rooms.find((room): room is string => typeof room === "string");
    return unsupported ?? cells.map((_, index) => ({ left: rooms[index] as number, right: rooms[index + 1] as number }));
};

/**
 * The space between a table's cells (`w:tblCellSpacing`), in points: none when it isn't given, or is `nil`. Undefined
 * when it is a share of the table's width, which Word's PDFs haven't shown.
 */
export const readCellSpacing = (element: unknown): number | undefined => {
    if (element === undefined) {
        return 0;
    }
    const { "w:w": value, "w:type": type = "dxa" } = attributesOf(element);
    if (type === "nil") {
        return 0;
    }
    return type === "dxa" ? Math.max(0, pointsOf(value, TWIPS_PER_POINT) ?? 0) : undefined;
};

/**
 * Which parts of its table style a table turns on (`w:tblLook`): those for its first and last rows and columns, and its
 * bands of rows and of columns.
 */
export type TableLook = {
    readonly firstRow: boolean;
    readonly lastRow: boolean;
    readonly firstColumn: boolean;
    readonly lastColumn: boolean;
    readonly rowBands: boolean;
    readonly columnBands: boolean;
};

// The bits of `w:val` for each part (ST_ShortHexNumber), as Word 2007 writes them
const LOOK_BITS = { firstRow: 0x20, lastRow: 0x40, firstColumn: 0x80, lastColumn: 0x100, noHBand: 0x200, noVBand: 0x400 } as const;

/**
 * Reads which parts of its table style a table turns on (`w:tblLook`), from its attributes, as Word 2010 and later write
 * them, or from the bits of `w:val`, as Word 2007 writes them. Undefined when the table doesn't say.
 */
export const readTableLook = (element: unknown): TableLook | undefined => {
    if (element === undefined) {
        return undefined;
    }
    const attributes = attributesOf(element);
    const bits = Number.parseInt(String(attributes["w:val"] ?? "0"), 16) || 0;
    const on = (name: keyof typeof LOOK_BITS): boolean => {
        const value = attributes[`w:${name}`];
        // Whether the part's bit is set
        return value === undefined ? Math.floor(bits / LOOK_BITS[name]) % 2 === 1 : !isOff(value);
    };
    return {
        firstRow: on("firstRow"),
        lastRow: on("lastRow"),
        firstColumn: on("firstColumn"),
        lastColumn: on("lastColumn"),
        rowBands: !on("noHBand"),
        columnBands: !on("noVBand"),
    };
};

/** Where a cell is in its table: its row and the rows of the table, and its place among the cells of its row */
export type CellPosition = { readonly row: number; readonly rows: number; readonly cell: number; readonly cells: number };

/**
 * The parts of a table style that apply to a cell (`w:tblStylePr`), by its position in the table, the parts the table
 * turns on, and the sizes of its style's bands, in the order they apply, each over those before, as Word applies them
 * (`word-table-formats.docx` CF1 to CF6). Word applies bands only of a style that gives their size, and counts them from
 * the first row and column that aren't the first row or column it applies. It doesn't apply `wholeTable`.
 */
export const conditionalTypesOf = (
    { row, rows, cell, cells }: CellPosition,
    look: TableLook,
    bands: { readonly rows?: number; readonly columns?: number },
): readonly string[] => {
    const firstRow = look.firstRow && row === 0;
    const lastRow = look.lastRow && row === rows - 1;
    const firstColumn = look.firstColumn && cell === 0;
    const lastColumn = look.lastColumn && cell === cells - 1;
    const bandOf = (on: boolean, size: number | undefined, index: number, edge: boolean): number | undefined =>
        on && size !== undefined && size > 0 && !edge ? Math.floor(index / size) % 2 : undefined;
    const rowBand = bandOf(look.rowBands, bands.rows, row - (look.firstRow ? 1 : 0), firstRow || lastRow);
    const columnBand = bandOf(look.columnBands, bands.columns, cell - (look.firstColumn ? 1 : 0), firstColumn || lastColumn);
    return [
        ...(rowBand === undefined ? [] : [rowBand === 0 ? "band1Horz" : "band2Horz"]),
        ...(columnBand === undefined ? [] : [columnBand === 0 ? "band1Vert" : "band2Vert"]),
        ...(firstColumn ? ["firstCol"] : []),
        ...(lastColumn ? ["lastCol"] : []),
        ...(firstRow ? ["firstRow"] : []),
        ...(lastRow ? ["lastRow"] : []),
        ...(firstRow && lastColumn ? ["neCell"] : []),
        ...(firstRow && firstColumn ? ["nwCell"] : []),
        ...(lastRow && lastColumn ? ["seCell"] : []),
        ...(lastRow && firstColumn ? ["swCell"] : []),
    ];
};

/** The margins of a cell, in points */
export type Margins = { readonly top: number; readonly bottom: number; readonly left: number; readonly right: number };

/**
 * A cell as the room around its text is worked out from: where it is, its borders and margins, and its width in points,
 * its own or the grid's
 */
export type PlacedCell = BorderedCell & { readonly margins: Margins; readonly gridWidth: number };

/** The room around each row's cells, and the room left and right of each cell's text, in points */
export type TableGeometry = readonly {
    /** Above the row's text: its borders, and the space between cells, its margins aside */
    readonly borderTop: number;
    /** Below the row's text, the same: of the last row only, unless there is space between cells */
    readonly borderBottom: number;
    /**
     * Below the row on a page where the table breaks after it, more than `borderBottom`. Undefined where Word's isn't known:
     * with space between cells and borders
     */
    readonly breakBorder?: number;
    /** Left and right of each cell's text, with its margins, and the width of its text */
    readonly cells: readonly { readonly left: number; readonly right: number; readonly width: number }[];
}[];

/**
 * The room around the text of a table's rows and cells: its borders and its cells' (`rowBorders`, `sideBorders`), and
 * the space between its cells.
 *
 * Without space between cells, a cell's text is as far in from its left and right edges as its margin, or half the
 * border there when that is more, as in Word (`word-table-formats.docx` BC7 to BC9, `word-table-formats2.docx` BC10 and
 * BC11).
 *
 * With space between cells, each cell has borders of its own, its own or else the table's: the table's top above the
 * first row, its bottom below the last, and its inside borders between them; and the table has its own around them. Each
 * row has its space above and below its cells' borders, and the table its space inside its own borders (CS1 to CS4,
 * CS13). Where the table breaks across pages, the row on the page keeps the space below it, and the next page's starts
 * with the space above it (CS12). Across, the space is around each cell and inside the table's edges, as margins are
 * (`word-watertight-tables.docx` TB4, `word-table-formats.docx` CS5 to CS8, `word-table-formats2.docx` CS9, CS10, CS14).
 */
export const tableGeometry = (
    rows: readonly { readonly cells: readonly PlacedCell[]; readonly spacing: number }[],
    table: { readonly borders: BorderSet; readonly spacing: number },
): TableGeometry | string => {
    const { borders, spacing } = table;
    if (spacing === 0) {
        const vertical = rowBorders(
            rows.map(({ cells }) => cells),
            borders,
        );
        if (typeof vertical === "string") {
            return vertical;
        }
        const across = rows.map(({ cells }) => sideBorders(cells, borders));
        const unsupported = across.find((sides): sides is string => typeof sides === "string");
        if (unsupported !== undefined) {
            return unsupported;
        }
        return rows.map(({ cells }, index) => ({
            borderTop: vertical.tops[index],
            borderBottom: index === rows.length - 1 ? vertical.bottom : 0,
            breakBorder: vertical.breaks[index],
            cells: cells.map(({ margins, gridWidth }, cell) => {
                const sides = (across[index] as readonly { readonly left: number; readonly right: number }[])[cell];
                const left = Math.max(margins.left, sides.left / 2);
                const right = Math.max(margins.right, sides.right / 2);
                return { left, right, width: gridWidth - left - right };
            }),
        }));
    }
    // With space between cells, borders left and right of cells aren't known yet (word-table-formats2.docx CS11)
    const cellBorders = rows.flatMap(({ cells }) => cells.map((cell) => cell.borders));
    if ([borders.left, borders.right, borders.insideV, ...cellBorders.flatMap((set) => [set.left, set.right])].some(isDrawn)) {
        return "space between table cells beside borders left or right of them";
    }
    const last = rows.length - 1;
    const rooms = rows.map(({ cells }, index) => ({
        tops: widest(cells.map((cell) => cell.borders.top ?? (index === 0 ? borders.top : borders.insideH) ?? NONE)),
        bottoms: widest(cells.map((cell) => cell.borders.bottom ?? (index === last ? borders.bottom : borders.insideH) ?? NONE)),
    }));
    const [top, bottom] = [widest([borders.top ?? NONE]), widest([borders.bottom ?? NONE])];
    const unknown = [top, bottom, ...rooms.flatMap(({ tops, bottoms }) => [tops, bottoms])].find(
        (room): room is string => typeof room === "string",
    );
    if (unknown !== undefined) {
        return unknown;
    }
    const bordered = [borders.top, borders.bottom, borders.insideH, ...cellBorders.flatMap((set) => [set.top, set.bottom])].some(isDrawn);
    return rows.map(({ cells, spacing: own }, index) => {
        const { tops, bottoms } = rooms[index] as { readonly tops: number; readonly bottoms: number };
        return {
            borderTop: tops + own + (index === 0 ? spacing + (top as number) : 0),
            borderBottom: bottoms + own + (index === last ? spacing + (bottom as number) : 0),
            ...(bordered ? {} : { breakBorder: 0 }),
            cells: cells.map(({ margins, gridWidth }, cell) => {
                const left = margins.left + own + (cell === 0 ? spacing : 0);
                const right = margins.right + own + (cell === cells.length - 1 ? spacing : 0);
                return { left, right, width: gridWidth - left - right };
            }),
        };
    });
};
