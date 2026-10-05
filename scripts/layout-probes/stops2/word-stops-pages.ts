/**
 * Probes of columns, page settings and document settings docx/layout stops at. Settings that apply to the whole document
 * are in documents of their own.
 *
 * word-stops-pages.docx:
 * CO1a, CO1b: a paragraph of prose kept together, about 40 lines in the widest column and taller than a column in the
 *   others, in 3 columns of 1500, 2500 and 4026 (a), and of 4026, 1500 and 2500 (b) ("a paragraph kept together taller
 *   than some of 3 or more columns of different widths"; CS3 to CS6 had 2)
 * CO2a, CO2b: a line kept with the next before such a paragraph, about 40 lines in the wide column, in columns of 2000
 *   and 6026 (a) and of 6026 and 2000 (b) ("a paragraph kept with the next before one kept together taller than some of
 *   the columns but not others")
 * GT1a, GT1b: a gutter of 720 at the top (w:gutterAtTop) with mirrored margins (a), and with a top margin of -1440 and a
 *   header of 6 lines (b) ("a gutter at the top with mirrored margins or a negative top margin"; ST3 and SC3 had neither)
 * DV1a, DV1b: a paragraph in an HTML division (w:divId) whose margins are 720 left and right, with a border (a), and a
 *   table row in one (b) ("a paragraph in an HTML division", "a table row in an HTML division")
 * TB10a to TB10c: docx's text box in the line, with one line that only just fits its width: 200 points of text in a box
 *   of 200 points (a), 201 points (b), and 199 (c) ("a line in a text box that only just fits")
 *
 * word-stops-booklet.docx: pages printed as a folded booklet (w:bookFoldPrinting), with 4 sheets a booklet
 *   (BK1: 60 lines, which the layout pages half as wide)
 * word-stops-two-on-one.docx: two pages printed on each sheet (w:printTwoOnOne) (TO1: 60 lines)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-pages.ts [folder]
 */
import { Column, Header, type ISectionOptions, Paragraph, SectionType, Table, TableRow, TextRun, Textbox, WidthType } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { ALL_BORDERS, PAGE, cell, fill, line, lines, marker, probe, prose, settings, write } from "./kit";

const CALIBRI = { font: "Calibri", size: 11 };
/** Prose as near `points` wide as words make it, and its width */
const proseOf = (name: string, points: number): string => {
    let text = name;
    let from = 0;
    while (measureTextWidth(`${text} ${prose(1, from)}`, CALIBRI) <= points) {
        text = `${text} ${prose(1, from)}`;
        from++;
    }
    return text;
};

/** A paragraph of prose kept together, as many lines as `lines` in a column `width` twips wide */
const keptProse = (name: string, lines: number, width: number): Paragraph => {
    const target = (lines * width * 0.92) / 20;
    let count = 10;
    while (measureTextWidth(prose(count), CALIBRI) < target) {
        count += 5;
    }
    return new Paragraph({ keepLines: true, children: [new TextRun(`${name} kept ${prose(count)}`)] });
};

const columns = (widths: readonly number[]) => ({
    count: widths.length,
    equalWidth: false,
    children: widths.map((width, index) => new Column({ width, space: index < widths.length - 1 ? 500 : 0 })),
});

const sections: ISectionOptions[] = [
    ...(
        [
            ["CO1a", [1500, 2500, 4026]],
            ["CO1b", [4026, 1500, 2500]],
        ] as const
    ).map(([name, widths]): ISectionOptions => ({
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: columns(widths) },
        children: [line(`${name} above`), ...fill(name, 10), keptProse(name, 40, 4026), line(`${name} below`)],
    })),
    ...(
        [
            ["CO2a", [2000, 6026]],
            ["CO2b", [6026, 2000]],
        ] as const
    ).map(([name, widths]): ISectionOptions => ({
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: columns(widths) },
        children: [
            line(`${name} above`),
            ...fill(name, 10),
            line(`${name} with next`, { keepNext: true }),
            keptProse(name, 40, 6026),
            line(`${name} below`),
        ],
    })),
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE },
        children: [
            ...probe("DV1a", [new Paragraph({ children: [new TextRun(`DV1a ${prose(60)}`), marker("DIV_a")] }), line("DV1a next")]),
            ...probe("DV1b", [
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [9026],
                    borders: ALL_BORDERS,
                    rows: [
                        new TableRow({ children: [cell("DV1b row 1")] }),
                        new TableRow({ children: [cell("DV1b row 2 in the division")] }),
                    ],
                }),
            ]),
            ...[200, 201, 199].flatMap((width, index) => {
                const name = `TB10${"abc"[index]}`;
                return probe(name, [
                    new Paragraph({
                        children: [
                            new TextRun(`${name} `),
                            new Textbox({
                                style: { width: `${width}pt`, height: "auto" },
                                children: [line(proseOf(`${name}x`, 200 - 14.4))],
                            }),
                            new TextRun(" after"),
                        ],
                    }),
                ]);
            }),
        ],
    },
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, page: { ...PAGE.page, margin: { ...PAGE.page.margin, gutter: 720 } } },
        children: [line("GT1a above"), ...fill("GT1a", 60), line("GT1a below"), marker("GUTTER_a")],
    },
    {
        properties: {
            ...PAGE,
            type: SectionType.NEXT_PAGE,
            page: { ...PAGE.page, margin: { ...PAGE.page.margin, top: -1440, gutter: 720 } },
        },
        headers: { default: new Header({ children: [lines("GT1b header", 6)] }) },
        children: [line("GT1b above"), ...fill("GT1b", 60), line("GT1b below")],
    },
];

const WEB_SETTINGS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:divs><w:div w:id="1001"><w:marLeft w:val="720"/><w:marRight w:val="720"/><w:marTop w:val="120"/><w:marBottom w:val="120"/><w:divBdr><w:top w:val="single" w:sz="12" w:space="4" w:color="000000"/><w:left w:val="single" w:sz="12" w:space="4" w:color="000000"/><w:bottom w:val="single" w:sz="12" w:space="4" w:color="000000"/><w:right w:val="single" w:sz="12" w:space="4" w:color="000000"/></w:divBdr></w:div></w:divs></w:webSettings>';

await write({
    name: "word-stops-pages",
    sections,
    injections: [
        // DV1a: the paragraph in the division. Each injection throws where its probe isn't in the document, as the kit's do,
        // so a document of some probes (ONLY) leaves it out rather than editing another place
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf("@@DIV_a@@");
            if (at < 0) {
                throw new Error("No marker DIV_a in word/document.xml");
            }
            const start = text.lastIndexOf("<w:p>", at);
            const paragraph = text.slice(start).replace("<w:p>", '<w:p><w:pPr><w:divId w:val="1001"/></w:pPr>');
            parts.set(
                "word/document.xml",
                (text.slice(0, start) + paragraph).replace(/<w:r><w:t xml:space="preserve">@@DIV_a@@<\/w:t><\/w:r>/, ""),
            );
        },
        // DV1b: the second row in the division
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf(">DV1b row 2 in the division<");
            if (at < 0) {
                throw new Error("No DV1b row 2 in word/document.xml");
            }
            const row = text.lastIndexOf("<w:tr>", at) + "<w:tr>".length;
            parts.set("word/document.xml", text.slice(0, row) + '<w:trPr><w:divId w:val="1001"/></w:trPr>' + text.slice(row));
        },
        (parts) => {
            let text = parts.get("word/document.xml")!;
            // GT1: a gutter at the top, with mirrored margins in GT1a
            text = text.replace(/<w:r><w:t xml:space="preserve">@@GUTTER_a@@<\/w:t><\/w:r>/, "");
            parts.set("word/document.xml", text);
            settings("<w:mirrorMargins/>", "<w:gutterAtTop/>")(parts);
            parts.set("word/webSettings.xml", WEB_SETTINGS);
            const rels = parts.get("word/_rels/document.xml.rels")!;
            if (!rels.includes("webSettings")) {
                parts.set(
                    "word/_rels/document.xml.rels",
                    rels.replace(
                        "</Relationships>",
                        '<Relationship Id="rIdStopsWeb" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/></Relationships>',
                    ),
                );
            }
            const types = parts.get("[Content_Types].xml")!;
            if (!types.includes("webSettings")) {
                parts.set(
                    "[Content_Types].xml",
                    types.replace(
                        "</Types>",
                        '<Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/></Types>',
                    ),
                );
            }
        },
    ],
});

/** A document of one setting in w:settings, after the zoom */
const withSetting = async (name: string, probeName: string, ...xml: readonly string[]): Promise<void> => {
    await write({
        name,
        sections: [{ properties: PAGE, children: [line(`${probeName} above`), ...fill(probeName, 60), line(`${probeName} below`)] }],
        injections: [settings(...xml)],
    });
};
await withSetting("word-stops-booklet", "BK1", "<w:bookFoldPrinting/>", '<w:bookFoldPrintingSheets w:val="4"/>');
await withSetting("word-stops-two-on-one", "TO1", "<w:printTwoOnOne/>");
