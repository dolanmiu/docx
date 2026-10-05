/**
 * Writes docx/layout's layout of a whole probe document as JSON, with a guess past its stops: each line of the body and
 * the notes, and each table row, with its page and where it is, in twips from the top and left margins (1440), and the
 * stops it guessed at.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/whole-layout.ts <document>.docx > <document>.whole.json
 */
import { readFileSync } from "node:fs";

import { patchDocument } from "../../../src/index";
import { layOutPasses } from "../../../src/layout/layout-passes";
import { readDocx } from "../../../src/layout/read-docx";

const [path] = process.argv.slice(2);
const TWIPS = 20;
const MARGIN = 1440;

await patchDocument({
    outputType: "uint8array",
    data: readFileSync(path!),
    patches: {},
    pageNumbers: ({ parts, binaryParts, importedDocuments }) => {
        const plain = layOutPasses(readDocx(parts, binaryParts, {}, importedDocuments));
        const guessed = layOutPasses(readDocx(parts, binaryParts, { guess: true }, importedDocuments), undefined, true);
        const lines: unknown[] = [];
        guessed.pages.forEach((page, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blocks = (content: readonly any[], where: string): void => {
                for (const block of content) {
                    if (block.type === "paragraph") {
                        for (const one of block.lines) {
                            lines.push({
                                page: index + 1,
                                where,
                                top: Math.round(one.y * TWIPS - MARGIN),
                                left: Math.round(one.x * TWIPS - MARGIN),
                                width: Math.round(one.width * TWIPS),
                                text: one.text,
                            });
                        }
                    } else {
                        for (const row of block.rows) {
                            lines.push({
                                page: index + 1,
                                where,
                                row: row.index,
                                top: Math.round(row.y * TWIPS - MARGIN),
                                height: Math.round(row.height * TWIPS),
                            });
                        }
                    }
                }
            };
            blocks(page.body, "body");
            for (const note of [...page.footnotes, ...page.endnotes]) {
                blocks(note.content, "note");
            }
        });
        console.log(
            JSON.stringify({
                stoppedAt: plain.stoppedAt ?? null,
                guesses: [...new Set(guessed.pages.flatMap(({ guesses = [] }) => guesses))],
                pages: guessed.pages.length,
                lines,
            }),
        );
        return { bookmarks: new Map() };
    },
});
