/**
 * Writes a paragraph's content as docx's runs, hyperlinks and bookmarks, after collapsing its spaces as CSS does.
 *
 * @module
 */
import { Bookmark, DeletedTextRun, ExternalHyperlink, InsertedTextRun, InternalHyperlink, type ParagraphChild, Tab, TextRun } from "docx";

import type { Link, Revision, RunFormat, WrittenInline } from "./content";

/** A piece of a paragraph, after its spaces are collapsed */
type Piece =
    | { readonly type: "text"; readonly text: string; readonly format: RunFormat; readonly link?: Link; readonly revision?: Revision }
    | { readonly type: "tab"; readonly format: RunFormat; readonly link?: Link; readonly revision?: Revision }
    | { readonly type: "break"; readonly format: RunFormat; readonly link?: Link }
    | { readonly type: "atom"; readonly child: ParagraphChild; readonly link?: Link }
    | { readonly type: "bookmark"; readonly name: string };

type RunPiece = Extract<Piece, { readonly type: "text" | "tab" | "break" }>;

// Characters XML 1.0 doesn't allow, which would make Word say the document is unreadable
// eslint-disable-next-line no-control-regex
const NOT_IN_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
// A pair of surrogates, which is kept, or a lone half of one, which XML doesn't allow either
const SURROGATES = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g;

/** Text without the characters XML doesn't allow */
export const withoutInvalidCharacters = (text: string): string =>
    text.replace(NOT_IN_XML, "").replace(SURROGATES, (match) => (match.length === 2 ? match : ""));

const COLLAPSIBLE = /[ \t\n\r\f]+/g;
const NEW_LINE = /\r\n|\r|\n/;

/** Text with `text-transform`'s lowercase, or capitals at the start of words, after the character before it */
const transformed = (text: string, transform: "lowercase" | "capitalize" | undefined, before: string): string => {
    if (transform === "lowercase") {
        return text.toLowerCase();
    }
    return transform === "capitalize"
        ? text.replace(/(^|[\s\-/])(\p{L})/gu, (match, space: string, letter: string, offset: number) =>
              offset === 0 && /[\p{L}\p{N}]/u.test(before) ? match : space + letter.toUpperCase(),
          )
        : text;
};

/**
 * Collapses a paragraph's spaces as CSS does: in text whose `white-space` collapses them, spaces, tabs and new lines
 * are one space, which is left out at the start and end of a line and after another space, whatever elements it is
 * between. Preserved text, such as `<pre>`'s, keeps its spaces, and its tabs and new lines are tabs and line breaks.
 * A line break that ends the paragraph is left out, as it starts a line with nothing on it.
 */
const collapse = (content: readonly WrittenInline[]): readonly Piece[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const pieces: Piece[] = [];
    let lineStart = true;
    let previous = "";
    // A space waiting for content after it on the line, which is left out if none comes
    let space: Extract<Piece, { readonly type: "text" }> | undefined;

    const addSpace = (): void => {
        if (space) {
            // eslint-disable-next-line functional/immutable-data
            pieces.push(space);
            previous = " ";
            space = undefined;
        }
    };
    const addText = (text: string, item: Extract<WrittenInline, { readonly type: "text" }>): void => {
        const valid = withoutInvalidCharacters(text);
        if (valid !== "") {
            addSpace();
            // eslint-disable-next-line functional/immutable-data
            pieces.push({
                type: "text",
                text: transformed(valid, item.transform, previous),
                format: item.format,
                link: item.link,
                revision: item.revision,
            });
            previous = valid[valid.length - 1];
            lineStart = false;
        }
    };
    const addBreak = (format: RunFormat, link: Link | undefined): void => {
        // eslint-disable-next-line functional/immutable-data
        pieces.push({ type: "break", format, link });
        space = undefined;
        lineStart = true;
        previous = "";
    };

    for (const item of content) {
        if (item.type === "bookmark") {
            // eslint-disable-next-line functional/immutable-data
            pieces.push(item);
        } else if (item.type === "atom") {
            addSpace();
            // eslint-disable-next-line functional/immutable-data
            pieces.push(item);
            lineStart = false;
            previous = "￼";
        } else if (item.type === "break") {
            addBreak(item.format, item.link);
        } else if (item.whiteSpace === "pre" || item.whiteSpace === "pre-wrap" || item.whiteSpace === "break-spaces") {
            for (const [index, line] of item.text.split(NEW_LINE).entries()) {
                if (index > 0) {
                    addBreak(item.format, item.link);
                }
                for (const [partIndex, part] of line.split("\t").entries()) {
                    if (partIndex > 0) {
                        addSpace();
                        // eslint-disable-next-line functional/immutable-data
                        pieces.push({ type: "tab", format: item.format, link: item.link, revision: item.revision });
                        previous = "\t";
                        lineStart = false;
                    }
                    addText(part, item);
                }
            }
        } else {
            const lines = item.whiteSpace === "pre-line" ? item.text.split(NEW_LINE) : [item.text];
            for (const [index, line] of lines.entries()) {
                if (index > 0) {
                    addBreak(item.format, item.link);
                }
                for (const part of line.replace(COLLAPSIBLE, " ").split(/( )/)) {
                    if (part === " ") {
                        if (!lineStart && !space && previous !== " ") {
                            space = { type: "text", text: " ", format: item.format, link: item.link, revision: item.revision };
                        }
                    } else {
                        addText(part, item);
                    }
                }
            }
        }
    }

    // A line break at the end starts a line that has nothing on it, which a browser doesn't show
    const last = pieces.map((piece) => piece.type).lastIndexOf("break");
    return last !== -1 && pieces.slice(last + 1).every((piece) => piece.type === "bookmark")
        ? [...pieces.slice(0, last), ...pieces.slice(last + 1)]
        : pieces;
};

const sameFormat = (a: RunFormat, b: RunFormat): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Runs of text, tabs and line breaks, with each stretch of one formatting and revision in one run */
const runsOf = (pieces: readonly RunPiece[], idOf: () => number): readonly ParagraphChild[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const runs: ParagraphChild[] = [];
    let breaks = 0;
    // eslint-disable-next-line functional/prefer-readonly-type
    let children: (string | Tab)[] = [];
    let current: Exclude<RunPiece, { readonly type: "break" }> | undefined;

    const flush = (): void => {
        if (current === undefined) {
            return;
        }
        const options = { ...current.format, ...(breaks > 0 ? { break: breaks } : {}), children };
        const { revision } = current;
        if (revision === undefined) {
            // eslint-disable-next-line functional/immutable-data
            runs.push(new TextRun(options));
        } else {
            const change = { id: idOf(), author: revision.author, date: revision.date };
            // eslint-disable-next-line functional/immutable-data
            runs.push(
                revision.kind === "insertion"
                    ? new InsertedTextRun({ ...options, ...change })
                    : new DeletedTextRun({ ...options, ...change }),
            );
        }
        breaks = 0;
        children = [];
        current = undefined;
    };

    for (const piece of pieces) {
        if (piece.type === "break") {
            flush();
            breaks++;
        } else {
            if (current && (!sameFormat(current.format, piece.format) || current.revision !== piece.revision)) {
                flush();
            }
            current = current ?? piece;
            const last = children[children.length - 1];
            if (piece.type === "tab") {
                // eslint-disable-next-line functional/immutable-data
                children.push(new Tab());
            } else if (typeof last === "string") {
                // eslint-disable-next-line functional/immutable-data
                children[children.length - 1] = last + piece.text;
            } else {
                // eslint-disable-next-line functional/immutable-data
                children.push(piece.text);
            }
        }
    }
    flush();
    if (breaks > 0) {
        // Line breaks with no text after them, before an image, say
        // eslint-disable-next-line functional/immutable-data
        runs.push(new TextRun({ ...pieces[pieces.length - 1].format, break: breaks }));
    }
    return runs;
};

/** The content of a link, or of the text between links: its runs, with images and other content between them */
const childrenOf = (pieces: readonly Exclude<Piece, { readonly type: "bookmark" }>[], idOf: () => number): readonly ParagraphChild[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const children: ParagraphChild[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    let runs: RunPiece[] = [];
    for (const piece of pieces) {
        if (piece.type === "atom") {
            // eslint-disable-next-line functional/immutable-data
            children.push(...runsOf(runs, idOf), piece.child);
            runs = [];
        } else {
            // eslint-disable-next-line functional/immutable-data
            runs.push(piece);
        }
    }
    return [...children, ...runsOf(runs, idOf)];
};

/**
 * Writes a paragraph's content: its text in runs, with links in hyperlinks, and its images, checkboxes and other
 * content as they are.
 *
 * @param content - The paragraph's content
 * @param idOf - Gives each tracked change an id no other in the document has
 */
export const writeInline = (content: readonly WrittenInline[], idOf: () => number): readonly ParagraphChild[] => {
    const pieces = collapse(content);
    // eslint-disable-next-line functional/prefer-readonly-type
    const children: ParagraphChild[] = [];
    let index = 0;
    while (index < pieces.length) {
        const piece = pieces[index];
        if (piece.type === "bookmark") {
            // eslint-disable-next-line functional/immutable-data
            children.push(new Bookmark({ id: piece.name, children: [] }));
            index++;
            continue;
        }
        const { link } = piece;
        let end = index + 1;
        while (end < pieces.length && pieces[end].type !== "bookmark" && (pieces[end] as { readonly link?: Link }).link === link) {
            end++;
        }
        const written = childrenOf(pieces.slice(index, end) as readonly Exclude<Piece, { readonly type: "bookmark" }>[], idOf);
        if (link === undefined) {
            // eslint-disable-next-line functional/immutable-data
            children.push(...written);
        } else if ("href" in link) {
            // eslint-disable-next-line functional/immutable-data
            children.push(new ExternalHyperlink({ link: link.href, children: written }));
        } else {
            // eslint-disable-next-line functional/immutable-data
            children.push(new InternalHyperlink({ anchor: link.anchor, children: written }));
        }
        index = end;
    }
    return children;
};
