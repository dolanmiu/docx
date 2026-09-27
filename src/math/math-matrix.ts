/**
 * Matrices, such as LaTeX's `pmatrix`, `bmatrix`, `vmatrix` and `Vmatrix`.
 *
 * @module
 */
import { BuilderElement, type MathComponent, createMathBase } from "docx";

import {
    type ElementOptions,
    MAX_MATRIX_COLUMNS,
    MAX_MATRIX_ROWS,
    bracketsElement,
    checkArgument,
    checkOneOf,
    createArgument,
    createValueElement,
    plural,
} from "./math-elements";

/**
 * The brackets around a matrix:
 *
 * - `"none"`: none, as LaTeX's `matrix`;
 * - `"round"`: ( ), as `pmatrix`;
 * - `"square"`: [ ], as `bmatrix`;
 * - `"curly"`: { }, as `Bmatrix`;
 * - `"angled"`: ⟨ ⟩;
 * - `"verticalBars"`: | |, as `vmatrix`, for determinants;
 * - `"doubleVerticalBars"`: ‖ ‖, as `Vmatrix`, for norms.
 */
export type MathMatrixBrackets = "none" | "round" | "square" | "curly" | "angled" | "verticalBars" | "doubleVerticalBars";

/** Where the cells of a column go across it (`m:mcJc`). LibreOffice and Pages centre them all */
export type MathColumnAlignment = "left" | "center" | "right";

/** Where a matrix or equation array sits on its line (`m:baseJc`): its top, its middle or its bottom on the line */
export type MathVerticalAlignment = "top" | "center" | "bottom";

/**
 * Options for {@link MathMatrix}.
 */
export type MathMatrixOptions = {
    /**
     * The rows, each a list of cells, and each cell the math in it (`m:mr`, `m:e`). A row shorter than the longest gets
     * empty cells at its end. Word allows at most 256 rows and 64 cells in a row.
     */
    readonly rows: readonly (readonly (readonly MathComponent[])[])[];
    /**
     * The brackets around the matrix.
     * @default "none"
     */
    readonly brackets?: MathMatrixBrackets;
    /**
     * Where the cells go across their columns: one alignment for every column, or one for each column.
     * @default "center"
     */
    readonly columnAlignment?: MathColumnAlignment | readonly MathColumnAlignment[];
    /**
     * Where the matrix sits on its line.
     * @default "center"
     */
    readonly verticalAlignment?: MathVerticalAlignment;
};

// The characters UnicodeMath gives \langle and \norm, which LibreOffice and Pages draw, rather than U+2329 and U+2225
const BRACKETS: Readonly<Record<Exclude<MathMatrixBrackets, "none">, readonly [string, string]>> = {
    round: ["(", ")"],
    square: ["[", "]"],
    curly: ["{", "}"],
    angled: ["⟨", "⟩"],
    verticalBars: ["|", "|"],
    doubleVerticalBars: ["‖", "‖"],
};

const COLUMN_ALIGNMENTS: readonly MathColumnAlignment[] = ["left", "center", "right"];

export const VERTICAL_ALIGNMENTS: readonly MathVerticalAlignment[] = ["top", "center", "bottom"];

/**
 * A matrix (`m:m`), without brackets. Its errors name `owner`, its rows as `rowsName`, and each cell as `cellName` does.
 */
export const matrixElement = (
    owner: string,
    { rows, columnAlignment = "center", verticalAlignment = "center" }: Omit<MathMatrixOptions, "brackets">,
    {
        rowsName = "rows",
        cellName = (row, column) => `row ${row + 1}, cell ${column + 1}`,
    }: { readonly rowsName?: string; readonly cellName?: (row: number, column: number) => string } = {},
): ElementOptions => {
    if (rows.length === 0) {
        throw new Error(`${owner}: there are no ${rowsName}. Give at least one`);
    }
    if (rows.length > MAX_MATRIX_ROWS) {
        throw new Error(`${owner}: there are ${rows.length} ${rowsName}, but Word allows at most ${MAX_MATRIX_ROWS}`);
    }
    const columns = Math.max(...rows.map((row) => row.length));
    if (columns === 0) {
        throw new Error(`${owner}: every row is empty. Give at least one cell`);
    }
    if (columns > MAX_MATRIX_COLUMNS) {
        throw new Error(`${owner}: a row has ${columns} cells, but Word allows at most ${MAX_MATRIX_COLUMNS}`);
    }
    const alignments = typeof columnAlignment === "string" ? Array.from({ length: columns }, () => columnAlignment) : columnAlignment;
    if (alignments.length !== columns) {
        throw new Error(
            `${owner}: columnAlignment has ${plural(alignments.length, "alignment")}, but the rows have ${plural(columns, "column")}. Give one for each`,
        );
    }
    alignments.forEach((alignment) => checkOneOf(owner, "columnAlignment", alignment, COLUMN_ALIGNMENTS));
    checkOneOf(owner, "verticalAlignment", verticalAlignment, VERTICAL_ALIGNMENTS);
    rows.forEach((row, rowIndex) => row.forEach((cell, column) => checkArgument(owner, cellName(rowIndex, column), cell)));

    // Columns side by side with the same alignment share an m:mc, with their count
    const groups = alignments.reduce<readonly { readonly alignment: MathColumnAlignment; readonly count: number }[]>(
        (all, alignment) =>
            all.length > 0 && all[all.length - 1].alignment === alignment
                ? [...all.slice(0, -1), { alignment, count: all[all.length - 1].count + 1 }]
                : [...all, { alignment, count: 1 }],
        [],
    );

    return {
        name: "m:m",
        children: [
            new BuilderElement({
                name: "m:mPr",
                children: [
                    createValueElement("m:baseJc", verticalAlignment),
                    // Word shows a dotted box in an empty cell unless placeholders are hidden
                    createValueElement("m:plcHide", 1),
                    new BuilderElement({
                        name: "m:mcs",
                        children: groups.map(
                            ({ alignment, count }) =>
                                new BuilderElement({
                                    name: "m:mc",
                                    children: [
                                        new BuilderElement({
                                            name: "m:mcPr",
                                            children: [createValueElement("m:count", count), createValueElement("m:mcJc", alignment)],
                                        }),
                                    ],
                                }),
                        ),
                    }),
                ],
            }),
            ...rows.map(
                (row) =>
                    new BuilderElement({
                        name: "m:mr",
                        children: Array.from({ length: columns }, (_, column) => createArgument(row[column] ?? [])),
                    }),
            ),
        ],
    };
};

/**
 * A matrix (`m:m`), in brackets or none (`m:d`): LaTeX's `matrix`, `pmatrix`, `bmatrix`, `Bmatrix`, `vmatrix` and
 * `Vmatrix`.
 *
 * Word lines up each column's cells as `columnAlignment` says, and hides the placeholders of empty cells. LibreOffice
 * and Pages centre every column.
 *
 * @example
 * ```typescript
 * new MathMatrix({
 *   brackets: "round",
 *   rows: [
 *     [[new MathRun("1")], [new MathRun("2")]],
 *     [[new MathRun("3")], [new MathRun("4")]],
 *   ],
 * });
 * ```
 */
export class MathMatrix extends BuilderElement {
    public constructor({ brackets = "none", ...options }: MathMatrixOptions) {
        checkOneOf("MathMatrix", "brackets", brackets, ["none", ...Object.keys(BRACKETS)]);
        const matrix = matrixElement("MathMatrix", options);

        super(
            brackets === "none"
                ? matrix
                : bracketsElement({ open: BRACKETS[brackets][0], close: BRACKETS[brackets][1] }, [
                      createMathBase({ children: [new BuilderElement(matrix)] }),
                  ]),
        );
    }
}
