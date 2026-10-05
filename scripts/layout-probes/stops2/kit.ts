/**
 * The shared kit of the lay-stops2 probe documents: what each document is laid out with, and the helpers that write its
 * probes. Each probe starts a page of its own, or is marked off by a line above and below it, and each line of text names
 * its probe, such as "TV3a cell 1", so word-stops.py finds it in a PDF Word saves of the document.
 *
 * The documents are A4 with margins of an inch (1440 twips), so the text is 9026 twips wide and 13958 tall, in Calibri 11
 * at single spacing with no space before or after: 51 lines of 268.55 twips to a page, as in round 8's probes.
 *
 * What docx can't write, such as `w:tcFitText` or a hidden paragraph mark, is written as a marker and replaced in the
 * package's XML (`inject`), as `word-watertight-text.ts` does.
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import JSZip from "jszip";

import {
    AlignmentType,
    BorderStyle,
    Document,
    ImageRun,
    FootnoteReferenceRun,
    type IParagraphOptions,
    type ISectionOptions,
    type ITableCellOptions,
    type ITableOptions,
    type IRunOptions,
    Packer,
    Paragraph,
    type ParagraphChild,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

export const PAGE_WIDTH = 11906;
export const PAGE_HEIGHT = 16838;
export const MARGIN = 1440;
export const TEXT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export type Child = Paragraph | Table;
export type Options = Omit<IParagraphOptions, "children" | "text">;

/** A one-line paragraph of text, in the paragraph's font */
export const line = (text: string, options: Options = {}, run: Omit<IRunOptions, "text"> = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun({ ...run, text })] });

/** Lines of one paragraph each: "<probe> fill 1" and on */
export const fill = (probe: string, count: number, from = 1, options: Options = {}): Paragraph[] =>
    Array.from({ length: count }, (_, index) => line(`${probe} fill ${from + index}`, options));

/** One paragraph of lines split by line breaks, each "<probe> <word> <n>" */
export const lines = (probe: string, count: number, options: Options = {}, word = "line", run: Omit<IRunOptions, "text"> = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from(
            { length: count },
            (_, index) => new TextRun({ ...run, text: `${probe} ${word} ${index + 1}`, ...(index > 0 ? { break: 1 } : {}) }),
        ),
    });

const WORDS = "the in foot mouth made on river was and the coast boat to the by lighthouse of summer the survey the from".split(" ");
/** Prose of a number of words, the same words in the same order wherever it is used, so a line can be told by its text */
export const prose = (count: number, from = 0): string =>
    Array.from({ length: count }, (_, index) => WORDS[(from + index) % WORDS.length]).join(" ");

/** A paragraph of prose, starting with its probe's name */
export const para = (probe: string, words: number, options: Options = {}, run: Omit<IRunOptions, "text"> = {}): Paragraph =>
    line(`${probe} ${prose(words)}`, options, run);

/** A probe: its name, the line above it, what it has, and the line below it, on a page of its own */
export const probe = (name: string, children: readonly Child[], { below = true }: { readonly below?: boolean } = {}): Child[] =>
    // ONLY, in the environment, keeps the probes whose names start with it, to lay one out alone
    process.env.ONLY && !process.env.ONLY.split(",").some((only) => name.startsWith(only))
        ? []
        : [line(`${name} above`, { pageBreakBefore: true }), ...children, ...(below ? [line(`${name} below`)] : [])];

/** A probe on the page where the one before ends, between a line above and a line below it */
export const group = (name: string, children: readonly Child[]): Child[] =>
    process.env.ONLY && !process.env.ONLY.split(",").some((only) => name.startsWith(only))
        ? []
        : [line(`${name} above`), ...children, line(`${name} below`)];

/** A page break before the next probe, as a paragraph of its own that names no probe */
export const newPage = (): Paragraph => new Paragraph({ pageBreakBefore: true, children: [] });

let footnoteCount = 0;
const footnoteBodies: Record<number, { children: Paragraph[] }> = {};
/** A footnote reference, with the footnote's paragraphs or tables */
export const footnote = (...children: Child[]): FootnoteReferenceRun => {
    footnoteCount++;
    // A footnote can have a table in it, though the option's type only names paragraphs
    footnoteBodies[footnoteCount] = { children: children as Paragraph[] };
    return new FootnoteReferenceRun(footnoteCount);
};
/** A paragraph of text with a footnote reference after it */
export const withNote = (text: string, note: readonly Child[], options: Options = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun(text), footnote(...note)] });

export const SINGLE = { style: BorderStyle.SINGLE, size: 4, color: "000000" } as const;
export const ALL_BORDERS = {
    top: SINGLE,
    bottom: SINGLE,
    left: SINGLE,
    right: SINGLE,
    insideHorizontal: SINGLE,
    insideVertical: SINGLE,
} as const;

/** A cell of one or more paragraphs, each a line of text, or the children given */
export const cell = (content: string | readonly Child[], options: Omit<ITableCellOptions, "children"> = {}): TableCell =>
    new TableCell({
        ...options,
        children: typeof content === "string" ? content.split("\n").map((text) => line(text)) : [...content],
    });

/** A table of rows of cells, with single borders all round, as docx's demos have them, unless the options say otherwise */
export const table = (rows: readonly (readonly (string | TableCell)[])[], options: Omit<ITableOptions, "rows"> = {}): Table =>
    new Table({
        borders: ALL_BORDERS,
        ...options,
        rows: rows.map(
            (cells) => new TableRow({ children: cells.map((content) => (typeof content === "string" ? cell(content) : content)) }),
        ),
    });

/** A table whose columns are given widths in twips, and its cells the same */
export const fixedTable = (
    widths: readonly number[],
    rows: readonly (readonly string[])[],
    options: Omit<ITableOptions, "rows"> = {},
): Table =>
    new Table({
        borders: ALL_BORDERS,
        columnWidths: [...widths],
        width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
        ...options,
        rows: rows.map(
            (cells) =>
                new TableRow({ children: cells.map((text, index) => cell(text, { width: { size: widths[index], type: WidthType.DXA } })) }),
        ),
    });

// A grey square PNG, drawn at the size given
export const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQImWNoaGgAAAMEAYEezv+mAAAAAElFTkSuQmCC", "base64");
/** A picture in the line, `width` by `height` points */
export const picture = (width: number, height = width): ImageRun =>
    new ImageRun({ type: "png", data: PNG, transformation: { width: (width * 96) / 72, height: (height * 96) / 72 } });

/** A marker run, replaced in the XML by an injection of the same name */
export const marker = (name: string): TextRun => new TextRun(`@@${name}@@`);
/** A paragraph with a marker run in it, among other runs */
export const marked = (name: string, before: string, after = "", options: Options = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun(before), marker(name), ...(after ? [new TextRun(after)] : [])] });

/**
 * What to do to a part of the package once docx has written it: a function of its XML, or a part to add. Markers are
 * replaced with `replaceMarkerRun`, `replaceMarkerParagraphProperties` and the like
 */
export type Injection = (parts: Map<string, string>) => void;

/** Replaces the run docx wrote for a marker with XML of its own */
export const replaceMarkerRun =
    (name: string, xml: string, part = "word/document.xml"): Injection =>
    (parts) => {
        const text = parts.get(part)!;
        const pattern = new RegExp(`<w:r>(<w:rPr>(?:(?!</w:rPr>).)*</w:rPr>)?<w:t xml:space="preserve">@@${name}@@</w:t></w:r>`, "g");
        if (!pattern.test(text)) {
            throw new Error(`No marker ${name} in ${part}`);
        }
        parts.set(part, text.replace(pattern, xml));
    };

/**
 * Adds XML to the properties of the paragraph (or run of the paragraph's mark) the marker is in, and takes the marker
 * out: `pPr` is put at the end of the paragraph's properties, before its mark's run properties and section properties
 */
export const injectIntoParagraph =
    (
        name: string,
        { pPr = "", rPr = "", before = "", after = "" }: { pPr?: string; rPr?: string; before?: string; after?: string },
        part = "word/document.xml",
    ): Injection =>
    (parts) => {
        const text = parts.get(part)!;
        const at = text.indexOf(`@@${name}@@`);
        if (at < 0) {
            throw new Error(`No marker ${name} in ${part}`);
        }
        const start = Math.max(text.lastIndexOf("<w:p>", at), text.lastIndexOf("<w:p ", at));
        const end = text.indexOf("</w:p>", at) + "</w:p>".length;
        let paragraph = text.slice(start, end);
        // The marker's run goes
        paragraph = paragraph.replace(
            new RegExp(`<w:r>(<w:rPr>(?:(?!</w:rPr>).)*</w:rPr>)?<w:t xml:space="preserve">@@${name}@@</w:t></w:r>`),
            "",
        );
        const open = paragraph.indexOf(">") + 1;
        for (const child of childrenIn(pPr)) {
            paragraph = withProperty(paragraph, "w:pPr", child, open);
        }
        if (rPr) {
            const propertiesEnd = paragraph.indexOf("</w:pPr>");
            const markProps = paragraph.indexOf("<w:rPr>");
            paragraph =
                propertiesEnd >= 0 && markProps >= 0 && markProps < propertiesEnd
                    ? paragraph.replace("<w:rPr>", `<w:rPr>${rPr}`)
                    : withProperty(paragraph, "w:pPr", `<w:rPr>${rPr}</w:rPr>`, open);
        }
        parts.set(part, text.slice(0, start) + before + paragraph + after + text.slice(end));
    };

/** The order of the children of the properties elements, as their schema (wml.xsd) has them */
export const ORDER: Readonly<Record<string, readonly string[]>> = {
    "w:pPr": [
        "pStyle",
        "keepNext",
        "keepLines",
        "pageBreakBefore",
        "framePr",
        "widowControl",
        "numPr",
        "suppressLineNumbers",
        "pBdr",
        "shd",
        "tabs",
        "suppressAutoHyphens",
        "kinsoku",
        "wordWrap",
        "overflowPunct",
        "topLinePunct",
        "autoSpaceDE",
        "autoSpaceDN",
        "bidi",
        "adjustRightInd",
        "snapToGrid",
        "spacing",
        "ind",
        "contextualSpacing",
        "mirrorIndents",
        "suppressOverlap",
        "jc",
        "textDirection",
        "textAlignment",
        "textboxTightWrap",
        "outlineLvl",
        "divId",
        "cnfStyle",
        "rPr",
        "sectPr",
        "pPrChange",
    ],
    "w:tcPr": [
        "cnfStyle",
        "tcW",
        "gridSpan",
        "hMerge",
        "vMerge",
        "tcBorders",
        "shd",
        "noWrap",
        "tcMar",
        "textDirection",
        "tcFitText",
        "vAlign",
        "hideMark",
        "headers",
        "cellIns",
        "cellDel",
        "cellMerge",
        "tcPrChange",
    ],
    "w:tblPr": [
        "tblStyle",
        "tblpPr",
        "tblOverlap",
        "bidiVisual",
        "tblStyleRowBandSize",
        "tblStyleColBandSize",
        "tblW",
        "jc",
        "tblCellSpacing",
        "tblInd",
        "tblBorders",
        "shd",
        "tblLayout",
        "tblCellMar",
        "tblLook",
        "tblCaption",
        "tblDescription",
        "tblPrChange",
    ],
    "w:trPr": [
        "cnfStyle",
        "divId",
        "gridBefore",
        "gridAfter",
        "wBefore",
        "wAfter",
        "cantSplit",
        "trHeight",
        "tblHeader",
        "tblCellSpacing",
        "jc",
        "hidden",
        "ins",
        "del",
        "trPrChange",
    ],
    "w:settings": [
        "writeProtection",
        "view",
        "zoom",
        "removePersonalInformation",
        "removeDateAndTime",
        "doNotDisplayPageBoundaries",
        "displayBackgroundShape",
        "printPostScriptOverText",
        "printFractionalCharacterWidth",
        "printFormsData",
        "embedTrueTypeFonts",
        "embedSystemFonts",
        "saveSubsetFonts",
        "saveFormsData",
        "mirrorMargins",
        "alignBordersAndEdges",
        "bordersDoNotSurroundHeader",
        "bordersDoNotSurroundFooter",
        "gutterAtTop",
        "hideSpellingErrors",
        "hideGrammaticalErrors",
        "activeWritingStyle",
        "proofState",
        "formsDesign",
        "attachedTemplate",
        "linkStyles",
        "stylePaneFormatFilter",
        "stylePaneSortMethod",
        "documentType",
        "mailMerge",
        "revisionView",
        "trackRevisions",
        "doNotTrackMoves",
        "doNotTrackFormatting",
        "documentProtection",
        "autoFormatOverride",
        "styleLockTheme",
        "styleLockQFSet",
        "defaultTabStop",
        "autoHyphenation",
        "consecutiveHyphenLimit",
        "hyphenationZone",
        "doNotHyphenateCaps",
        "showEnvelope",
        "summaryLength",
        "clickAndTypeStyle",
        "defaultTableStyle",
        "evenAndOddHeaders",
        "bookFoldRevPrinting",
        "bookFoldPrinting",
        "bookFoldPrintingSheets",
        "drawingGridHorizontalSpacing",
        "drawingGridVerticalSpacing",
        "displayHorizontalDrawingGridEvery",
        "displayVerticalDrawingGridEvery",
        "doNotUseMarginsForDrawingGridOrigin",
        "drawingGridHorizontalOrigin",
        "drawingGridVerticalOrigin",
        "doNotShadeFormData",
        "noPunctuationKerning",
        "characterSpacingControl",
        "printTwoOnOne",
        "strictFirstAndLastChars",
        "noLineBreaksAfter",
        "noLineBreaksBefore",
        "savePreviewPicture",
        "doNotValidateAgainstSchema",
        "saveInvalidXml",
        "ignoreMixedContent",
        "alwaysShowPlaceholderText",
        "doNotDemarcateInvalidXml",
        "saveXmlDataOnly",
        "useXSLTWhenSaving",
        "saveThroughXslt",
        "showXMLTags",
        "alwaysMergeEmptyNamespace",
        "updateFields",
        "hdrShapeDefaults",
        "footnotePr",
        "endnotePr",
        "compat",
        "docVars",
        "rsids",
        "mathPr",
        "attachedSchema",
        "themeFontLang",
        "clrSchemeMapping",
        "doNotIncludeSubdocsInStats",
        "doNotAutoCompressPictures",
        "forceUpgrade",
        "captions",
        "readModeInkLockDown",
        "smartTagType",
        "schemaLibrary",
        "shapeDefaults",
        "doNotEmbedSmartTags",
        "decimalSymbol",
        "listSeparator",
    ],
    "w:sectPr": [
        "headerReference",
        "footerReference",
        "footnotePr",
        "endnotePr",
        "type",
        "pgSz",
        "pgMar",
        "paperSrc",
        "pgBorders",
        "lnNumType",
        "pgNumType",
        "cols",
        "formProt",
        "vAlign",
        "noEndnote",
        "titlePg",
        "textDirection",
        "bidi",
        "rtlGutter",
        "docGrid",
        "printerSettings",
        "sectPrChange",
    ],
};

/** The local name of the element an XML string starts with, such as "tcW" for "<w:tcW .../>" */
const nameAt = (xml: string): string => /^<\w+:(\w+)/.exec(xml)?.[1] ?? "";

/** The top-level children of an element's content, as strings */
export const childrenIn = (content: string): string[] => {
    const children: string[] = [];
    let at = 0;
    while (at < content.length) {
        const start = content.indexOf("<", at);
        if (start < 0) {
            break;
        }
        const name = /^<([\w:]+)/.exec(content.slice(start))![1];
        const close = content.indexOf(">", start);
        if (content[close - 1] === "/") {
            children.push(content.slice(start, close + 1));
            at = close + 1;
            continue;
        }
        // The matching end, counting elements of the same name inside
        let depth = 1;
        let cursor = close + 1;
        const tags = new RegExp(`<${name}[ >/]|</${name}>`, "g");
        tags.lastIndex = cursor;
        for (let match = tags.exec(content); match; match = tags.exec(content)) {
            if (match[0].startsWith("</")) {
                depth--;
            } else if (!content.slice(match.index, content.indexOf(">", match.index) + 1).endsWith("/>")) {
                depth++;
            }
            if (depth === 0) {
                cursor = match.index + match[0].length;
                break;
            }
        }
        children.push(content.slice(start, cursor));
        at = cursor;
    }
    return children;
};

/**
 * Puts a child into the properties element (such as `w:tcPr`) that starts at or after `from` in the XML, before `before`,
 * in the place its schema gives it, in place of one of the same name; or makes the element at `from` when there is none.
 * Returns the new XML
 */
export const withProperty = (xml: string, element: string, child: string, from: number, before = xml.length): string => {
    const opening = new RegExp(`<${element}[ >]`, "g");
    opening.lastIndex = from;
    const start = opening.exec(xml)?.index ?? -1;
    const order = ORDER[element];
    if (start < 0 || start >= before) {
        return `${xml.slice(0, from)}<${element}>${child}</${element}>${xml.slice(from)}`;
    }
    const contentStart = xml.indexOf(">", start) + 1;
    const end = xml.indexOf(`</${element}>`, start);
    const children = childrenIn(xml.slice(contentStart, end)).filter((one) => nameAt(one) !== nameAt(child));
    const rank = (one: string): number => order.indexOf(nameAt(one));
    const index = children.findIndex((one) => rank(one) > rank(child));
    children.splice(index < 0 ? children.length : index, 0, child);
    return `${xml.slice(0, contentStart)}${children.join("")}${xml.slice(end)}`;
};

/** Puts children into the settings, each in the place its schema gives it */
export const settings =
    (...children: readonly string[]): Injection =>
    (parts) => {
        let text = parts.get("word/settings.xml")!;
        for (const child of children) {
            text = withProperty(text, "w:settings", child, 0);
        }
        parts.set("word/settings.xml", text);
    };

/** Replaces text in a part */
export const replaceText =
    (from: string | RegExp, to: string, part = "word/document.xml"): Injection =>
    (parts) => {
        const text = parts.get(part)!;
        if (typeof from === "string" ? !text.includes(from) : !from.test(text)) {
            throw new Error(`Nothing to replace for ${String(from)} in ${part}`);
        }
        parts.set(part, typeof from === "string" ? text.split(from).join(to) : text.replace(from, to));
    };

/** Writes each U+00AD in the text as a soft hyphen (`w:softHyphen`), which Word breaks at, where it draws U+00AD as a hyphen */
export const softHyphens =
    (part = "word/document.xml"): Injection =>
    (parts) => {
        const text = parts.get(part)!;
        parts.set(
            part,
            text.replace(/<w:t xml:space="preserve">([^<]*\u00AD[^<]*)<\/w:t>/g, (_, content: string) =>
                content
                    .split("\u00AD")
                    .map((piece) => `<w:t xml:space="preserve">${piece}</w:t>`)
                    .join("<w:softHyphen/>"),
            ),
        );
    };

export type ProbeDocument = {
    /** Its file name, without .docx */
    readonly name: string;
    /** Its sections, or its probes' children in one section of the kit's page */
    readonly sections?: readonly ISectionOptions[];
    readonly children?: readonly Child[];
    readonly injections?: readonly Injection[];
    /** Options of the document beyond the kit's own */
    readonly options?: Omit<ConstructorParameters<typeof Document>[0], "sections">;
    /** The size of the default font, in half-points */
    readonly size?: number;
    readonly font?: string;
    /** Parts to add to the package as they are, such as a picture an injection refers to */
    readonly files?: Readonly<Record<string, Uint8Array>>;
};

/** The kit's page, for a section */
export const PAGE = {
    page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 708, footer: 708 },
    },
} as const;

/** Writes a probe document into the folder given as the script's first argument, or build/word-stops */
export const write = async ({
    name,
    sections,
    children,
    injections = [],
    options = {},
    size = 22,
    font = "Calibri",
    files = {},
}: ProbeDocument): Promise<string> => {
    const doc = new Document({
        ...options,
        styles: {
            ...(options.styles ?? {}),
            default: {
                document: { run: { font, size }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
                ...(options.styles?.default ?? {}),
            },
        },
        footnotes: { ...footnoteBodies, ...((options as { footnotes?: object }).footnotes ?? {}) },
        sections: sections ? [...sections] : [{ properties: PAGE, children: [...(children ?? [])] }],
    });
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const parts = new Map<string, string>();
    for (const path of Object.keys(zip.files).filter((file) => /\.(xml|rels)$/.test(file))) {
        parts.set(path, await zip.file(path)!.async("string"));
    }
    for (const injection of injections) {
        try {
            injection(parts);
        } catch (error) {
            // A probe left out with ONLY leaves its markers out too
            if (!process.env.ONLY) {
                throw error;
            }
        }
    }
    for (const [path, text] of parts) {
        zip.file(path, text);
    }
    for (const [path, data] of Object.entries(files)) {
        zip.file(path, data);
    }
    const folder = process.argv[2] ?? "build/word-stops";
    mkdirSync(folder, { recursive: true });
    const out = join(folder, `${name}.docx`);
    writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    console.log(`wrote ${out}`);
    return out;
};

export { AlignmentType, BorderStyle, Paragraph, Table, TableCell, TableRow, TextRun, WidthType };
export type { ParagraphChild };
