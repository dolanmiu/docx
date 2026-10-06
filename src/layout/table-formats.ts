/**
 * Reads the formatting of a table that changes how its rows and cells are laid out, beyond their widths: its borders and
 * its cells', the space between its cells, and which parts of its table style apply to each cell.
 *
 * @module
 */
import { TWIPS_PER_POINT, WIDEST_ART_BORDER, attributesOf, childrenOf, find, isArtBorder, isOff, numberOf, pointsOf } from "../text-layout";

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
 * The room 3D borders take, in points, by their width, at the widths Word offers: their width and 1.5 points up to 2.25
 * points wide, and their width and 3 points from 3 points (`word-table-formats.docx` BS, `word-stops-table-borders.docx`
 * TB4g to TB4r)
 */
const THREE_D_ROOMS = { 0.25: 1.75, 0.5: 2, 0.75: 2.25, 1: 2.5, 1.5: 3, 2.25: 3.75, 3: 6, 4.5: 7.5, 6: 9 };

/**
 * The room borders of the styles whose room doesn't follow from their width take, in points, by their width: only at
 * the widths Word's PDFs have shown them at. A wave takes 3 points at each width Word offers, but 3.75 at 1.5 points
 * (BS, TB4a to TB4f)
 */
const ROOMS_BY_WIDTH: Readonly<Record<string, Readonly<Record<number, number>>>> = {
    wave: { 0.25: 3, 0.5: 3, 0.75: 3, 1: 3, 1.5: 3.75, 2.25: 3, 3: 3, 4.5: 3, 6: 3 },
    threeDEmboss: THREE_D_ROOMS,
    threeDEngrave: THREE_D_ROOMS,
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

// How heavy Word counts a border of each style, by its width in eighths of a point, where two cells' borders meet: dotted
// and dashed lines weigh 1 whatever their width (MS-OI29500, Part 1, 17.4.66)
const WEIGHTS: Readonly<Record<string, number>> = {
    single: 1,
    thick: 2,
    double: 3,
    dotDash: 8,
    dotDotDash: 9,
    triple: 10,
    thinThickSmallGap: 11,
    thickThinSmallGap: 12,
    thinThickThinSmallGap: 13,
    thinThickMediumGap: 14,
    thickThinMediumGap: 15,
    thinThickThinMediumGap: 16,
    thinThickLargeGap: 17,
    thickThinLargeGap: 18,
    thinThickThinLargeGap: 19,
    wave: 20,
    doubleWave: 21,
    dashSmallGap: 22,
    dashDotStroked: 23,
    threeDEmboss: 24,
    threeDEngrave: 25,
    outset: 26,
    inset: 27,
};
const UNWEIGHED = new Set(["dotted", "dashed"]);
// Of two borders as heavy, Word draws the one later in this list
const PRECEDENCE = [
    "single",
    "thick",
    "double",
    "dotted",
    "dashed",
    "dotDash",
    "dotDotDash",
    "triple",
    "thinThickSmallGap",
    "thickThinSmallGap",
    "thinThickThinSmallGap",
    "thinThickMediumGap",
    "thickThinMediumGap",
    "thinThickThinMediumGap",
    "thinThickLargeGap",
    "thickThinLargeGap",
    "thinThickThinLargeGap",
    "wave",
    "doubleWave",
    "dashSmallGap",
    "dashDotStroked",
    "threeDEmboss",
    "threeDEngrave",
    "outset",
    "inset",
];

/** How heavy Word counts a border where two cells' borders meet: nothing, for a style it doesn't weigh, such as art */
const weightOf = ({ style, width }: Border): number => (UNWEIGHED.has(style) ? 1 : (WEIGHTS[style] ?? 0) * width * EIGHTHS_PER_POINT);

/**
 * The border Word draws where two cells meet: the one there is, when the other is none, and otherwise the heavier, its
 * width in eighths of a point times a number for its style, or of two as heavy, the later of their styles in Word's list
 * (MS-OI29500, Part 1, 17.4.66; `word-stops-table-borders.docx` TB1 and TB2: a double border of half a point over a
 * single one of 1.5 points, and a single one of 1.5 points over a dotted one; `word-stops-table-borders2.docx` BT1a and
 * `word-stops-tables3.docx` BT7a, BT7b: a dotted and dashed line of 1 point over a single one of 6, whichever cell's it
 * is; BT7c: a thin and thick line of half a point over a single one of 3). Two of the same style and width are the same
 * border.
 */
export const borderBetween = (one: Border, other: Border): Border => {
    if (!isDrawn(one) || !isDrawn(other)) {
        return isDrawn(one) ? one : other;
    }
    const [weight, otherWeight] = [weightOf(one), weightOf(other)];
    if (weight !== otherWeight) {
        return weight > otherWeight ? one : other;
    }
    return PRECEDENCE.indexOf(other.style) > PRECEDENCE.indexOf(one.style) ? other : one;
};

/**
 * The room a border takes from what is beside it, in points: its line's room and the space between it and the text,
 * which Word adds to it (BS31). An art border's width is in points, where a line's is in eighths of one, and it takes that
 * many above and below a cell's text (`word-stops-table-borders.docx` TB4w and TB4x, `word-stops-table-borders2.docx`
 * BT2a to BT2e: apples and triangles of 6, 12, 20 and 31 points, and BT1h, where apples and triangles of 12 meet). Undefined
 * for a style or width whose room Word's PDFs haven't shown.
 */
export const roomOf = (border: Border | undefined): number | undefined => {
    if (!isDrawn(border)) {
        return 0;
    }
    const { style, width, space = 0 } = border;
    if (isArtBorder(style)) {
        const art = width * EIGHTHS_PER_POINT;
        return art <= WIDEST_ART_BORDER ? art + space : undefined;
    }
    const room = ROOMS[style]?.(width) ?? ROOMS_BY_WIDTH[style]?.[width];
    return room === undefined ? undefined : room + space;
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

/** The room a border takes, or why it isn't known */
const roomOrWhy = (border: Border | undefined): number | string => roomOf(border) ?? "a table border in a style not yet followed";

/** The wider of two borders' rooms, or why one isn't known */
const wider = (one: number | string, other: number | string): number | string =>
    typeof one === "string" ? one : typeof other === "string" ? other : Math.max(one, other);

/** The widest room of borders, or why it isn't known */
const widest = (borders: readonly (Border | undefined)[]): number | string =>
    borders.reduce<number | string>((room, border) => wider(room, roomOrWhy(border)), 0);

/**
 * The room the borders of a table's rows take, in points. Each cell's side has its own border, or else the table's
 * there. Where two cells meet, Word draws one of their borders (see `sideBorders`), but makes room for the wider, whichever
 * it draws (`word-stops-table-borders.docx` TB3d: a dotted border of 1.5 points meeting a single one of half a point
 * takes 1.5 points, below the single one Word draws), so each row is as much taller as the widest of its cells' borders
 * and those of the cells above them (`word-table-formats.docx` BC1, TB1 to TB3). A cell merged down from the row above
 * has none between them. Where a table breaks across pages, Word draws below the last row on the page its cells' bottom
 * borders, or the table's (BB1 and BB2, `word-line-heights.docx` T1). Why, where a border's room isn't known.
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
            return wider(wider(room, roomOrWhy(topOf(cell))), over === undefined ? 0 : roomOrWhy(bottomOf(over)));
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
 * The room of the border right of a cell's text where its border meets the next cell's, in points: the room of the one
 * Word draws there (`borderBetween`), which Word's PDFs have shown when it is no wider than the other, and when it is the
 * cell's own and the next cell has none. Where Word draws the wider of two, or the next cell's over none of the cell's
 * own, whether it keeps the text from the border it draws or from the narrower isn't known, so the narrower's room comes
 * too (`unsettled`). Why, where a border's room isn't known.
 */
const roomBefore = (own: Border, next: Border): { readonly room: number; readonly unsettled?: number } | string => {
    const drawn = borderBetween(own, next);
    const [room, otherRoom] = [roomOrWhy(drawn), roomOrWhy(drawn === own ? next : own)];
    if (typeof room === "string") {
        return room;
    }
    if (typeof otherRoom === "string") {
        return otherRoom;
    }
    return room <= otherRoom || !isDrawn(next) ? { room } : { room, unsettled: otherRoom };
};

/**
 * The room the borders left and right of each cell of a row take beside its text, in points: its own, or the table's at
 * the table's edges and between its cells. Where two cells meet (`meeting`), Word draws the heavier of their borders, by
 * Word's weights for their styles (`word-stops-table-borders.docx` TB1 and TB2), and keeps the text of the cell after them
 * from its own border, whichever it draws and whichever is wider (`word-stops-table-borders2.docx` BT1a to BT1e, with no
 * margins: the second cell's text 0.5 points in from its dotted and dashed border of 1 point, which Word drew over the
 * first cell's single one of 6, and 3 and 1.5 points in from its single ones of 6 and 3 points, below the first cell's
 * heavier ones of 1 and 0.5 points), but the text of the cell before them from the border it draws (`word-stops-tables3.docx`
 * BT7a to BT7c, with no margins and the text right-aligned: the first cell's text 0.5 points in from the dotted and dashed
 * line of 1 point, its own or the second cell's, which Word drew over a single one of 6 either way, and 1 point in from its
 * thin and thick line of half a point, drawn over the second cell's single one of 3; `word-table-formats.docx` BC7 to BC9:
 * 3 points in from its own single one of 6, beside a cell with none). Word drew the narrower each time, so where it draws
 * the wider, how far it keeps the first cell's text isn't known, and the narrower's room comes with the drawn one's
 * (`rightUnsettled`, see `roomBefore`). With space between cells, each cell's borders are its own, and none meet. Why,
 * where a border's room isn't known, or where an art border is beside the text, whose room there Word's PDFs haven't
 * settled: apples of 12 points beside a cell's text kept it only 0.75 points from them, where they took 12 points above
 * and below a cell's (BT1g).
 */
export const sideBorders = (
    cells: readonly BorderedCell[],
    table: BorderSet,
    meeting = true,
): readonly { readonly left: number; readonly right: number; readonly rightUnsettled?: number }[] | string => {
    const insideV = table.insideV ?? NONE;
    const leftOf = (index: number): Border => cells[index].borders.left ?? (index === 0 ? (table.left ?? NONE) : insideV);
    const rightOf = (index: number): Border => cells[index].borders.right ?? (index === cells.length - 1 ? (table.right ?? NONE) : insideV);
    const sides = cells.map((_, index) => {
        const [left, right] = [leftOf(index), rightOf(index)];
        const next = index < cells.length - 1 ? leftOf(index + 1) : undefined;
        // The borders this cell's meet, of the cells either side of it
        const beside = [...(index > 0 ? [rightOf(index - 1)] : []), ...(next === undefined ? [] : [next])];
        const art = [left, right, ...beside].some((border) => isDrawn(border) && isArtBorder(border.style));
        if (art) {
            return "an art border beside a table cell's text";
        }
        const ownRoom = roomOrWhy(right);
        const before =
            next === undefined || !meeting ? (typeof ownRoom === "string" ? ownRoom : { room: ownRoom }) : roomBefore(right, next);
        return typeof before === "string"
            ? before
            : {
                  left: roomOrWhy(left),
                  right: before.room,
                  ...(before.unsettled === undefined ? {} : { rightUnsettled: before.unsettled }),
              };
    });
    const unsupported = sides
        .flatMap((side) => (typeof side === "string" ? [side] : [side.left, side.right]))
        .find((room): room is string => typeof room === "string");
    return unsupported ?? (sides as readonly { readonly left: number; readonly right: number; readonly rightUnsettled?: number }[]);
};

/**
 * The space between a table's cells (`w:tblCellSpacing`), in points: none when it isn't given, or is `nil` or `auto`, which
 * Word lays out as none, whatever its width (`word-stops-table-borders2.docx` BT5d and BT5e: of 100 twips and of none).
 * "share" when it is a share of the table's width, which Word lays out as none for a table (`word-stops-table-borders.docx`
 * TB6a and TB6b: 2% and 5% of its width), and undefined for a type the schema doesn't have.
 */
export const readCellSpacing = (element: unknown): number | "share" | undefined => {
    if (element === undefined) {
        return 0;
    }
    const { "w:w": value, "w:type": type = "dxa" } = attributesOf(element);
    if (type === "nil" || type === "auto") {
        return 0;
    }
    if (type === "pct") {
        return "share";
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

/**
 * Where a cell is in its table: its row and the rows of the table, its place among the cells of its row, and how many of
 * the table's first rows are its header rows (`w:tblHeader`), when it has any
 */
export type CellPosition = {
    readonly row: number;
    readonly rows: number;
    readonly cell: number;
    readonly cells: number;
    readonly headerRows?: number;
};

/**
 * The parts of a table style that apply to a cell (`w:tblStylePr`), by its position in the table, the parts the table
 * turns on, and the sizes of its style's bands, in the order they apply, each over those before, as Word applies them
 * (`word-table-formats.docx` CF1 to CF6). Word applies bands only of a style that gives their size, and counts them from
 * the first row and column that aren't the first row or column it applies. It doesn't apply `wholeTable`.
 *
 * A table's header of several rows is its first row, all of it, with its corner cells in each of its rows
 * (`word-stops-tables.docx` TS2), and its bands of rows start below it. With its first row turned off, all of a header of
 * two rows is in the band before the first, the second band (`word-compat-off.docx` CS2a to CS2f), but the bands of one of
 * three start at its first row, as though it weren't a header (TS3). A header of one row is a row like the others (CS2c).
 */
export const conditionalTypesOf = (
    { row, rows, cell, cells, headerRows = 0 }: CellPosition,
    look: TableLook,
    bands: { readonly rows?: number; readonly columns?: number },
): readonly string[] => {
    const header = headerRows > 1 && (look.firstRow || headerRows < 3) ? headerRows : 0;
    const inHeader = row < header;
    const firstRow = look.firstRow && (header > 0 ? inHeader : row === 0);
    const lastRow = look.lastRow && row === rows - 1;
    const firstColumn = look.firstColumn && cell === 0;
    const lastColumn = look.lastColumn && cell === cells - 1;
    const bandOf = (on: boolean, size: number | undefined, index: number, edge: boolean): number | undefined =>
        on && size !== undefined && size > 0 && !edge ? Math.abs(Math.floor(index / size) % 2) : undefined;
    const firstBanded = header > 0 ? header : look.firstRow ? 1 : 0;
    const rowBand = bandOf(look.rowBands, bands.rows, inHeader ? -1 : row - firstBanded, firstRow || lastRow);
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
    /** Below the row on a page where the table breaks after it, more than `borderBottom` */
    readonly breakBorder: number;
    /**
     * Above the row at the top of a page where the table breaks before it, more than `borderTop`: the table's top border,
     * with space between cells, when it has one
     */
    readonly breakTop?: number;
    /**
     * The room at the table's edge above the row, of `borderTop`, and below it, of `borderBottom`, which a row of an exact
     * height doesn't include in its height, when there is any: the table's bottom border below the last row, and, with
     * space between cells, the table's own border and the space inside it, above the first row and below the last
     */
    readonly edgeTop?: number;
    readonly edgeBottom?: number;
    /** Left and right of each cell's text, with its margins, and the width of its text */
    readonly cells: readonly { readonly left: number; readonly right: number; readonly width: number }[];
}[];

/**
 * The room around the text of a table's rows and cells: its borders and its cells' (`rowBorders`, `sideBorders`), and
 * the space between the cells of each row.
 *
 * Without space between cells, a cell's text is as far in from its left and right edges as its margin, or half its
 * border there when that is more, its own, or the one Word draws where it meets the next cell's (`sideBorders`), as in
 * Word (`word-table-formats.docx` BC7 to BC9, `word-table-formats2.docx` BC10 and BC11, `word-stops-table-borders2.docx`
 * BT1, `word-stops-tables3.docx` BT7). A row of an exact height has the border above it inside its height, and the
 * table's bottom border, below the last row, outside it (`edgeBottom`; `word-stops-tables2.docx` TS15, `word-stops-tables3.docx`
 * TS16b: a single border of 3 points above a row of exactly 600 twips, inside it).
 *
 * With space between cells, each cell has borders of its own, its own or else the table's: the table's top above the
 * first row, its bottom below the last, its left before the first cell and its right after the last, and its inside
 * borders between them; and the table has its own around them. Each row has its space above and below its cells'
 * borders, and inside the table's borders above the first row and below the last too (CS1 to CS4, CS13), its own where it
 * has space of its own, in place of the table's (`word-stops-table-borders2.docx` BT5a and BT5b: rows of 2 and 5 points
 * in a table of 2 points and of none). Where the table breaks across pages, the row on the page keeps the space below it,
 * with the table's bottom border below that, and the next page's starts with the table's top border and the space above
 * it (CS12, `word-stops-table-borders.docx` TB7a to TB7c). A row of an exact height has its own space above and below
 * its cells and their borders inside its height, and the table's border and the space inside it, above the first row and
 * below the last, outside it (`edgeTop`, `edgeBottom`; `word-stops-tables3.docx` TS16a: a row of exactly 600 twips with
 * space of 40 and borders of half a point, 650 from the table's top edge to the next row). Across, the space is around each cell and inside the table's
 * edges, as margins are, each row's own (`word-watertight-tables.docx` TB4, `word-table-formats.docx` CS5 to CS8,
 * `word-table-formats2.docx` CS9, CS10, CS14, BT5a, BT5b), and each cell's text is further in by the whole of its own
 * border left and right of it, where the table's borders there take none of its width (TB5a to TB5l: with space of 2, 5
 * and 10 points, and borders of half a point to 6 points, each cell's text was twice its border narrower than without
 * them; BT6a to BT6c: a row's own borders, `w:tblPrEx`, as its cells' own).
 */
export const tableGeometry = (
    rows: readonly { readonly cells: readonly PlacedCell[]; readonly spacing: number }[],
    borders: BorderSet,
): TableGeometry | string => {
    const withoutSpacing = rows.every(({ spacing }) => spacing === 0);
    const across = rows.map(({ cells }) => sideBorders(cells, borders, withoutSpacing));
    const beside = across.find((sides): sides is string => typeof sides === "string");
    const sidesOf = (index: number): Exclude<(typeof across)[number], string> => across[index] as Exclude<(typeof across)[number], string>;
    if (withoutSpacing) {
        const vertical = rowBorders(
            rows.map(({ cells }) => cells),
            borders,
        );
        if (typeof vertical === "string" || beside !== undefined) {
            return typeof vertical === "string" ? vertical : (beside as string);
        }
        // Where Word draws the wider of two borders that meet, the text before them is kept from it, or from the narrower,
        // which matters only where either is more than the cell's margin
        const unsettled = rows.some(({ cells }, index) =>
            cells.some(({ margins }, cell) => {
                const { right, rightUnsettled } = sidesOf(index)[cell];
                return rightUnsettled !== undefined && Math.max(margins.right, right / 2) !== Math.max(margins.right, rightUnsettled / 2);
            }),
        );
        if (unsettled) {
            return "two table cells' borders that meet, of which Word draws the wider, beside text with less margin than half of it";
        }
        return rows.map(({ cells }, index) => ({
            borderTop: vertical.tops[index],
            borderBottom: index === rows.length - 1 ? vertical.bottom : 0,
            breakBorder: vertical.breaks[index],
            ...(index === rows.length - 1 && vertical.bottom > 0 ? { edgeBottom: vertical.bottom } : {}),
            cells: cells.map(({ margins, gridWidth }, cell) => {
                const sides = sidesOf(index)[cell];
                const left = Math.max(margins.left, sides.left / 2);
                const right = Math.max(margins.right, sides.right / 2);
                return { left, right, width: gridWidth - left - right };
            }),
        }));
    }
    const last = rows.length - 1;
    const rooms = rows.map(({ cells }, index) => ({
        tops: widest(cells.map((cell) => cell.borders.top ?? (index === 0 ? borders.top : borders.insideH) ?? NONE)),
        bottoms: widest(cells.map((cell) => cell.borders.bottom ?? (index === last ? borders.bottom : borders.insideH) ?? NONE)),
    }));
    const [top, bottom] = [widest([borders.top ?? NONE]), widest([borders.bottom ?? NONE])];
    const unknown = [top, bottom, ...rooms.flatMap(({ tops, bottoms }) => [tops, bottoms]), beside].find(
        (room): room is string => typeof room === "string",
    );
    if (unknown !== undefined) {
        return unknown;
    }
    return rows.map(({ cells, spacing: own }, index) => {
        const { tops, bottoms } = rooms[index] as { readonly tops: number; readonly bottoms: number };
        const [edgeTop, edgeBottom] = [index === 0 ? own + (top as number) : 0, index === last ? own + (bottom as number) : 0];
        return {
            borderTop: tops + own + edgeTop,
            borderBottom: bottoms + own + edgeBottom,
            breakBorder: bottom as number,
            ...((top as number) > 0 ? { breakTop: top as number } : {}),
            ...(edgeTop > 0 ? { edgeTop } : {}),
            ...(edgeBottom > 0 ? { edgeBottom } : {}),
            cells: cells.map(({ margins, gridWidth }, cell) => {
                const sides = sidesOf(index)[cell];
                const left = margins.left + own + (cell === 0 ? own : 0) + sides.left;
                const right = margins.right + own + (cell === cells.length - 1 ? own : 0) + sides.right;
                return { left, right, width: gridWidth - left - right };
            }),
        };
    });
};
