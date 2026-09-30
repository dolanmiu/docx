/**
 * Compares the page numbers docx/layout wrote into the tables of contents of the documents scripts/compare-layout.sh
 * made with the pages LibreOffice put their headings on, and Word, when PDFs of them saved from Word are there.
 *
 * Usage: npm run run-ts -- scripts/compare-layout.ts [directory]
 *
 * The directory (default build/layout) has each document's .docx, and the text of LibreOffice's pages of it in a .txt,
 * with the pages split by form feeds, as pdftotext writes them, and of Word's in a .word.txt. A heading is on the last page with a line of only its
 * text, as its entry in the table of contents, before it, has its page number on the line too. Spaces and tabs count as one
 * space, because pdftotext writes a tab, or a wide gap, as several. So the headings of the
 * documents compared are each on a line of their own, and their pages are numbered from 1. It fails when a heading's page
 * number isn't LibreOffice's or Word's, or is left blank.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import JSZip from "jszip";
import { type Element, xml2js } from "xml-js";

const directory = process.argv[2] ?? "build/layout";

/** The text of an element, with its tabs, leaving out field instructions */
const textOf = (element: Element): string => {
    if (element.type === "text") {
        return String(element.text);
    }
    if (element.name === "w:instrText") {
        return "";
    }
    if (element.name === "w:tab" && element.type === "element") {
        return "\t";
    }
    return (element.elements ?? []).map(textOf).join("");
};

/** Text with each run of spaces and tabs as one space, and none at either end */
const collapsed = (text: string): string => text.replace(/\s+/g, " ").trim();

const paragraphsIn = (element: Element): readonly Element[] =>
    element.name === "w:p" ? [element] : (element.elements ?? []).flatMap(paragraphsIn);

/** Each entry of the document's tables of contents: its heading's text, and the page number written for it */
const entriesOf = async (path: string): Promise<readonly { readonly title: string; readonly page: string }[]> => {
    const zip = await JSZip.loadAsync(readFileSync(path));
    const document = xml2js(await zip.file("word/document.xml")!.async("string"), { compact: false }) as Element;
    return paragraphsIn(document)
        .filter((paragraph) => JSON.stringify(paragraph).includes("PAGEREF _Toc"))
        .map((paragraph) => {
            // Leaving out the paragraph's properties, whose tab stops aren't tabs in its text
            const text = (paragraph.elements ?? [])
                .filter(({ name }) => name !== "w:pPr")
                .map(textOf)
                .join("");
            const split = text.lastIndexOf("\t");
            return { title: collapsed(text.slice(0, split)), page: text.slice(split + 1).trim() };
        });
};

/** The pages of a PDF's text, each as its lines, or undefined when there is no such file */
const pagesOf = (path: string): readonly (readonly string[])[] | undefined =>
    existsSync(path)
        ? readFileSync(path, "utf8")
              .split("\f")
              .map((page) => page.split("\n").map(collapsed))
        : undefined;

// What each document is compared with: LibreOffice's pages, and Word's when they are there (see scripts/compare-layout.sh)
const REFERENCES = [
    { name: "LibreOffice", suffix: ".txt" },
    { name: "Word", suffix: ".word.txt" },
] as const;

const counts = new Map(REFERENCES.map(({ name }) => [name, { compared: 0, matched: 0 }]));
for (const name of readdirSync(directory)
    .filter((file) => file.endsWith(".docx"))
    .sort()) {
    const entries = await entriesOf(join(directory, name));
    const references = REFERENCES.flatMap((reference) => {
        const pages = pagesOf(join(directory, name.replace(/\.docx$/, reference.suffix)));
        return pages ? [{ ...reference, pages }] : [];
    });
    console.log(`\n${name}`);
    for (const { title, page } of entries) {
        const results = references.map(({ name: reference, pages }) => {
            const found = String(pages.findLastIndex((lines) => lines.includes(title)) + 1);
            const count = counts.get(reference)!;
            count.compared++;
            count.matched += page === found ? 1 : 0;
            return `${page === found ? " " : "*"}${reference} ${found === "0" ? "none" : found.padStart(4)}`;
        });
        const matches = results.every((result) => result.startsWith(" "));
        console.log(
            `${matches ? "  ok  " : "  FAIL"}  ${title.padEnd(50)}  docx/layout ${(page || "blank").padStart(5)} ${results.join(" ")}`,
        );
    }
}

console.log("");
for (const [reference, { compared, matched }] of counts) {
    if (compared > 0) {
        console.log(`${matched} of ${compared} headings are on ${reference}'s page`);
    }
}
process.exit([...counts.values()].every(({ compared, matched }) => compared === matched) ? 0 : 1);
