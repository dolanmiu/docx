/**
 * Writes blocks as docx's paragraphs and tables, with their lists numbered, and each page or column break in the
 * block after it.
 *
 * @module
 */
import { ColumnBreak, Paragraph, Table, TableCell, TableRow } from "docx";

import type { Block } from "./content";
import { numberLists } from "./lists";
import { writeInline } from "./write-inline";

/**
 * Writes blocks. A break that ends the blocks is left out, as it would start a page or column with nothing on it.
 *
 * @param blocks - The blocks, in order
 * @param idOf - Gives each tracked change an id no other in the document has
 */
export const writeBlocks = (blocks: readonly Block[], idOf: () => number): readonly (Paragraph | Table)[] => {
    const numbering = numberLists(blocks);
    // eslint-disable-next-line functional/prefer-readonly-type
    const written: (Paragraph | Table)[] = [];
    let pending: "page" | "column" | undefined;
    for (const block of blocks) {
        if (block.type === "block-break") {
            pending = pending === "page" ? pending : block.kind;
            continue;
        }
        if (block.type === "paragraph") {
            const list = numbering.get(block);
            const children = writeInline(block.content, idOf);
            // eslint-disable-next-line functional/immutable-data
            written.push(
                new Paragraph({
                    ...block.format,
                    ...(pending === "page" ? { pageBreakBefore: true } : {}),
                    ...(list ? { numbering: { reference: list.reference, level: list.level } } : {}),
                    children: pending === "column" ? [new ColumnBreak(), ...children] : children,
                }),
            );
        } else {
            const breakBefore = pending;
            // eslint-disable-next-line functional/immutable-data
            written.push(
                new Table({
                    ...block.options,
                    rows: block.rows.map(
                        (row, rowIndex) =>
                            new TableRow({
                                ...row.options,
                                children: row.cells.map(
                                    (cell, cellIndex) =>
                                        new TableCell({
                                            ...cell.options,
                                            // A break before the table goes in its first cell, as Word moves the table with it
                                            children: writeBlocks(
                                                rowIndex === 0 && cellIndex === 0 && breakBefore
                                                    ? [{ type: "block-break", kind: breakBefore }, ...cell.content]
                                                    : cell.content,
                                                idOf,
                                            ),
                                        }),
                                ),
                            }),
                    ),
                }),
            );
        }
        pending = undefined;
    }
    return written;
};
