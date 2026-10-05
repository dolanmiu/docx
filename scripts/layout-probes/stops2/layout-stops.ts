/**
 * Writes docx/layout's layout of a probe document as JSON, for word-stops.py to compare with Word's PDF: each line of the
 * body and the notes, and each table row, with its page and where it is, in twips from the top and left margins (1440).
 * Each probe is laid out on its own, from its line "<name> above" to the next probe's, as a document of its own with the
 * properties of the section it is in, so one probe's stop doesn't hide the others, and through the .docx adapter with a guess
 * (`guess: true`), so the layout goes on past what it would stop at. It says where each probe stops without a guess, and
 * what is guessed at. Each probe's pages are numbered from 1, its own first page.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/layout-stops.ts <document>.docx > <document>.layout.json
 */
import { readFileSync } from "node:fs";

import type { Element } from "xml-js";

import { patchDocument } from "../../../src/index";
import { layOutPasses } from "../../../src/layout/layout-passes";
import { readDocx } from "../../../src/layout/read-docx";

const [path] = process.argv.slice(2);
const TWIPS = 20;
const MARGIN = 1440;

const textOf = (element: Element): string =>
    element.type === "text" ? String(element.text) : element.name === "w:instrText" ? "" : (element.elements ?? []).map(textOf).join("");

/** The section properties a paragraph ends its section with, if it does */
const sectionOf = (element: Element): Element | undefined =>
    element.name === "w:p"
        ? element.elements?.find(({ name }) => name === "w:pPr")?.elements?.find(({ name }) => name === "w:sectPr")
        : undefined;

/**
 * The document part with its body cut to some of its elements, ending with the section properties of the section the
 * last of them is in: those of the first paragraph from there on that ends a section, or the body's own
 */
const withBody = (document: Element, body: Element, all: readonly Element[], from: number, to: number): Element => {
    const children = all.slice(from, to);
    const ending = all
        .slice(to - 1)
        .map(sectionOf)
        .find((sectPr) => sectPr !== undefined);
    const sectPr = ending ? [ending] : (body.elements ?? []).filter(({ name }) => name === "w:sectPr");
    const root = document.elements!.find(({ type }) => type === "element")!;
    return {
        ...document,
        elements: document.elements!.map((element) =>
            element === root
                ? {
                      ...root,
                      elements: root.elements!.map((child) => (child === body ? { ...body, elements: [...children, ...sectPr] } : child)),
                  }
                : element,
        ),
    };
};

await patchDocument({
    outputType: "uint8array",
    data: readFileSync(path!),
    patches: {},
    pageNumbers: ({ parts, binaryParts, importedDocuments }) => {
        const document = parts.get("word/document.xml")!;
        const root = document.elements!.find(({ type }) => type === "element")!;
        const body = root.elements!.find(({ name }) => name === "w:body")!;
        const elements = (body.elements ?? []).filter(({ name }) => name !== "w:sectPr");
        const starts = elements.flatMap((element, index) => (element.name === "w:p" && / above$/.test(textOf(element)) ? [index] : []));
        const probes = starts.map((start, index) => ({
            name: textOf(elements[start]).replace(/ above$/, ""),
            from: index === 0 ? 0 : start,
            to: starts[index + 1] ?? elements.length,
        }));
        const whole = layOutPasses(readDocx(parts, binaryParts, {}, importedDocuments));
        const lines: unknown[] = [];
        const results: unknown[] = [];
        for (const { name, from, to } of probes) {
            const cut = new Map(parts);
            cut.set("word/document.xml", withBody(document, body, elements, from, to));
            const result: Record<string, unknown> = { name };
            try {
                const plain = layOutPasses(readDocx(cut, binaryParts, {}, importedDocuments));
                result.stoppedAt = plain.stoppedAt ?? null;
            } catch (error) {
                result.error = String(error).slice(0, 200);
            }
            try {
                const guessed = layOutPasses(readDocx(cut, binaryParts, { guess: true }, importedDocuments), undefined, true);
                result.guessStoppedAt = guessed.stoppedAt ?? null;
                result.guesses = [...new Set(guessed.pages.flatMap(({ guesses = [] }) => guesses))];
                guessed.pages.forEach((page, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const blocks = (content: readonly any[], where: string): void => {
                        for (const block of content) {
                            if (block.type === "paragraph") {
                                for (const one of block.lines) {
                                    lines.push({
                                        probe: name,
                                        page: index + 1,
                                        where,
                                        top: Math.round(one.y * TWIPS - MARGIN),
                                        left: Math.round(one.x * TWIPS - MARGIN),
                                        width: Math.round(one.width * TWIPS),
                                        height: Math.round(one.height * TWIPS),
                                        textWidth: Math.round(one.textWidth * TWIPS),
                                        text: one.text,
                                    });
                                }
                            } else {
                                for (const row of block.rows) {
                                    lines.push({
                                        probe: name,
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
                result.pages = guessed.pages.length;
            } catch (error) {
                result.guessError = String(error).slice(0, 200);
            }
            results.push(result);
        }
        console.log(JSON.stringify({ stoppedAt: whole.stoppedAt ?? null, probes: results, lines }));
        return { bookmarks: new Map() };
    },
});
