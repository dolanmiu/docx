// cspell:ignore bbox
// Checks how near docx/layout's best guess comes to Word, past where it would stop: a document saved from Word, such as a
// probe or a demo, is laid out through the .docx adapter without a guess and with one (`guess: true`, as
// `estimatePageNumbersWith({ guess: true })` and `layoutDocument(doc, { guess: true })` lay it out), and each line of the
// body and the notes of the layout with a guess is looked for among the lines of Word's PDF of it, in order, by its text,
// as `demo-lines.ts` looks for them.
//
// Usage: pdftotext -bbox-layout scripts/layout-probes/word-watertight-pages.pdf build/word-probes/word-watertight-pages.html
//        npm run run-ts -- scripts/layout-probes/guess-lines.ts scripts/layout-probes/word-watertight-pages.docx build/word-probes/word-watertight-pages.html
//
// It prints where the layout stops without a guess, what it guessed at on each page with one, how many pages each layout
// has and Word's PDF has, and how many of the lines from the first page it guessed on are on Word's page, of those found
// among Word's lines. The lines before are laid out as they are without a guess, which `demo-lines.ts` checks.
import { readFileSync } from "node:fs";

import JSZip from "jszip";
import { type Element, xml2js } from "xml-js";

import type { BlockLayout } from "../../src/layout";
import { layOutPasses } from "../../src/layout/layout-passes";
import { readDocx } from "../../src/layout/read-docx";

const [docxPath, htmlPath] = process.argv.slice(2);
if (docxPath === undefined || htmlPath === undefined) {
    console.error("Usage: npm run run-ts -- scripts/layout-probes/guess-lines.ts <document>.docx <Word's PDF of it>.html");
    process.exit(2);
}

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
const parts = new Map<string, Element>();
const binaryParts = new Map<string, Uint8Array>();
for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) {
        continue;
    }
    if (path.endsWith(".xml") || path.endsWith(".rels")) {
        parts.set(path, xml2js(await file.async("string"), { compact: false, captureSpacesBetweenElements: true }) as Element);
    } else {
        binaryParts.set(path, await file.async("uint8array"));
    }
}

const plain = layOutPasses(readDocx(parts, binaryParts));
const guessed = layOutPasses(readDocx(parts, binaryParts, { guess: true }), undefined, true);
const wordPages = Math.max(0, ...WORD.map(({ page }) => page));
console.log(`Without a guess: ${plain.stoppedAt === undefined ? "laid out to the end" : `stops at "${plain.stoppedAt}"`}`);
console.log(
    `With one: ${guessed.pageCount} pages, Word's ${wordPages}${guessed.stoppedAt === undefined ? "" : `, stops at "${guessed.stoppedAt}"`}`,
);
guessed.pages.forEach(({ guesses = [] }, index) => guesses.forEach((reason) => console.log(`  page ${index + 1}: guessed at ${reason}`)));

// The page it first guessed on, from which its lines may not be where Word puts them
const firstGuess = guessed.pages.findIndex(({ guesses }) => guesses !== undefined) + 1;
if (firstGuess === 0) {
    process.exit(0);
}

// Each line with text laid out with a guess, in order, with its page
const lines = guessed.pages.flatMap((page, index) => {
    const of = (content: readonly BlockLayout[]): readonly string[] =>
        content.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => bare(text)) : []));
    return [...of(page.body), ...[...page.footnotes, ...page.endnotes].flatMap((note) => of(note.content))]
        .filter((text) => text.length > 0)
        .map((text) => ({ text, page: index + 1 }));
});

// How far ahead among Word's lines one is looked for: past the lines docx/layout doesn't lay out, such as those of headers
// and table cells
const AHEAD = 60;
let next = 0;
let laidOut = 0;
let found = 0;
let onPage = 0;
for (const line of lines) {
    let at: number | undefined;
    for (let index = next; index < Math.min(next + AHEAD, WORD.length) && at === undefined; index++) {
        at = WORD[index].text === line.text ? index : undefined;
    }
    if (line.page < firstGuess) {
        next = at === undefined ? next : at + 1;
        continue;
    }
    laidOut++;
    if (at === undefined) {
        continue;
    }
    found++;
    next = at + 1;
    if (WORD[at].page === line.page) {
        onPage++;
    } else {
        console.log(`  page ${line.page}, Word's ${WORD[at].page}: ${line.text.slice(0, 60)}`);
    }
}
console.log(`From page ${firstGuess} on: ${onPage} of ${found} lines found among Word's on Word's page (${laidOut} laid out)`);
