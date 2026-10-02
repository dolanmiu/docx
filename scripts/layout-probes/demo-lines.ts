// cspell:ignore bbox
// Checks every line of a layout demo against Word's PDF of it, rather than only its headings, as
// scripts/compare-layout.sh does: each line of the body and of the notes docx/layout lays out, and each row of the body's
// tables, is looked for among the lines of Word's PDF, and is on Word's page or not.
//
// Usage: pdftotext -bbox-layout scripts/layout-probes/table-formatting.word.pdf build/word-probes/table-formatting.word.html
//        npm run run-ts -- scripts/layout-probes/demo-lines.ts scripts/layout-probes/table-formatting.word.docx build/word-probes/table-formatting.word.html
//
// The .docx, the demo's or the one Word saved of it, is laid out through the .docx adapter, as compare-layout.ts lays out
// the documents saved from Word. Word's lines are taken down each page, and those of docx/layout looked for among them in
// order. A line is Word's when its text is the same, leaving out spaces, and the dots of a table of contents' leaders,
// with the parts pdftotext writes apart where tabs keep them apart joined. A row is found by one of its cells: the first
// line of the cell's text with the lines below it, at the same place across the page, which go on with it, to the end of
// the cell's text, or of the page, where the row goes on to the next. Each is printed with its page and Word's, and how far
// below the top of the page each is, in points: a line's top against the top of Word's line, which are the same where
// docx/layout puts it where Word does, and a row's top, above its top border, against the top of its cell's text, which is
// lower by its border and its cell's margin, so the gap is the same for the rows of a table, wherever they are.
//
// Lines in columns side by side, or text that runs up a cell, may not be found, and are printed as such. Headers and
// footers aren't checked, nor the rows of tables in notes. It fails when a line or row is on another page from Word's,
// or isn't found, or when the layout stopped.
import { readFileSync } from "node:fs";

import JSZip from "jszip";
import { type Element, xml2js } from "xml-js";

import type { BlockLayout } from "../../src/layout";
import { layOutPasses } from "../../src/layout/layout-passes";
import { readDocx } from "../../src/layout/read-docx";

const [docxPath, htmlPath] = process.argv.slice(2);

const unescape = (text: string): string =>
    text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");

/** Text without its spaces and tabs, nor the dots of a table of contents' leaders, which pdftotext writes and Word draws */
const bare = (text: string): string => text.replace(/\s+/g, "").replace(/\.{3,}/g, "");

// Word's lines, down each page, and across it for those level with each other
const WORD = [...readFileSync(htmlPath, "utf8").matchAll(/<page[\s\S]*?<\/page>/g)]
    .flatMap(([page], index) =>
        [...page.matchAll(/<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">([\s\S]*?)<\/line>/g)].map(
            ([, xMin, yMin, content]) => ({
                page: index + 1,
                x: Number(xMin),
                y: Number(yMin),
                text: bare([...content.matchAll(/<word[^>]*>([^<]*)<\/word>/g)].map(([, text]) => unescape(text)).join("")),
            }),
        ),
    )
    .filter(({ text }) => text.length > 0)
    .sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);

const zip = await JSZip.loadAsync(readFileSync(docxPath));
const parts = new Map(
    await Promise.all(
        Object.keys(zip.files)
            .filter((file) => file.endsWith(".xml") || file.endsWith(".rels"))
            .map(
                async (file) =>
                    [
                        file,
                        xml2js(await zip.file(file)!.async("string"), { compact: false, captureSpacesBetweenElements: true }) as Element,
                    ] as const,
            ),
    ),
);

const textOf = (element: Element): string =>
    element.type === "text" ? String(element.text) : element.name === "w:instrText" ? "" : (element.elements ?? []).map(textOf).join("");

// The texts of the cells of each row of the body's tables, in order, leaving out the tables in their cells
const tablesIn = (element: Element): readonly Element[] =>
    element.name === "w:tbl" ? [element] : (element.elements ?? []).flatMap(tablesIn);
const TABLES = tablesIn(parts.get("word/document.xml")!).map((table) =>
    (table.elements ?? [])
        .filter(({ name }) => name === "w:tr")
        .map((row) => (row.elements ?? []).filter(({ name }) => name === "w:tc").map((cell) => bare(textOf(cell)))),
);

type Item = { readonly kind: "line" | "row"; readonly texts: readonly string[]; readonly y: number; readonly shown: string };

const laidOut = layOutPasses(readDocx(parts));
// Each line with text, and each row, docx/layout put on a page, in order. A row is known by its table's place among the
// tables laid out, as the body's tables are laid out in order
const tableNumbers = new Map<number, number>();
const items = laidOut.pages
    .flatMap((page, index) => {
        const blocks = (content: readonly BlockLayout[], inBody: boolean): readonly Item[] =>
            content.flatMap((block): readonly Item[] => {
                if (block.type === "paragraph") {
                    return block.lines.map((line) => ({ kind: "line", texts: [bare(line.text)], y: line.y, shown: line.text }));
                }
                // The rows of the notes' tables aren't known by their text, so aren't looked for
                if (!inBody) {
                    return [];
                }
                const table = tableNumbers.get(block.index) ?? tableNumbers.size;
                tableNumbers.set(block.index, table);
                return block.rows.map((row) => {
                    const cells = TABLES[table]?.[row.index] ?? [];
                    return { kind: "row", texts: cells, y: row.y, shown: `${table + 1}.${row.index + 1}: ${cells.join(" | ")}` };
                });
            });
        return [...blocks(page.body, true), ...[...page.footnotes, ...page.endnotes].flatMap((note) => blocks(note.content, false))].map(
            (item) => ({ ...item, page: index + 1 }),
        );
    })
    .filter(({ texts }) => texts.some((text) => text.length > 0));

// The lines of Word's that are a row's found before, which aren't looked at again
const claimed = new Set<number>();

/**
 * What is left of a cell's text after the line at an index and those below it that go on with it, and those lines, or
 * undefined when the line doesn't start it. Those below it are the lines at the same place across the page, down to the end
 * of the cell's text. Text left with no more lines below it on the page goes on to the next page
 */
const cellFrom = (cell: string, start: number): { readonly rest: string; readonly lines: readonly number[] } | undefined => {
    if (cell.length === 0 || claimed.has(start) || !cell.startsWith(WORD[start].text)) {
        return undefined;
    }
    let rest = cell.slice(WORD[start].text.length);
    const lines = [start];
    for (let index = start + 1; index < WORD.length && rest.length > 0 && WORD[index].page === WORD[start].page; index++) {
        const [below, last] = [WORD[index], WORD[lines[lines.length - 1]]];
        if (!claimed.has(index) && Math.abs(below.x - last.x) < 1 && below.y > last.y) {
            if (!rest.startsWith(below.text)) {
                return undefined;
            }
            rest = rest.slice(below.text.length);
            lines.push(index);
        }
    }
    const last = WORD[lines[lines.length - 1]];
    const lastAcross = WORD.findLast(({ page, x }) => page === last.page && Math.abs(x - last.x) < 1);
    return rest.length === 0 || last === lastAcross ? { rest, lines } : undefined;
};

/**
 * The line at an index, with those level with it after it, across the page, as many as make up a text: pdftotext writes the
 * parts of a line that tabs keep apart as lines of their own. Undefined when they don't make it up
 */
const lineFrom = (text: string, start: number): number | undefined => {
    let joined = "";
    for (
        let index = start;
        index < WORD.length && WORD[index].page === WORD[start].page && Math.abs(WORD[index].y - WORD[start].y) < 1;
        index++
    ) {
        joined += claimed.has(index) ? "" : WORD[index].text;
        if (joined === text) {
            return index;
        }
        if (!text.startsWith(joined)) {
            return undefined;
        }
    }
    return undefined;
};

// How far ahead among Word's lines one is looked for: past the lines docx/layout doesn't lay out, such as those of headers,
// and those of the cells of the rows before
const AHEAD = 60;
let next = 0;
let failed = 0;
// What is left of the text of each cell of the rows that go on to the next page, by row, which they are found there by
const continuing = new Map<string, readonly string[]>();
for (const item of items) {
    const texts = (item.kind === "row" && continuing.get(item.shown)) || item.texts;
    let found: number | undefined;
    for (let index = next; index < Math.min(next + AHEAD, WORD.length) && found === undefined; index++) {
        const match =
            item.kind === "line" ? lineFrom(texts[0], index) !== undefined : texts.some((text) => cellFrom(text, index) !== undefined);
        found = !claimed.has(index) && match ? index : undefined;
    }
    if (found === undefined) {
        failed++;
        console.log(`  none  page ${String(item.page).padStart(3)}            ${item.shown.slice(0, 70)}`);
        continue;
    }
    const word = WORD[found];
    if (item.kind === "row") {
        // The lines of each of its cells, which start level with the one found, and what is left of each for the next page
        const rests = texts.map((text) => {
            const level = WORD.findIndex(
                (line, index) => line.page === word.page && Math.abs(line.y - word.y) < 1 && cellFrom(text, index) !== undefined,
            );
            const cell = level === -1 ? undefined : cellFrom(text, level);
            cell?.lines.forEach((line) => claimed.add(line));
            return cell ? cell.rest : text;
        });
        // A row repeated at the top of each page, as a header, starts again there
        if (rests.some((rest) => rest.length > 0)) {
            continuing.set(item.shown, rests);
        } else {
            continuing.delete(item.shown);
        }
    }
    // The next is looked for after it, and a row's other cells are level with it
    next = item.kind === "line" ? lineFrom(texts[0], found)! + 1 : WORD.findIndex(({ page, y }) => page === word.page && y >= word.y - 1);
    failed += word.page === item.page ? 0 : 1;
    console.log(
        `${word.page === item.page ? "  ok  " : "  FAIL"}  page ${String(item.page).padStart(3)} ${word.page === item.page ? " " : "*"}Word ${String(word.page).padStart(3)}  ${item.kind} ${item.y.toFixed(1).padStart(6)} Word ${word.y.toFixed(1).padStart(6)} gap ${(word.y - item.y).toFixed(1).padStart(5)}  ${item.shown.slice(0, 50)}`,
    );
}
console.log(
    `\n${items.length - failed} of ${items.length} lines and rows are on Word's page${laidOut.stoppedAt ? `; it stopped at ${laidOut.stoppedAt}` : ""}`,
);
process.exit(failed === 0 && laidOut.stoppedAt === undefined ? 0 : 1);
