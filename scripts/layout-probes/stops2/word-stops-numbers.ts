/**
 * Probes of list numbers, number formats and fields where docx/layout stops, after `word-lists.docx` (LJ, LO, LR, LF),
 * `word-page-number-formats.docx` and `word-page-fields.docx` (PF1 to PF8).
 *
 * Lists (LI):
 * LI1: a %3 in the text of a level-0 number, in a list with only 2 levels ("a list number of a level its list doesn't
 *   have")
 * LI2: a list whose level 1 starts at 5 (w:start), its first paragraph at level 1 under a level-0 one not yet counted,
 *   with "%1.%2" ("a list number of a level not counted yet, which its list starts at a number of its own")
 * LI3a, LI3b: a centred number followed by a space (w:suff space) (a), and by nothing (b)
 * LI4a to LI4c: a number with a border (a), emphasis marks (b), raised 6 points (c), from its level's run properties
 * LI5a, LI5b: a number of 20 points beside text of 11, at 1.5 lines (a) and double (b) ("a list number taller than its
 *   line's text, with multiple line spacing")
 * LI6a to LI6c: a number aligned right that ends at a tab stop of the paragraph's own (a), at a left indent off the
 *   default stops without a hanging indent (b), and on a default stop after a first line indent (c) ("a tab after a list
 *   number aligned right, which Word hasn't been seen to move")
 * LI7a, LI7b: a paragraph of only its number, the number in Courier New 14 and the mark in Calibri 11 (a), and the number
 *   11 and the mark 20 (b) ("a line of only a list number of another size or font than its paragraph's mark")
 * LI8: picture bullets (w:lvlPicBulletId) ("a list whose bullets are pictures")
 * LI9: a level numbered as Word 6 did (w:legacy, with legacySpace and legacyIndent)
 * LI10: a list defined by a list style (w:numStyleLink to a style whose w:styleLink defines the levels)
 * LI11: levels aligned both (w:lvlJc both) ("a list number aligned in a way not yet followed")
 * LI12: list numbers between paragraphs with automatic spacing, of other levels and of lists made from one definition
 *   ("automatic spacing between paragraphs of other levels of a list, or of lists made alike")
 *
 * Number formats and fields (NF):
 * NF1a to NF1e: page numbers in Hebrew at 101, 250 and 398 (hebrew1), and in Hindi letters at 76 and 38 (hindiVowels,
 *   hindiConsonants) ("a page number its format isn't written for yet"), each in a section of its own starting there,
 *   with PAGE in the footer and a PAGEREF to a bookmark on the page
 * NF1f: page 32768 in roman numerals, on the second page of a section numbered from 32767, the same way
 * NF2a to NF2d: a PAGEREF with \* CardText, \* DollarText, \* OrdText and \* Hex ("a number in a field format not yet
 *   written")
 * NF3a to NF3d: a PAGEREF with \# "0.00", \# "#,##0", \# "x##", and \# "'p'00" ("a number written with a picture not
 *   yet written")
 * NF4: a PAGEREF with \p in a footnote, to a bookmark in the text ("a page reference that says where its bookmark is,
 *   in a footnote or endnote")
 * NF5: a chapter heading (Heading 1, numbered) in a table cell, in a section whose page numbers have chapter numbers
 *   (w:chapStyle 1, the last section)
 * NF6: list numbers in Thai words (thaiCounting) and Hindi (hindiCounting) at 1 to 5 ("a list number in a format not
 *   yet written")
 * NF7: footnotes numbered in a format not yet written: w:numFmt ideographDigital
 *
 * The documents, each of related probes, so one that Word can't open doesn't lose the others:
 * word-stops-lists.docx: LI1 to LI7, LI12, NF6
 * word-stops-list-definitions.docx: LI9, LI10, LI11, whose definitions docx can't write
 * word-stops-picture-bullets.docx: LI8
 * word-stops-page-formats.docx: NF7, NF1a to NF1e, NF5
 * word-stops-page-32768.docx: NF1f
 * word-stops-fields.docx: NF2 to NF4, which asks Word to update its fields when it opens it (w:updateFields), so its PDF
 *   has Word's results of their page references: answer Yes for it, and No (or nothing is asked) for the others
 *
 * Word 16 for Mac couldn't open the batch's word-stops-numbers.docx, which had all of them but NF2 to NF4 ("Word
 * experienced an error trying to open the file"). Its parts were valid against the schemas. Two things in it Word may
 * not take: NF1f's section numbered from 32768, past the 32767 Word numbers pages to, and LI8's picture bullet, written
 * without the shape's id and o:bullet Word writes. NF1f now starts from 32767, and the picture bullet is written as Word
 * writes it; each is in a document of its own all the same.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-numbers.ts [folder]
 */
import {
    AlignmentType,
    Bookmark,
    BorderStyle,
    EmphasisMarkType,
    Footer,
    HeadingLevel,
    type ISectionOptions,
    LevelFormat,
    LevelSuffix,
    LineRuleType,
    PageNumber,
    PageReference,
    Paragraph,
    SectionType,
    Table,
    TableRow,
    TabStopType,
    TextRun,
} from "docx";

import { ALL_BORDERS, PAGE, PNG, cell, fill, footnote, line, probe, prose, withProperty, write } from "./kit";

const numbered = (reference: string, level: number, text: string, options: object = {}): Paragraph =>
    new Paragraph({ ...options, numbering: { reference, level }, children: text ? [new TextRun(text)] : [] });
const indent = (left: number, hanging = 360) => ({ paragraph: { indent: { left, hanging } } });

const LISTS = [
    { reference: "li1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.%3.", style: indent(720) }, { level: 1, format: LevelFormat.DECIMAL, text: "%1.%2.", style: indent(1440) }] },
    { reference: "li2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: indent(720) }, { level: 1, format: LevelFormat.DECIMAL, text: "%1.%2.", start: 5, style: indent(1440) }] },
    { reference: "li3a", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.CENTER, suffix: LevelSuffix.SPACE, style: indent(720) }] },
    { reference: "li3b", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.CENTER, suffix: LevelSuffix.NOTHING, style: indent(720) }] },
    { reference: "li4a", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { ...indent(720), run: { border: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 4 } } } }] },
    { reference: "li4b", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { ...indent(720), run: { emphasisMark: { type: EmphasisMarkType.DOT } } } }] },
    { reference: "li4c", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { ...indent(720), run: { position: "6pt" } } }] },
    { reference: "li5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { ...indent(720), run: { size: 40 } } }] },
    { reference: "li6a", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.RIGHT, style: indent(1000, 500) }] },
    { reference: "li6b", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { left: 1000 } } } }] },
    { reference: "li6c", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { left: 0, firstLine: 720 } } } }] },
    { reference: "li7a", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { ...indent(720), run: { font: "Courier New", size: 28 } } }] },
    { reference: "li7b", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { ...indent(720), run: { size: 22 } } }] },
    { reference: "li8", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", style: indent(720) }] },
    { reference: "li9", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: indent(720) }] },
    { reference: "li11", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: indent(720) }] },
    { reference: "li12", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: indent(720) }, { level: 1, format: LevelFormat.DECIMAL, text: "%1.%2.", style: indent(1440) }] },
    { reference: "nf6a", levels: [{ level: 0, format: "thaiCounting" as never, text: "%1.", style: indent(1440, 1080) }] },
    { reference: "nf6b", levels: [{ level: 0, format: "hindiCounting" as never, text: "%1.", style: indent(1440, 1080) }] },
    { reference: "headings", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1", style: indent(432, 432) }] },
];

const auto = { spacing: { beforeAutoSpacing: true, afterAutoSpacing: true } } as object;

const pageField = (name: string, instruction: string): Paragraph =>
    new Paragraph({ children: [new TextRun(`${name} `), new TextRun("@@FIELD_" + Buffer.from(instruction).toString("hex") + "@@"), new TextRun(" end")] });

const listsOf = (...references: readonly string[]) => LISTS.filter(({ reference }) => references.includes(reference));

/**
 * Changes the levels of a list in the numbering part: the abstract definitions are written in the order of the config,
 * after docx's own
 */
const changeList = (numbering: string, config: readonly { readonly reference: string }[], reference: string, change: (xml: string) => string): string => {
    const index = config.findIndex((list) => list.reference === reference);
    const abstracts = [...numbering.matchAll(/<w:abstractNum [^>]*>.*?<\/w:abstractNum>/gs)];
    const abstract = abstracts[abstracts.length - config.length + index];
    return numbering.replace(abstract[0], change(abstract[0]));
};

/** Takes out of the footnotes part those no reference in the body refers to, which the kit writes for every document */
const onlyReferencedNotes = (parts: Map<string, string>): void => {
    const notes = parts.get("word/footnotes.xml");
    if (notes === undefined) {
        return;
    }
    const referenced = new Set([...parts.get("word/document.xml")!.matchAll(/<w:footnoteReference [^>]*w:id="(-?\d+)"/g)].map(([, id]) => id));
    parts.set(
        "word/footnotes.xml",
        notes.replace(/<w:footnote w:id="(\d+)">.*?<\/w:footnote>/gs, (note, id: string) => (referenced.has(id) ? note : "")),
    );
};

/** A page number field of the footer, clean, so Word opens the document without asking to update it */
const cleanFields = (parts: Map<string, string>): void => {
    for (const [path, text] of parts) {
        if (/^word\/(document|footer\d*)\.xml$/.test(path)) {
            parts.set(path, text.replace(/ w:dirty="true"/g, ""));
        }
    }
};

const NUMBER_FORMATS: readonly (readonly [string, string, number])[] = [
    ["NF1a", "hebrew1", 101],
    ["NF1b", "hebrew1", 250],
    ["NF1c", "hebrew1", 398],
    ["NF1d", "hindiVowels", 76],
    ["NF1e", "hindiConsonants", 38],
];

/** A section of its own whose pages are numbered from a number in a format, with a bookmark on its page and a reference to it */
const numberedSection = (name: string, format: string, start: number, pagesBefore = 0): ISectionOptions => ({
    properties: { page: { ...PAGE.page, pageNumbers: { start, formatType: format as never } }, type: SectionType.NEXT_PAGE },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun(`${name} page `), new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
    children: [
        line(`${name} above`),
        ...Array.from({ length: pagesBefore }, (_, index) => line(`${name} page before ${index + 1}`)),
        new Paragraph({
            pageBreakBefore: pagesBefore > 0,
            children: [new TextRun(`${name} target`), new Bookmark({ id: name.toLowerCase(), children: [new TextRun(" here")] })],
        }),
        new Paragraph({ children: [new TextRun(`${name} reference `), new PageReference(name.toLowerCase()), new TextRun(" end")] }),
        line(`${name} below`),
    ],
});

// Each document's sections are made when it is written, so a footnote's paragraph is marked once, by its own document

// word-stops-lists.docx: LI1 to LI7, LI12 and NF6, lists docx writes itself
const LISTS_CONFIG = listsOf("li1", "li2", "li3a", "li3b", "li4a", "li4b", "li4c", "li5", "li6a", "li6b", "li6c", "li7a", "li7b", "li12", "nf6a", "nf6b");
await write({
    name: "word-stops-lists",
    options: { numbering: { config: LISTS_CONFIG } } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("LI1", [numbered("li1", 0, "LI1 one"), numbered("li1", 1, "LI1 one one"), numbered("li1", 0, "LI1 two")]),
                ...probe("LI2", [numbered("li2", 1, "LI2 level 1 first"), numbered("li2", 1, "LI2 level 1 second"), numbered("li2", 0, "LI2 level 0")]),
                ...probe("LI3a", [numbered("li3a", 0, `LI3a ${prose(30)}`), numbered("li3a", 0, `LI3a ${prose(30)}`)]),
                ...probe("LI3b", [numbered("li3b", 0, `LI3b ${prose(30)}`), numbered("li3b", 0, `LI3b ${prose(30)}`)]),
                ...["a", "b", "c"].flatMap((letter) => probe(`LI4${letter}`, [numbered(`li4${letter}`, 0, `LI4${letter} ${prose(30)}`), numbered(`li4${letter}`, 0, `LI4${letter} ${prose(30)}`)])),
                ...probe("LI5a", [numbered("li5", 0, `LI5a ${prose(40)}`, { spacing: { line: 360, lineRule: LineRuleType.AUTO } }), line("LI5a next")]),
                ...probe("LI5b", [numbered("li5", 0, `LI5b ${prose(40)}`, { spacing: { line: 480, lineRule: LineRuleType.AUTO } }), line("LI5b next")]),
                ...probe("LI6a", Array.from({ length: 12 }, (_, index) => numbered("li6a", 0, `LI6a item ${index + 1}`, { tabStops: [{ type: TabStopType.LEFT, position: 1200 }] }))),
                ...probe("LI6b", Array.from({ length: 12 }, (_, index) => numbered("li6b", 0, `LI6b item ${index + 1}`))),
                ...probe("LI6c", Array.from({ length: 12 }, (_, index) => numbered("li6c", 0, `LI6c item ${index + 1}`))),
                ...probe("LI7a", [numbered("li7a", 0, ""), line("LI7a next")]),
                ...probe("LI7b", [numbered("li7b", 0, "", { run: { size: 40 } }), line("LI7b next")]),
                ...probe("LI12", [numbered("li12", 0, "LI12 one", auto), numbered("li12", 1, "LI12 one one", auto), numbered("li12", 0, "LI12 two", auto), numbered("li3a", 0, "LI12 other list", auto), line("LI12 after", auto)]),
                ...probe("NF6", [
                    ...[1, 2, 3, 4, 5].map((index) => numbered("nf6a", 0, `NF6 thai ${index}`)),
                    ...[1, 2, 3, 4, 5].map((index) => numbered("nf6b", 0, `NF6 hindi ${index}`)),
                ]),
            ],
        },
    ],
    injections: [onlyReferencedNotes],
});

// word-stops-list-definitions.docx: LI9 (w:legacy), LI10 (a list style) and LI11 (w:lvlJc both), which docx can't write
const DEFINITIONS_CONFIG = listsOf("li9", "li11");
await write({
    name: "word-stops-list-definitions",
    options: { numbering: { config: DEFINITIONS_CONFIG } } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("LI9", [numbered("li9", 0, `LI9 ${prose(30)}`), numbered("li9", 0, `LI9 ${prose(30)}`)]),
                ...probe("LI10", [new Paragraph({ children: [new TextRun("@@LI10@@"), new TextRun(`LI10 ${prose(30)}`)] }), new Paragraph({ children: [new TextRun("@@LI10b@@"), new TextRun(`LI10 ${prose(30)}`)] })]),
                ...probe("LI11", [numbered("li11", 0, `LI11 ${prose(30)}`), numbered("li11", 0, `LI11 ${prose(30)}`)]),
            ],
        },
    ],
    injections: [
        onlyReferencedNotes,
        (parts) => {
            // LI10's paragraphs are numbered by a list whose levels are the list style's, as Word writes one: a definition
            // with w:numStyleLink to the style, whose w:numPr names a list of the definition with w:styleLink to it
            let text = parts.get("word/document.xml")!;
            text = text.replace(/<w:r><w:t xml:space="preserve">@@LI10b?@@<\/w:t><\/w:r>/g, "");
            for (const at of [...text.matchAll(/LI10 the/g)].map(({ index }) => index).reverse()) {
                const paragraphStart = text.lastIndexOf("<w:p>", at);
                text = text.slice(0, paragraphStart) + text.slice(paragraphStart).replace("<w:p>", '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="9301"/></w:numPr></w:pPr>');
            }
            parts.set("word/document.xml", text);
            let numbering = parts.get("word/numbering.xml")!;
            numbering = changeList(numbering, DEFINITIONS_CONFIG, "li9", (xml) => xml.replace(/<w:lvlJc /, '<w:legacy w:legacy="1" w:legacySpace="120" w:legacyIndent="360"/><w:lvlJc '));
            numbering = changeList(numbering, DEFINITIONS_CONFIG, "li11", (xml) => xml.replace(/<w:lvlJc w:val="[^"]*"\/>/, '<w:lvlJc w:val="both"/>'));
            const levels = Array.from(
                { length: 9 },
                (_, level) =>
                    `<w:lvl w:ilvl="${level}"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%${level + 1})"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${1080 + 720 * level}" w:hanging="720"/></w:pPr></w:lvl>`,
            ).join("");
            numbering = numbering.replace(
                "<w:num ",
                `<w:abstractNum w:abstractNumId="9300"><w:multiLevelType w:val="multilevel"/><w:styleLink w:val="ProbeListStyle"/>${levels}</w:abstractNum><w:abstractNum w:abstractNumId="9301"><w:multiLevelType w:val="multilevel"/><w:numStyleLink w:val="ProbeListStyle"/></w:abstractNum><w:num `,
            );
            numbering = numbering.replace("</w:numbering>", '<w:num w:numId="9300"><w:abstractNumId w:val="9300"/></w:num><w:num w:numId="9301"><w:abstractNumId w:val="9301"/></w:num></w:numbering>');
            parts.set("word/numbering.xml", numbering);
            const styles = parts.get("word/styles.xml")!;
            parts.set(
                "word/styles.xml",
                styles.replace(
                    "</w:styles>",
                    '<w:style w:type="numbering" w:customStyle="1" w:styleId="ProbeListStyle"><w:name w:val="Probe List Style"/><w:uiPriority w:val="99"/><w:pPr><w:numPr><w:numId w:val="9300"/></w:numPr></w:pPr></w:style></w:styles>',
                ),
            );
        },
    ],
});

// word-stops-picture-bullets.docx: LI8, a list whose bullets are a picture, written as Word writes one
const PICTURE_CONFIG = listsOf("li8");
await write({
    name: "word-stops-picture-bullets",
    options: { numbering: { config: PICTURE_CONFIG } } as object,
    sections: [{ properties: PAGE, children: [...probe("LI8", [numbered("li8", 0, `LI8 ${prose(30)}`), numbered("li8", 0, `LI8 ${prose(30)}`)])] }],
    injections: [
        onlyReferencedNotes,
        (parts) => {
            let numbering = parts.get("word/numbering.xml")!;
            numbering = changeList(numbering, PICTURE_CONFIG, "li8", (xml) => xml.replace(/<w:lvlText [^>]*\/>/, '<w:lvlText w:val=""/><w:lvlPicBulletId w:val="0"/>'));
            numbering = numbering.replace(
                "<w:abstractNum ",
                '<w:numPicBullet w:numPicBulletId="0"><w:pict><v:shape xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" id="_x0000_i1025" style="width:9pt;height:9pt" o:bullet="t"><v:imagedata xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdStopsImage" o:title=""/></v:shape></w:pict></w:numPicBullet><w:abstractNum ',
            );
            parts.set("word/numbering.xml", numbering);
            const rels = parts.get("word/_rels/numbering.xml.rels") ?? '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
            parts.set("word/_rels/numbering.xml.rels", rels.replace("</Relationships>", '<Relationship Id="rIdStopsImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/stops.png"/></Relationships>'));
            const types = parts.get("[Content_Types].xml")!;
            if (!types.includes('Extension="png"')) {
                parts.set("[Content_Types].xml", types.replace("</Types>", '<Default Extension="png" ContentType="image/png"/></Types>'));
            }
        },
    ],
    files: { "word/media/stops.png": PNG },
});

// word-stops-page-formats.docx: NF7's footnotes, NF1a to NF1e's page numbers, and NF5's chapter heading in a cell
await write({
    name: "word-stops-page-formats",
    options: { numbering: { config: listsOf("headings") } } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...probe("NF7", [new Paragraph({ children: [new TextRun("NF7 one"), footnote(line("NF7 note one"))] }), new Paragraph({ children: [new TextRun("NF7 two"), footnote(line("NF7 note two"))] })]),
            ],
        },
        ...NUMBER_FORMATS.map(([name, format, start]) => numberedSection(name, format, start)),
        {
            properties: { page: { ...PAGE.page, pageNumbers: { start: 1, chapterHeadingLevel: 1, separator: "hyphen" as never } }, type: SectionType.NEXT_PAGE },
            footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun("NF5 page "), new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
            children: [
                line("NF5 above"),
                new Table({ borders: ALL_BORDERS, rows: [new TableRow({ children: [cell([new Paragraph({ heading: HeadingLevel.HEADING_1, numbering: { reference: "headings", level: 0 }, children: [new TextRun("NF5 heading in a cell")] })])] })] }),
                ...fill("NF5", 3),
                line("NF5 below"),
            ],
        },
    ],
    injections: [
        onlyReferencedNotes,
        cleanFields,
        // NF7: the footnotes' format, in the first section's properties
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set("word/document.xml", withProperty(text, "w:sectPr", '<w:footnotePr><w:numFmt w:val="ideographDigital"/></w:footnotePr>', text.indexOf("<w:sectPr")));
        },
    ],
});

// word-stops-page-32768.docx: NF1f, page 32768 in roman numerals, the page after one numbered 32767, the most a section
// can start from, as Word reads a page number in 16 bits; the batch's NF1f started a section at 32768
await write({ name: "word-stops-page-32768", sections: [numberedSection("NF1f", "upperRoman", 32767, 1)], injections: [cleanFields] });

const fieldXml = (instruction: string): string =>
    `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${instruction} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>?</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;

// word-stops-fields.docx: NF2 to NF4, whose page references Word works out when it opens the document: answer Yes
const fieldChildren = [
    ...probe("NF2", [
                new Paragraph({ children: [new TextRun("NF2 target"), new Bookmark({ id: "nf2", children: [new TextRun(" here")] })] }),
                pageField("NF2a", "PAGEREF nf2 \\* CardText"),
                pageField("NF2b", "PAGEREF nf2 \\* DollarText"),
                pageField("NF2c", "PAGEREF nf2 \\* OrdText"),
                pageField("NF2d", "PAGEREF nf2 \\* Hex"),
                pageField("NF3a", 'PAGEREF nf2 \\# "0.00"'),
                pageField("NF3b", 'PAGEREF nf2 \\# "#,##0"'),
                pageField("NF3c", 'PAGEREF nf2 \\# "x##"'),
                pageField("NF3d", "PAGEREF nf2 \\# \"'p'00\""),
            ]),
    ...probe("NF4", [
                new Paragraph({ children: [new TextRun("NF4 target"), new Bookmark({ id: "nf4text", children: [new TextRun(" here")] })] }),
                ...fill("NF4", 3),
                new Paragraph({ children: [new TextRun("NF4 reference"), footnote(pageField("NF4a note", "PAGEREF nf4text \\p"))] }),
            ]),
];
await write({
    name: "word-stops-fields",
    sections: [{ properties: PAGE, children: fieldChildren }],
    options: { features: { updateFields: true } } as object,
    injections: [
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set("word/document.xml", text.replace(/<w:r><w:t xml:space="preserve">@@FIELD_([0-9a-f]+)@@<\/w:t><\/w:r>/g, (_, hex: string) => fieldXml(Buffer.from(hex, "hex").toString())));
            const notes = parts.get("word/footnotes.xml")!;
            parts.set("word/footnotes.xml", notes.replace(/<w:r><w:t xml:space="preserve">@@FIELD_([0-9a-f]+)@@<\/w:t><\/w:r>/g, (_, hex: string) => fieldXml(Buffer.from(hex, "hex").toString())));
        },
    ],
});
