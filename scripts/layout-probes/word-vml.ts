// Probes of how Word lays out VML drawings (`w:pict`): docx's text boxes (`Textbox`), and the rectangles, pictures and
// wrapping that documents made by older versions of Word have, where docx/layout stops at "a VML drawing". Each probe
// starts a page, its first line names it ("VM1 above"), and the text in its box and the lines around it start with the
// probe's name too, so word-frames.py can find each probe's page in pdftotext's HTML of a PDF saved from Word, and the
// boxes in pdftocairo's SVG: docx's text boxes have Word's default black outline, and the rectangles and pictures here are
// grey. Calibri 11, single spaced, no space before or after, on A4 with 1440 margins: 9026 twips of text, lines of 268.55
// twips. The paragraphs a box floats in are justified, so each of their lines but the last ends where the room beside it
// does.
//
// docx's text boxes, which are in the line, as docx writes them without a position, each in a paragraph of its own:
// VM1:  docx's demo's first box: 200pt wide, its height "auto", centred, with a line in it: how tall the box is, and the line
// VM2:  the same with three paragraphs in it
// VM3:  200pt by 100pt, with a line in it: whether Word fits the box to its text (`mso-fit-shape-to-text`), as docx writes it
// VM4:  docx's demo's second box: 300pt wide, 400 tall, hidden (`visibility:hidden`): whether it takes room
// VM5:  100pt wide, its height "auto", in a line between "before" and "after": where it stands on the line, and how tall
//       the line is
// VM6:  docx's floating box: placed at 10pt and 20pt (`position:absolute`), 200pt by 100pt, at the start of a paragraph,
//       with no wrapping written: whether the text goes round it
// What documents made by older versions of Word have, written into the XML:
// VM7:  a grey rectangle (`v:rect`) 100pt by 50pt in a line
// VM8:  a picture (`v:imagedata`) 72pt by 36pt in a line
// VM9:  a grey rectangle 100pt by 72pt, at the left of the margins and the top of its paragraph, with square wrapping
//       (`w10:wrap`) and no distances from the text written: how far the text keeps from it
// VM10: the same with top and bottom wrapping, 36pt below the paragraph's top, its distances 0
// VM11: the same with square wrapping, at the right of the margins and their top, its distances 0
// VM14: the same as VM9 with tight wrapping
// VM15: square wrapping with the text on its right only (`side="right"`), centred across the margins, its distances 0
// In headers:
// VM12: a box in the header's line, with six lines in it: whether it makes the header taller, and pushes the body down
// VM13: a grey rectangle in the header, 216pt below the top of the page, with square wrapping: whether the body's text goes
//       round it
//
// What Word showed, in word-vml.pdf, saved from Word 16 for Mac on 2026-10-03 and read with word-frames.py:
//
// - VM1 to VM5: Word sizes docx's text boxes to their text, whatever height they give: a box of one line of Calibri 11
//   is 271132 EMUs tall (21.35 points), and of three lines 612108, the lines, the insets of 3.6 points above and below,
//   and 0.72 points more. Its line in the text is 0.72 points taller again for its outline, which a hidden box (VM4) has
//   none of, and takes as much more room across: 2015.6 twips between the text either side of a box 100 points wide. It
//   stands on the baseline, as a picture does. Its text starts 144.9 twips from where it is in the line, within a little
//   less than 0.72 points of the inset
// - VM6: a box placed on the page with no wrapping written takes no room
// - VM7: a rectangle in the line is its size, standing on the baseline: its line is 1000 and the text's descent
// - VM8: a picture (`v:imagedata`) 72 points by 36 is drawn 33 points square
// - VM9 to VM11, VM15: square and top and bottom wrapping are as DrawingML's, with VML's distances from the text, 9 points
//   left and right and none above and below, where the style gives none, the text on one side only where it says, and
//   "paragraph" placing against the paragraph
// - VM14: tight wrapping round a rectangle keeps the text 160 twips from it, where square wrapping keeps 180
// - VM12: a box in the header's line makes it taller by 7 twips less than one in the body's
// - VM13: a rectangle in the header with square wrapping makes the body's text go round it
//
// Word draws a VML shape scaled by 0.99866 and about 8 twips lower than it is, so lengths are read from a shape's path, in
// EMUs, and from the text around it, whose baselines are on Word's grid of 4.8 twips.
//
// Usage: npm run run-ts -- scripts/layout-probes/word-vml.ts, which writes build/word-probes/word-vml.docx
// cspell:ignore pdftocairo imagedata insetmode allowincell
import * as fs from "fs";
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import { AlignmentType, Document, Header, type ISectionOptions, Packer, Paragraph, TextRun, Textbox } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A run whose text marks where VML is written into the XML, by its name */
const marker = (name: string): TextRun => new TextRun(`@@${name}@@`);

/** A justified paragraph of prose, starting with its probe's name, after what is given */
const anchored = (probe: string, words: number, before: readonly (TextRun | Textbox)[]): Paragraph =>
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [...before, new TextRun(`${probe} ${prose(words)}`)] });

// Every section has a header, empty but for VM12's and VM13's, so theirs aren't carried on to the sections after them
const EMPTY = new Header({ children: [new Paragraph({})] });

/** A probe: its line at the top of its page, then what is given, with its header's paragraphs, if it has one */
const probe = (
    name: string,
    children: readonly (Paragraph | Textbox)[],
    header: readonly (Paragraph | Textbox)[] = [],
): ISectionOptions => ({
    headers: { default: header.length > 0 ? new Header({ children: [...header] }) : EMPTY },
    children: [line(`${name} above`), ...children],
});

/** A grey PNG of one pixel, drawn at any size */
const pixel = (): Buffer => {
    const crc = (bytes: Buffer): number => {
        let value = ~0;
        for (const byte of bytes) {
            value ^= byte;
            for (let bit = 0; bit < 8; bit++) {
                value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
            }
        }
        return ~value >>> 0;
    };
    const chunk = (type: string, data: Buffer): Buffer => {
        const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        const check = Buffer.alloc(4);
        check.writeUInt32BE(crc(body));
        return Buffer.concat([length, body, check]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(1, 0);
    header.writeUInt32BE(1, 4);
    header.set([8, 0, 0, 0, 0], 8);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", header),
        chunk("IDAT", deflateSync(Buffer.from([0, 0x80]))),
        chunk("IEND", Buffer.alloc(0)),
    ]);
};

// The picture of VM8, and its relationship from the document
const PICTURE = "rIdVmlPicture";

/** A grey rectangle with no outline, of a style */
const rectangle = (style: string, wrap = ""): string =>
    `<w:r><w:pict><v:rect style="${style}" fillcolor="#A0A0A0" stroked="f">${wrap}</v:rect></w:pict></w:r>`;

// What is written in place of each marker
const VML: Readonly<Record<string, string>> = {
    VM7: rectangle("width:100pt;height:50pt"),
    VM8:
        '<w:r><w:pict><v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" ' +
        'filled="f" stroked="f"><v:stroke joinstyle="miter"/><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>' +
        '<o:lock v:ext="edit" aspectratio="t"/></v:shapetype><v:shape id="VM8picture" type="#_x0000_t75" style="width:72pt;height:36pt">' +
        `<v:imagedata r:id="${PICTURE}" o:title=""/></v:shape></w:pict></w:r>`,
    VM9: rectangle(
        "position:absolute;margin-left:0;margin-top:0;width:100pt;height:72pt;mso-position-horizontal-relative:margin;" +
            "mso-position-vertical-relative:paragraph",
        '<w10:wrap type="square"/>',
    ),
    VM10: rectangle(
        "position:absolute;margin-left:0;margin-top:36pt;width:100pt;height:72pt;mso-wrap-distance-left:0;mso-wrap-distance-top:0;" +
            "mso-wrap-distance-right:0;mso-wrap-distance-bottom:0;mso-position-horizontal-relative:margin;mso-position-vertical-relative:paragraph",
        '<w10:wrap type="topAndBottom"/>',
    ),
    VM11: rectangle(
        "position:absolute;margin-left:0;margin-top:0;width:100pt;height:72pt;mso-wrap-distance-left:0;mso-wrap-distance-top:0;" +
            "mso-wrap-distance-right:0;mso-wrap-distance-bottom:0;mso-position-horizontal:right;mso-position-horizontal-relative:margin;" +
            "mso-position-vertical:top;mso-position-vertical-relative:margin",
        '<w10:wrap type="square"/>',
    ),
    VM14: rectangle(
        "position:absolute;margin-left:0;margin-top:0;width:100pt;height:72pt;mso-position-horizontal-relative:margin;" +
            "mso-position-vertical-relative:paragraph",
        '<w10:wrap type="tight"/>',
    ),
    VM15: rectangle(
        "position:absolute;margin-left:0;margin-top:0;width:100pt;height:72pt;mso-wrap-distance-left:0;mso-wrap-distance-top:0;" +
            "mso-wrap-distance-right:0;mso-wrap-distance-bottom:0;mso-position-horizontal:center;mso-position-horizontal-relative:margin;" +
            "mso-position-vertical-relative:paragraph",
        '<w10:wrap type="square" side="right"/>',
    ),
    VM13: rectangle(
        "position:absolute;margin-left:0;margin-top:216pt;width:100pt;height:72pt;mso-position-horizontal-relative:margin;" +
            "mso-position-vertical-relative:page",
        '<w10:wrap type="square"/>',
    ),
};

/** docx's text box, with lines of text, of a style */
const box = (name: string, lines: number, style: ConstructorParameters<typeof Textbox>[0]["style"], options: Options = {}): Textbox =>
    new Textbox({
        ...options,
        style,
        children: Array.from(
            { length: lines },
            (_, i) => new Paragraph({ children: [new TextRun(`${name} box${lines > 1 ? ` ${i + 1}` : ""}`)] }),
        ),
    } as ConstructorParameters<typeof Textbox>[0]);

const sections: ISectionOptions[] = [
    probe("VM1", [box("VM1", 1, { width: "200pt", height: "auto" }, { alignment: AlignmentType.CENTER }), ...fill("VM1", 3)]),
    probe("VM2", [box("VM2", 3, { width: "200pt", height: "auto" }, { alignment: AlignmentType.CENTER }), ...fill("VM2", 3)]),
    probe("VM3", [box("VM3", 1, { width: "200pt", height: "100pt" }, { alignment: AlignmentType.CENTER }), ...fill("VM3", 3)]),
    probe("VM4", [
        box("VM4", 1, { width: "300pt", height: 400, visibility: "hidden", zIndex: "auto" }, { alignment: AlignmentType.CENTER }),
        ...fill("VM4", 3),
    ]),
    probe("VM5", [
        new Paragraph({
            children: [new TextRun("VM5 before "), box("VM5", 1, { width: "100pt", height: "auto" }), new TextRun(" VM5 after")],
        }),
        ...fill("VM5", 3),
    ]),
    probe("VM6", [
        anchored("VM6", 260, [box("VM6", 1, { width: "200pt", height: "100pt", position: "absolute", left: "10pt", top: "20pt" })]),
    ]),
    probe("VM7", [new Paragraph({ children: [new TextRun("VM7 before "), marker("VM7"), new TextRun(" VM7 after")] }), ...fill("VM7", 3)]),
    probe("VM8", [new Paragraph({ children: [new TextRun("VM8 before "), marker("VM8"), new TextRun(" VM8 after")] }), ...fill("VM8", 3)]),
    probe("VM9", [anchored("VM9", 260, [marker("VM9")])]),
    probe("VM10", [anchored("VM10", 260, [marker("VM10")])]),
    probe("VM11", [anchored("VM11", 260, [marker("VM11")])]),
    probe("VM14", [anchored("VM14", 260, [marker("VM14")])]),
    probe("VM15", [anchored("VM15", 260, [marker("VM15")])]),
    probe("VM12", [anchored("VM12", 260, [])], [box("VM12 header", 6, { width: "200pt", height: "auto" })]),
    probe("VM13", [anchored("VM13", 260, [])], [new Paragraph({ children: [new TextRun("VM13 header "), marker("VM13")] })]),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

/** Writes the VML for each marker in a part, and returns the names it wrote */
const inject = (xml: string): { readonly xml: string; readonly names: readonly string[] } => {
    const names: string[] = [];
    const written = xml.replace(/<w:r><w:t xml:space="preserve">@@(\w+)@@<\/w:t><\/w:r>/g, (_, name: string) => {
        names.push(name);
        return VML[name];
    });
    return { xml: written, names };
};

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const parts = Object.keys(zip.files).filter((name) => /^word\/(document|header\d+)\.xml$/.test(name));
    const names: string[] = [];
    for (const part of parts) {
        const written = inject(await zip.file(part)!.async("string"));
        names.push(...written.names);
        zip.file(part, written.xml);
    }
    const missing = Object.keys(VML).filter((name) => !names.includes(name));
    if (missing.length > 0) {
        throw new Error(`No marker for ${missing.join(", ")}`);
    }
    // VM8's picture, and its relationship from the document
    zip.file("word/media/vml-picture.png", pixel());
    const relationships = await zip.file("word/_rels/document.xml.rels")!.async("string");
    zip.file(
        "word/_rels/document.xml.rels",
        relationships.replace(
            "</Relationships>",
            `<Relationship Id="${PICTURE}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/vml-picture.png"/></Relationships>`,
        ),
    );
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-vml.docx", await zip.generateAsync({ type: "nodebuffer" }));
};

main();
