// Prints the width docx/layout gives each column of the probe tables of word-long-words.ts, in twips, as
// word-long-words.py prints Word's, to compare with word-long-words.word.txt.
//
// Usage: npm run run-ts -- scripts/layout-probes/word-long-words-layout.ts
import { Packer } from "docx";

import { fitColumns } from "../../src/layout/column-widths";
import { type Block, type TableBlock, readDocument } from "../../src/layout/read-document";
import { type InlineItem, measureContentWidths } from "../../src/text-layout";
import { probeDocument } from "./word-long-words";

/** How narrow and how wide the paragraphs of a cell can be, as the layout measures them */
const measure = (blocks: readonly Block[]): { readonly min: number; readonly max: number } =>
    blocks.reduce(
        (widths, block) => {
            if (block.type !== "paragraph") {
                return widths;
            }
            const { min, max } = measureContentWidths(block.items as readonly InlineItem[], {
                format: block.format,
                tabStops: block.tabStops,
            });
            return { min: Math.max(widths.min, min), max: Math.max(widths.max, max) };
        },
        { min: 0, max: 0 },
    );

const doc = probeDocument({
    pageNumbers: (body, context) => {
        const content = readDocument(body, context);
        const width = content.sections[0].columns[0];
        const blocks = content.blocks.map(({ block }) => block);
        for (const [index, block] of blocks.entries()) {
            if (block.type !== "table") {
                continue;
            }
            const before = blocks[index - 1];
            const label = before.type === "paragraph" ? before.items.map((item) => ("text" in item ? item.text : "")).join("") : "";
            const sized = fitColumns(block as TableBlock, width, measure);
            const columns = sized.rows[0].cells.map((cell) => Math.round((cell.width + cell.marginLeft + cell.marginRight) * 20));
            const total = columns.reduce((a, b) => a + b, 0);
            console.log(label);
            console.log(`    ${sized.unsupported ? `stops: ${sized.unsupported}` : `widths ${JSON.stringify(columns)}  total ${total}`}`);
        }
        return { bookmarks: new Map() };
    },
});
Packer.toBuffer(doc);
