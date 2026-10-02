/**
 * Compares the page numbers docx/layout wrote into the tables of contents of the documents scripts/compare-layout.sh
 * made with the pages LibreOffice put their headings on, and Word, when PDFs of them saved from Word are there. Then it
 * compares docx/layout with Word's own pages in documents saved from Word, through the .docx adapter.
 *
 * Usage: npm run run-ts -- scripts/compare-layout.ts [directory]
 *
 * The directory (default build/layout) has each document's .docx, and the text of LibreOffice's pages of it in a .txt,
 * with the pages split by form feeds, as pdftotext writes them, and of Word's in a .word.txt. A heading is on the last
 * page with a line of only its text, as its entry in the table of contents, before it, has its page number on the line
 * too. Spaces and tabs count as one space, because pdftotext can write a tab, or a wide gap, as several. So the headings
 * of the documents compared are each on a line of their own, and their pages are numbered from 1. It fails when a
 * heading's page number isn't LibreOffice's or Word's, or is left blank, when the number of pages written into a NUMPAGES
 * field isn't the number of pages of LibreOffice's or Word's PDF, and when there is no text of LibreOffice's pages of a
 * document, as when it couldn't convert it.
 *
 * A document saved from Word, named after it with .word.docx, such as text-and-spacing.word.docx, has Word's own pages:
 * Word writes a w:lastRenderedPageBreak where each page began when it last laid the document out. docx/layout lays out
 * the document Word saved, read through the .docx adapter as patchDocument's templates are, and each bookmark a page
 * reference refers to, such as each heading of a table of contents, is compared with the page Word put it on. It fails
 * when one isn't on Word's page, and when the number of pages isn't Word's. A document whose marks don't have all of
 * Word's pages (see wordPagesOf) isn't compared.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import JSZip from "jszip";
import { type Element, xml2js } from "xml-js";

import { estimatePageNumbers } from "../src/layout/estimate-page-numbers";

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

/** The results written into the NUMPAGES fields of the document's text, headers and footers */
const pageCountsOf = async (path: string): Promise<readonly string[]> => {
    const zip = await JSZip.loadAsync(readFileSync(path));
    const parts = Object.keys(zip.files).filter((file) => /^word\/(document|header\d+|footer\d+)\.xml$/.test(file));
    const results: string[] = [];
    const fields: { instruction: string; result?: string }[] = [];
    const read = (element: Element): void => {
        const field = fields[fields.length - 1];
        const type = element.name === "w:fldChar" ? element.attributes?.["w:fldCharType"] : undefined;
        if (type === "begin") {
            fields.push({ instruction: "" });
        } else if (type === "separate" && field) {
            field.result = "";
        } else if (type === "end" && field) {
            fields.pop();
            if (/^\s*NUMPAGES\b/.test(field.instruction)) {
                results.push(field.result ?? "");
            }
        } else if (element.name === "w:instrText" && field) {
            field.instruction += textOf({ ...element, name: "w:t" });
        } else if (element.name === "w:t" && field?.result !== undefined) {
            field.result += textOf(element);
        } else {
            (element.elements ?? []).forEach(read);
        }
    };
    for (const part of parts) {
        read(xml2js(await zip.file(part)!.async("string"), { compact: false }) as Element);
    }
    return results;
};

/** The first element of the name in an element, in document order */
const findElement = (element: Element, name: string): Element | undefined =>
    element.name === name
        ? element
        : (element.elements ?? []).reduce<Element | undefined>((found, child) => found ?? findElement(child, name), undefined);

/** The XML parts of a .docx, parsed as patchDocument parses them, by their paths */
const partsOf = async (path: string): Promise<ReadonlyMap<string, Element>> => {
    const zip = await JSZip.loadAsync(readFileSync(path));
    const paths = Object.keys(zip.files).filter((file) => file.endsWith(".xml") || file.endsWith(".rels"));
    return new Map(
        await Promise.all(
            paths.map(
                async (file) =>
                    [
                        file,
                        xml2js(await zip.file(file)!.async("string"), { compact: false, captureSpacesBetweenElements: true }) as Element,
                    ] as const,
            ),
        ),
    );
};

/**
 * Word's pages of a document it saved, read from the w:lastRenderedPageBreak elements Word writes where each page began
 * when it last laid the document out: the page each bookmark starts on, as of the first text after it, and the number
 * of pages. Also each bookmark's paragraph's text, and the bookmarks page references refer to.
 *
 * Word's PDFs of the layout demos showed where it writes them, and where it doesn't:
 *
 * - a row that breaks across pages has one in each of its cells that goes on to the next page, which are one page
 * - the row or paragraph just after a row that broke across pages starts with one, though it is on the same page
 * - there is none for the blank page before a section that starts on an odd or even page, so one is added when the
 *   section would start on a page of the other kind, with pages counted from 1
 * - there is none where a column break starts a page, in a table of contents, nor on the pages Word hadn't laid out yet
 *   when it saved the document, so the pages read are only Word's when there are as many of them as Word says the
 *   document has (`Pages` in docProps/app.xml)
 */
const wordPagesOf = (
    document: Element,
): {
    readonly pages: ReadonlyMap<string, number>;
    readonly titles: ReadonlyMap<string, string>;
    readonly referred: readonly string[];
    readonly pageCount: number;
} => {
    const pages = new Map<string, number>();
    const titles = new Map<string, string>();
    const referred = new Set<string>();
    // How each section starts, from its properties at its end
    const starts: string[] = [];
    const findSections = (element: Element): void => {
        if (element.name === "w:sectPr") {
            starts.push(String(element.elements?.find(({ name }) => name === "w:type")?.attributes?.["w:val"] ?? "nextPage"));
        }
        (element.elements ?? []).forEach(findSections);
    };
    findSections(document);
    let page = 1;
    let section = 0;
    let sectionStarted = false;
    let waiting: string[] = [];
    // Whether a row just broke across pages, so a mark before any text after it is on the same page
    let afterBrokenRow = false;
    // The row being read: whether it has had a mark, which is its page's, and text, and whether it broke across pages
    let row: { counted: boolean; text: boolean; broke: boolean } | undefined;
    const read = (element: Element, paragraph: Element | undefined): void => {
        if (element.name === "w:lastRenderedPageBreak") {
            if (afterBrokenRow) {
                afterBrokenRow = false;
            } else if (!row?.counted) {
                page++;
                row = row && { ...row, counted: true };
            }
            row = row && { ...row, broke: row.broke || row.text };
        } else if (element.name === "w:bookmarkStart") {
            const name = String(element.attributes?.["w:name"]);
            waiting.push(name);
            titles.set(name, collapsed(paragraph ? textOf(paragraph) : ""));
        } else if (element.name === "w:instrText") {
            const reference = /^\s*PAGEREF\s+("?)([^\s"\\]+)\1/i.exec(textOf({ ...element, name: "w:t" }));
            if (reference) {
                referred.add(reference[2]);
            }
        } else if ((element.name === "w:t" && textOf(element).length > 0) || element.name === "w:tab" || element.name === "w:drawing") {
            const start = starts[section];
            if (sectionStarted && ((start === "oddPage" && page % 2 === 0) || (start === "evenPage" && page % 2 === 1))) {
                // The blank page before it
                page++;
            }
            sectionStarted = false;
            afterBrokenRow = false;
            row = row && { ...row, text: true };
            waiting.forEach((name) => pages.set(name, page));
            waiting = [];
        } else if (element.name === "w:tr" && !row) {
            row = { counted: false, text: false, broke: false };
            (element.elements ?? []).forEach((child) => read(child, paragraph));
            afterBrokenRow = row.broke;
            row = undefined;
        } else {
            (element.elements ?? []).forEach((child) => read(child, element.name === "w:p" ? element : paragraph));
            // A paragraph whose properties have its section's ends the section
            if (
                element.name === "w:p" &&
                element.elements?.find(({ name }) => name === "w:pPr")?.elements?.some(({ name }) => name === "w:sectPr")
            ) {
                section++;
                sectionStarted = true;
            }
        }
    };
    read(document, undefined);
    return { pages, titles, referred: [...referred], pageCount: page };
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
const pageCounts = new Map(REFERENCES.map(({ name }) => [name, { compared: 0, matched: 0 }]));
// The documents LibreOffice didn't lay out, which aren't compared
const notLaidOut: string[] = [];
for (const name of readdirSync(directory)
    .filter((file) => file.endsWith(".docx") && !file.endsWith(".word.docx"))
    .sort()) {
    const entries = await entriesOf(join(directory, name));
    const references = REFERENCES.flatMap((reference) => {
        const pages = pagesOf(join(directory, name.replace(/\.docx$/, reference.suffix)));
        return pages ? [{ ...reference, pages }] : [];
    });
    console.log(`\n${name}`);
    if (!references.some((reference) => reference.name === "LibreOffice")) {
        console.log("  FAIL  LibreOffice didn't lay it out");
        notLaidOut.push(name);
    }
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
    // pdftotext ends each page with a form feed
    const written = [...new Set(await pageCountsOf(join(directory, name)))];
    if (written.length > 0) {
        const results = references.map(({ name: reference, pages }) => {
            const found = String(pages.length - 1);
            const count = pageCounts.get(reference)!;
            count.compared++;
            count.matched += written.length === 1 && written[0] === found ? 1 : 0;
            return `${written.length === 1 && written[0] === found ? " " : "*"}${reference} ${found.padStart(4)}`;
        });
        const matches = results.every((result) => result.startsWith(" "));
        console.log(
            `${matches ? "  ok  " : "  FAIL"}  ${"Number of pages (NUMPAGES)".padEnd(50)}  docx/layout ${(written.join(", ") || "blank").padStart(5)} ${results.join(" ")}`,
        );
    }
}

// Documents saved from Word, laid out through the .docx adapter, and compared with the pages Word marked in them. Each has
// Word's own pages in it, so it stays a check of docx/layout when the demo it was saved from changes, as Word's PDF of
// the demo doesn't
const saved = { compared: 0, matched: 0 };
const savedPageCounts = { compared: 0, matched: 0 };
// The documents whose marks don't have all of Word's pages, which aren't compared
const notMarked: string[] = [];
for (const name of readdirSync(directory)
    .filter((file) => file.endsWith(".word.docx"))
    .sort()) {
    const parts = await partsOf(join(directory, name));
    const marked = wordPagesOf(parts.get("word/document.xml")!);
    // The number of pages Word had laid out when it saved the document
    const app = parts.get("docProps/app.xml");
    const pagesElement = app && findElement(app, "Pages");
    const laidOut = pagesElement ? Number(textOf(pagesElement)) : undefined;
    if (laidOut !== marked.pageCount) {
        console.log(
            `\n${name}, saved from Word: its marks have ${marked.pageCount} of its ${laidOut ?? "unknown"} pages, so it isn't compared`,
        );
        notMarked.push(name);
        continue;
    }
    console.log(`\n${name}, saved from Word`);
    const estimate = estimatePageNumbers({ parts });
    for (const bookmark of marked.referred.filter((referredTo) => marked.pages.has(referredTo))) {
        const page = estimate.bookmarks.get(bookmark) ?? "";
        const found = String(marked.pages.get(bookmark));
        saved.compared++;
        saved.matched += page === found ? 1 : 0;
        console.log(
            `${page === found ? "  ok  " : "  FAIL"}  ${marked.titles.get(bookmark)!.slice(0, 50).padEnd(50)}  docx/layout ${(page || "blank").padStart(5)} ${page === found ? " " : "*"}Word ${found.padStart(4)}`,
        );
    }
    const counted = String(estimate.pageCount ?? "");
    savedPageCounts.compared++;
    savedPageCounts.matched += counted === String(laidOut) ? 1 : 0;
    console.log(
        `${counted === String(laidOut) ? "  ok  " : "  FAIL"}  ${"Number of pages".padEnd(50)}  docx/layout ${(counted || "blank").padStart(5)} ${counted === String(laidOut) ? " " : "*"}Word ${String(laidOut).padStart(4)}`,
    );
}

console.log("");
for (const [reference, { compared, matched }] of counts) {
    if (compared > 0) {
        console.log(`${matched} of ${compared} headings are on ${reference}'s page`);
    }
}
for (const [reference, { compared, matched }] of pageCounts) {
    if (compared > 0) {
        console.log(`${matched} of ${compared} numbers of pages are ${reference}'s`);
    }
}
if (saved.compared > 0) {
    console.log(
        `${saved.matched} of ${saved.compared} headings are on Word's page in the documents saved from Word, laid out through the .docx adapter`,
    );
    console.log(`${savedPageCounts.matched} of ${savedPageCounts.compared} numbers of pages are Word's in the documents saved from Word`);
}
if (notMarked.length > 0) {
    console.log(`Word's marks don't have all the pages of ${notMarked.join(", ")}, which aren't compared`);
}
if (notLaidOut.length > 0) {
    console.log(`LibreOffice didn't lay out ${notLaidOut.join(", ")}`);
}
process.exit(
    notLaidOut.length === 0 &&
        [...counts.values(), ...pageCounts.values(), saved, savedPageCounts].every(({ compared, matched }) => compared === matched)
        ? 0
        : 1,
);
