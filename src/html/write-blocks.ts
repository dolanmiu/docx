/**
 * Writes blocks as docx's paragraphs and tables, with their lists numbered, each page or column break in the block
 * after it, and their notes' references as footnotes' and endnotes' references.
 *
 * @module
 */
import { ColumnBreak, EndnoteReferenceRun, FootnoteReferenceRun, Paragraph, Table, TableCell, TableRow } from "docx";

import type { Block, Inline, WrittenInline } from "./content";
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
            const children = writeInline(withNotes(block.content, idOf), idOf);
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

/**
 * A paragraph's content, with each note's reference written as a footnote's or endnote's reference with the note's
 * paragraphs, which each reference has a copy of, as Word's notes have one reference each. The reference to a note that
 * isn't read, such as a hidden one, is written as it is in the HTML.
 *
 * @param content - The paragraph's content
 * @param idOf - Gives each tracked change an id no other in the document has
 */
export const withNotes = (content: readonly Inline[], idOf: () => number): readonly WrittenInline[] =>
    content.flatMap((item): readonly WrittenInline[] => {
        if (item.type !== "note") {
            return [item];
        }
        const { note } = item;
        if (note.content === undefined) {
            return withNotes(item.fallback, idOf);
        }
        // A note has only paragraphs, so they are written as paragraphs
        const children = writeBlocks(note.content, idOf) as readonly Paragraph[];
        return [
            {
                type: "atom",
                child: note.kind === "endnote" ? new EndnoteReferenceRun({ children }) : new FootnoteReferenceRun({ children }),
            },
        ];
    });
