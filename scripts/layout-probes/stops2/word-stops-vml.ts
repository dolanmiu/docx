/**
 * Probes of VML drawings (`w:pict`) and embedded objects (`w:object`), where docx/layout stops after #3674 followed
 * `word-vml.docx` VM1 to VM15. VML is what documents older versions of Word made, and Word still writes for text boxes in
 * compatibility mode, and for embedded objects. Each shape is written as Word writes it, with `v:shapetype` and a
 * `v:shape` styled by CSS, injected into the XML where a marker is.
 *
 * - "a VML picture" (VM8: a picture of 72 by 36 points drawn 33 points square, not explained), "an embedded object"
 * - "a VML drawing in the line of a header, footer or text box" (VM12, one case), "a VML shape with an outline in the
 *   line", "a VML drawing with an outline that text flows around", "a text box that text flows around"
 * - "a text box not sized to its text", "a text box with insets of its own", "a text box with an outline of its own",
 *   "a footnote or endnote in a text box", "a list in a text box"
 * - "a VML drawing that text flows around in a way not yet followed" (VM14: tight wrapping kept the text 160 from it,
 *   square 180), "a turned VML drawing that text flows around", "a VML drawing sized by a share of what it is placed
 *   against", "a VML drawing placed by its left or top", "a VML drawing placed against what isn't followed yet",
 *   "a VML drawing lined up in a way not yet followed", "a VML drawing with no size", "...with a length in units not yet
 *   followed", "...with no shape", "...of more than one shape"
 *
 * Calibri 11 on A4 with inch margins; each probe starts a page, the shape in justified prose.
 *
 * Word 16 for Mac wouldn't open the first version of this, one document of all the probes ("Word experienced an error
 * trying to open the file"), though every part of it is valid against the schemas. Its embedded objects named an image as
 * their object and a shape that wasn't there; a text box held another text box and a footnote; and its shapes shared ids.
 * So the probes are now in documents of their own, those Word may refuse each alone, every shape has an id of its own,
 * each shape type is written once in a part, and an embedded object is a Word document, embedded as Word embeds one:
 *
 * - word-stops-vml-pictures: VM20a to VM20d, VM20f
 * - word-stops-vml-objects: VM20e, VM21a, VM21b
 * - word-stops-vml-shapes: VM23a to VM23c, VM24a, VM24b, VM27a to VM27f, VM28a to VM28d, VM29a to VM29d, VM29f
 * - word-stops-vml-text-boxes: VM24c, VM25a to VM25e, VM26b
 * - word-stops-vml-header: VM22a to VM22c
 * - word-stops-vml-nested: VM22d, a text box in a text box
 * - word-stops-vml-note: VM26a, a footnote in a text box
 * - word-stops-vml-shape-type: VM29e, a w:pict with only a shape type
 * - word-stops-vml-pictures2: VM30a to VM30h, the pictures as Word writes them (round 26)
 * - word-stops-vml-pictures3: VM31a to VM31h, for the next batch: the pictures round 26 left open
 *
 * VM20a to VM20f: a VML picture (v:imagedata) in the line of 72 by 36 points (a, VM8 again), 36 by 72 (b), 100 by 100
 *   (c), 20 by 20 (d), 72 by 36 with o:ole (e), and with cropping (f)
 * VM21a, VM21b: an embedded object (w:object, an embedded Word document) of 72 by 36 points (a), and of 150 by 100 (b)
 * VM22a to VM22d: a text box in the line of the header (a, VM12 again), with three lines (b), a rectangle with no
 *   outline in the line of the header (c), all three in the header of the probe's page, VM22; and a text box in the line
 *   of a text box (d)
 * VM23a to VM23c: a rectangle with an outline of 1 point in the line (a), 3 points (b), and none (c)
 * VM24a to VM24c: a rectangle with an outline of 1 point, square wrapping (a); 3 points (b); a text box with square
 *   wrapping (c)
 * VM25a to VM25e: a text box in the line of 200 points by 100 (a, not sized to its text), with insets of 0 (b) and of
 *   10 points (c), an outline of 3 points (d), and of none (e)
 * VM26a, VM26b: a text box with a footnote reference in it (a) and a numbered list of two items (b)
 * VM27a to VM27f: a rectangle of 100 points placed on the page with wrapping tight (a), through (b), tight with a polygon
 *   of its own (c), turned 30 degrees with square wrapping (d), 30% as wide as the margin (mso-width-percent, e), and
 *   placed by left and top rather than margin-left and margin-top (f)
 * VM28a to VM28d: placed against the inside margin (a), the outside margin (b); lined up inside (c) and outside (d)
 * VM29a to VM29d: lengths in pixels (a), ems (b), with no unit (c), and a shape with no size (d)
 * VM29e, VM29f: a w:pict with only a v:shapetype (e), and a v:group of two rectangles (f)
 * VM30a to VM30h: Word's PDF of word-stops-vml-pictures drew VM20's pictures, a PNG of one pixel in a shape of 72 by 36
 *   points, 36 by 72 and 100 by 100, 33 points square, and one of 20 by 20 at 20, by no rule found. These are the
 *   pictures as Word writes them, with Word's shape type for pictures, whose formulas crop the picture by its pixels, and
 *   o:spid: the pixel in 72 by 36 (a); a PNG of 100 by 50 pixels in 72 by 36 (b), 36 by 72 (c), 20 by 20 (d), 100 by 100
 *   (e) and 150 by 75 (h), as Word writes it (g, with visibility:visible and mso-wrap-style:square); and the PNG of 100
 *   by 50 in 72 by 36 with the shape type without formulas of the first batch (f)
 * VM31a to VM31h: Word's PDF of word-stops-vml-pictures2 drew the pictures of 100 by 50 pixels at their shapes' sizes, and
 *   the pixel 33 points square again, so a picture is drawn at its shape's size, 33 points a pixel at most, taken for a
 *   picture of one pixel. These are what that leaves open: a picture of 100 by 50 placed on the page with square wrapping
 *   (a); one of 2 by 2 pixels in 100 by 100 (b, past 33 points a pixel) and in 60 by 60 (c); the pixel in 72 by 36 with a
 *   resolution of 300 dots to the inch (d) and of 96 (e); one of 100 by 50 with an outline of 3 points (f); one with no
 *   size of its own (g); and one of 4 by 4 pixels in 100 by 100 (h, 25 points a pixel)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-vml.ts [folder]
 */
import { deflateSync } from "node:zlib";

import JSZip from "jszip";

import { AlignmentType, Document, Header, LevelFormat, Packer, Paragraph, TextRun } from "docx";

import { type Child, type Injection, PAGE, PNG, marker, probe, prose, write } from "./kit";

const JUSTIFIED = { alignment: AlignmentType.JUSTIFIED };
const SHAPETYPE_RECT =
    '<v:shapetype id="_x0000_t1" coordsize="21600,21600" o:spt="1" path="m,l,21600r21600,l21600,xe"><v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype>';
const SHAPETYPE_BOX =
    '<v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe"><v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype>';
const SHAPETYPE_PICTURE =
    '<v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f"><v:stroke joinstyle="miter"/><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/></v:shapetype>';

/** The id of each shape, of its own in the document, as Word gives each one */
let shapes = 1025;
const shapeId = (): string => `_x0000_s${shapes++}`;

/** A text box as docx's Textbox writes one: sized to its text with `height:auto` and `mso-fit-shape-to-text`, unless `fit` is off */
const box = (style: string, text: string, attributes = "", inset = "", fit = true): string =>
    `<w:r><w:pict>${SHAPETYPE_BOX}<v:shape id="${shapeId()}" type="#_x0000_t202" style="${style}" ${attributes}><v:textbox${inset}${fit ? ' style="mso-fit-shape-to-text:t;"' : ""}><w:txbxContent><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape></w:pict></w:r>`;
/** A rectangle, with no outline unless the attributes give one */
const rect = (style: string, attributes = 'stroked="f"', inner = ""): string =>
    `<w:r><w:pict>${SHAPETYPE_RECT}<v:shape id="${shapeId()}" type="#_x0000_t1" style="${style}" ${attributes}>${inner}</v:shape></w:pict></w:r>`;
const picture = (style: string, attributes = "", inner = '<v:imagedata r:id="rIdStopsImage" o:title=""/>'): string =>
    `<w:r><w:pict>${SHAPETYPE_PICTURE}<v:shape id="${shapeId()}" type="#_x0000_t75" style="${style}" ${attributes}>${inner}</v:shape></w:pict></w:r>`;

/**
 * An embedded object as Word writes an embedded Word document: its picture as a VML shape, and the object, which names
 * the shape and the document (`rIdStopsObject<n>`, a package relationship)
 */
const object = (number: number, width: number, height: number): string => {
    const id = `_x0000_i${1024 + number}`;
    return `<w:r><w:object w:dxaOrig="${width * 20}" w:dyaOrig="${height * 20}">${SHAPETYPE_PICTURE}<v:shape id="${id}" type="#_x0000_t75" style="width:${width}pt;height:${height}pt" o:ole=""><v:imagedata r:id="rIdStopsImage" o:title=""/></v:shape><o:OLEObject Type="Embed" ProgID="Word.Document.12" ShapeID="${id}" DrawAspect="Content" ObjectID="_179100000${number}" r:id="rIdStopsObject${number}"><o:FieldCodes>\\s</o:FieldCodes></o:OLEObject></w:object></w:r>`;
};

const PLACED = (extra: string): string =>
    `position:absolute;margin-left:144pt;margin-top:18pt;width:100pt;height:100pt;z-index:1;mso-position-horizontal-relative:margin;mso-position-vertical-relative:paragraph;${extra}`;
const wrap = (type: string): string => `<w10:wrap type="${type}"/>`;

/** Each case: its name, and the run XML that goes where its marker is, in the probe's paragraph */
type Case = readonly [string, () => string];
const PICTURES: readonly Case[] = [
    ["VM20a", () => picture("width:72pt;height:36pt")],
    ["VM20b", () => picture("width:36pt;height:72pt")],
    ["VM20c", () => picture("width:100pt;height:100pt")],
    ["VM20d", () => picture("width:20pt;height:20pt")],
    [
        "VM20f",
        () => picture("width:72pt;height:36pt", "", '<v:imagedata r:id="rIdStopsImage" o:title="" croptop="10000f" cropleft="10000f"/>'),
    ],
];
const OBJECTS: readonly Case[] = [
    ["VM20e", () => picture("width:72pt;height:36pt", 'o:ole=""')],
    ["VM21a", () => object(1, 72, 36)],
    ["VM21b", () => object(2, 150, 100)],
];
const SHAPES: readonly Case[] = [
    ["VM23a", () => rect("width:100pt;height:20pt", 'strokeweight="1pt"')],
    ["VM23b", () => rect("width:100pt;height:20pt", 'strokeweight="3pt"')],
    ["VM23c", () => rect("width:100pt;height:20pt")],
    ["VM24a", () => rect(PLACED(""), 'strokeweight="1pt"', wrap("square"))],
    ["VM24b", () => rect(PLACED(""), 'strokeweight="3pt"', wrap("square"))],
    ["VM27a", () => rect(PLACED(""), 'stroked="f"', wrap("tight"))],
    ["VM27b", () => rect(PLACED(""), 'stroked="f"', wrap("through"))],
    ["VM27c", () => rect(PLACED(""), 'stroked="f" wrapcoords="0 0 21600 0 21600 21600 10800 21600 0 0"', wrap("tight"))],
    ["VM27d", () => rect(PLACED("rotation:30"), 'stroked="f"', wrap("square"))],
    ["VM27e", () => rect(PLACED("mso-width-percent:300;mso-width-relative:margin"), 'stroked="f"', wrap("square"))],
    [
        "VM27f",
        () =>
            rect(
                "position:absolute;left:144pt;top:18pt;width:100pt;height:100pt;z-index:1;mso-position-horizontal-relative:margin;mso-position-vertical-relative:paragraph",
                'stroked="f"',
                wrap("square"),
            ),
    ],
    ["VM28a", () => rect(PLACED("mso-position-horizontal-relative:inner-margin-area"), 'stroked="f"', wrap("square"))],
    ["VM28b", () => rect(PLACED("mso-position-horizontal-relative:outer-margin-area"), 'stroked="f"', wrap("square"))],
    ["VM28c", () => rect(PLACED("mso-position-horizontal:inside"), 'stroked="f"', wrap("square"))],
    ["VM28d", () => rect(PLACED("mso-position-horizontal:outside"), 'stroked="f"', wrap("square"))],
    ["VM29a", () => rect("width:133px;height:27px")],
    ["VM29b", () => rect("width:10em;height:2em")],
    ["VM29c", () => rect("width:100;height:20")],
    ["VM29d", () => rect("")],
    [
        "VM29f",
        () =>
            `<w:r><w:pict><v:group id="${shapeId()}" style="width:200pt;height:50pt" coordsize="200,50">${SHAPETYPE_RECT}<v:shape id="${shapeId()}" type="#_x0000_t1" style="position:absolute;left:0;top:0;width:90;height:50" stroked="f"/><v:shape id="${shapeId()}" type="#_x0000_t1" style="position:absolute;left:110;top:0;width:90;height:50" stroked="f"/></v:group></w:pict></w:r>`,
    ],
];
const TEXT_BOXES: readonly Case[] = [
    ["VM24c", () => box(PLACED(""), "VM24c box").replace("</v:shape>", `${wrap("square")}</v:shape>`)],
    ["VM25a", () => box("width:200pt;height:100pt", "VM25a box", "", "", false)],
    ["VM25b", () => box("width:200pt;height:auto", "VM25b box", "", ' inset="0,0,0,0"')],
    ["VM25c", () => box("width:200pt;height:auto", "VM25c box", "", ' inset="10pt,10pt,10pt,10pt"')],
    ["VM25d", () => box("width:200pt;height:auto", "VM25d box", 'strokeweight="3pt"')],
    ["VM25e", () => box("width:200pt;height:auto", "VM25e box", 'stroked="f"')],
];

const NAMESPACES =
    'xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w10="urn:schemas-microsoft-com:office:word"';

/** Each shape type written once in a part, the first time it is used, as Word writes them */
const onceEach = (text: string): string => {
    const seen = new Set<string>();
    return text.replace(/<v:shapetype id="([^"]+)".*?<\/v:shapetype>/g, (whole, id: string) => {
        if (seen.has(id)) {
            return "";
        }
        seen.add(id);
        return whole;
    });
};

/** Replaces the markers of a part with their XML, and declares VML's namespaces on its root when docx hasn't */
const injectShapes =
    (path: (parts: Map<string, string>) => string, cases: readonly (readonly [string, string])[], root = "w:document"): Injection =>
    (parts) => {
        const part = path(parts);
        let text = parts.get(part)!;
        for (const [name, xml] of cases) {
            const run = `<w:r><w:t xml:space="preserve">@@${name}@@</w:t></w:r>`;
            if (!text.includes(run)) {
                throw new Error(`No marker ${name} in ${part}`);
            }
            text = text.replace(run, xml);
        }
        const missing = NAMESPACES.split(" ").filter((ns) => !text.includes(ns.split("=")[0]));
        if (missing.length > 0) {
            text = text.replace(`<${root} `, `<${root} ${missing.join(" ")} `);
        }
        parts.set(part, onceEach(text));
    };

/** Adds a relationship to the document's part */
const relationship =
    (id: string, type: string, target: string): Injection =>
    (parts) => {
        const rels = parts.get("word/_rels/document.xml.rels")!;
        parts.set(
            "word/_rels/document.xml.rels",
            rels.replace("</Relationships>", `<Relationship Id="${id}" Type="${type}" Target="${target}"/></Relationships>`),
        );
    };
const IMAGE = relationship("rIdStopsImage", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "media/stops.png");
/** A content type for files of an extension, when the package has none */
const contentType =
    (extension: string, type: string): Injection =>
    (parts) => {
        const types = parts.get("[Content_Types].xml")!;
        if (!types.includes(`Extension="${extension}"`)) {
            parts.set(
                "[Content_Types].xml",
                types.replace("</Types>", `<Default Extension="${extension}" ContentType="${type}"/></Types>`),
            );
        }
    };

/** Each case as a probe of its own: its marker in justified prose */
const inProse = (cases: readonly Case[]): Child[] =>
    cases.flatMap(([name]) =>
        probe(name, [
            new Paragraph({ ...JUSTIFIED, children: [new TextRun(`${name} before `), marker(name), new TextRun(` ${prose(160)}`)] }),
        ]),
    );

/** A document of probes in prose, each case's XML made as the document is */
const proseDocument = async (
    name: string,
    cases: readonly Case[],
    more: { readonly files?: Record<string, Uint8Array>; readonly injections?: readonly Injection[] } = {},
): Promise<void> => {
    const xml = cases.map(([one, make]) => [one, make()] as const);
    await write({
        name,
        files: { "word/media/stops.png": PNG, ...more.files },
        children: inProse(cases),
        injections: [injectShapes(() => "word/document.xml", xml), IMAGE, contentType("png", "image/png"), ...(more.injections ?? [])],
    });
};

await proseDocument("word-stops-vml-pictures", PICTURES);

// Word's shape type for pictures, with its formulas, which crop the picture by its pixels (pixelWidth, pixelHeight)
const WORD_SHAPETYPE_PICTURE =
    '<v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f"><v:stroke joinstyle="miter"/><v:formulas><v:f eqn="if lineDrawn pixelLineWidth 0"/><v:f eqn="sum @0 1 0"/><v:f eqn="sum 0 0 @1"/><v:f eqn="prod @2 1 2"/><v:f eqn="prod @3 21600 pixelWidth"/><v:f eqn="prod @3 21600 pixelHeight"/><v:f eqn="sum @0 0 1"/><v:f eqn="prod @6 1 2"/><v:f eqn="prod @7 21600 pixelWidth"/><v:f eqn="sum @8 21600 0"/><v:f eqn="prod @7 21600 pixelHeight"/><v:f eqn="sum @10 21600 0"/></v:formulas><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/></v:shapetype>';
// The first batch's shape type without formulas, as another type, so that a document can have both
const BARE_SHAPETYPE_PICTURE = SHAPETYPE_PICTURE.replace('id="_x0000_t75"', 'id="_x0000_t750"');
let spids = 1025;
/** A picture as Word writes one: its shape with o:spid, of Word's shape type unless another is given */
const wordPicture = (style: string, image: string, type = WORD_SHAPETYPE_PICTURE): string =>
    `<w:r><w:pict>${type}<v:shape id="${shapeId()}" o:spid="_x0000_i${spids++}" type="#${/id="([^"]+)"/.exec(type)![1]}" style="${style}"><v:imagedata r:id="${image}" o:title=""/></v:shape></w:pict></w:r>`;
const PICTURES2: readonly Case[] = [
    ["VM30a", () => wordPicture("width:72pt;height:36pt", "rIdStopsImage")],
    ["VM30b", () => wordPicture("width:72pt;height:36pt", "rIdStopsWide")],
    ["VM30c", () => wordPicture("width:36pt;height:72pt", "rIdStopsWide")],
    ["VM30d", () => wordPicture("width:20pt;height:20pt", "rIdStopsWide")],
    ["VM30e", () => wordPicture("width:100pt;height:100pt", "rIdStopsWide")],
    ["VM30f", () => wordPicture("width:72pt;height:36pt", "rIdStopsWide", BARE_SHAPETYPE_PICTURE)],
    ["VM30g", () => wordPicture("width:72pt;height:36pt;visibility:visible;mso-wrap-style:square", "rIdStopsWide")],
    ["VM30h", () => wordPicture("width:150pt;height:75pt", "rIdStopsWide")],
];

/** A grey PNG of a size, 8 bits a channel, for a picture of more than one pixel, with a resolution in dots to the inch if given */
const greyPng = (width: number, height: number, density?: number): Buffer => {
    const table = Array.from(
        { length: 256 },
        (_, n) => Array.from({ length: 8 }).reduce<number>((c) => (c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1), n) >>> 0,
    );
    const crc = (data: Buffer): number => (data.reduce((c, byte) => table[(c ^ byte) & 0xff] ^ (c >>> 8), 0xffffffff) ^ 0xffffffff) >>> 0;
    const chunk = (type: string, data: Buffer): Buffer => {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
        const sum = Buffer.alloc(4);
        sum.writeUInt32BE(crc(typed));
        return Buffer.concat([length, typed, sum]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 2;
    // Each row filtered with 0, then grey
    const rows = Buffer.concat(Array.from({ length: height }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x80)])));
    // The resolution in pixels to the metre, in a pHYs chunk
    const physical = Buffer.alloc(9);
    physical.writeUInt32BE(Math.round((density ?? 0) / 0.0254), 0);
    physical.writeUInt32BE(Math.round((density ?? 0) / 0.0254), 4);
    physical[8] = 1;
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", header),
        ...(density === undefined ? [] : [chunk("pHYs", physical)]),
        chunk("IDAT", deflateSync(rows)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
};
await proseDocument("word-stops-vml-pictures2", PICTURES2, {
    files: { "word/media/stops-wide.png": greyPng(100, 50) },
    injections: [
        relationship("rIdStopsWide", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "media/stops-wide.png"),
    ],
});

/** A picture as Word writes one, with attributes of the shape's own and children after its image */
const wordPictureWith = (style: string, image: string, attributes: string, children = ""): string =>
    wordPicture(style, image)
        .replace(` style="${style}"`, ` style="${style}" ${attributes}`)
        .replace("</v:shape>", `${children}</v:shape>`);
const PICTURES3: readonly Case[] = [
    ["VM31a", () => wordPictureWith(PLACED(""), "rIdStopsWide", "", wrap("square"))],
    ["VM31b", () => wordPicture("width:100pt;height:100pt", "rIdStopsTiny")],
    ["VM31c", () => wordPicture("width:60pt;height:60pt", "rIdStopsTiny")],
    ["VM31d", () => wordPicture("width:72pt;height:36pt", "rIdStopsDense")],
    ["VM31e", () => wordPicture("width:72pt;height:36pt", "rIdStopsScreen")],
    ["VM31f", () => wordPictureWith("width:72pt;height:36pt", "rIdStopsWide", 'stroked="t" strokeweight="3pt"')],
    ["VM31g", () => wordPicture("", "rIdStopsWide")],
    ["VM31h", () => wordPicture("width:100pt;height:100pt", "rIdStopsFour")],
];
const IMAGE_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
await proseDocument("word-stops-vml-pictures3", PICTURES3, {
    files: {
        "word/media/stops-wide.png": greyPng(100, 50),
        "word/media/stops-tiny.png": greyPng(2, 2),
        "word/media/stops-dense.png": greyPng(1, 1, 300),
        "word/media/stops-screen.png": greyPng(1, 1, 96),
        "word/media/stops-four.png": greyPng(4, 4),
    },
    injections: [
        relationship("rIdStopsWide", IMAGE_TYPE, "media/stops-wide.png"),
        relationship("rIdStopsTiny", IMAGE_TYPE, "media/stops-tiny.png"),
        relationship("rIdStopsDense", IMAGE_TYPE, "media/stops-dense.png"),
        relationship("rIdStopsScreen", IMAGE_TYPE, "media/stops-screen.png"),
        relationship("rIdStopsFour", IMAGE_TYPE, "media/stops-four.png"),
    ],
});

// The embedded objects' document: a Word document, embedded twice
const embedded = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("VM21 embedded document")] }] }));
await proseDocument("word-stops-vml-objects", OBJECTS, {
    files: { "word/embeddings/Microsoft_Word_Document1.docx": embedded, "word/embeddings/Microsoft_Word_Document2.docx": embedded },
    injections: [
        relationship(
            "rIdStopsObject1",
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
            "embeddings/Microsoft_Word_Document1.docx",
        ),
        relationship(
            "rIdStopsObject2",
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
            "embeddings/Microsoft_Word_Document2.docx",
        ),
        contentType("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ],
});

await proseDocument("word-stops-vml-shapes", SHAPES);

// The text boxes' document, with VM26b's list, which the text box's paragraphs are numbered in too
const listItems: Injection = (parts) => {
    const text = parts.get("word/document.xml")!;
    const listId = /<w:numId w:val="(\d+)"\/>/.exec(text)![1];
    const numbered = `<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${listId}"/></w:numPr></w:pPr>`;
    const at = text.indexOf("VM26b box");
    const start = at === -1 ? -1 : text.lastIndexOf("<w:txbxContent>", at);
    const end = at === -1 ? -1 : text.indexOf("</w:txbxContent>", at);
    if (start === -1 || end === -1) {
        throw new Error("No text box VM26b in word/document.xml");
    }
    const content = `<w:txbxContent><w:p>${numbered}<w:r><w:t>VM26b box</w:t></w:r></w:p><w:p>${numbered}<w:r><w:t>VM26b item 2</w:t></w:r></w:p>`;
    parts.set("word/document.xml", text.slice(0, start) + content + text.slice(end));
};
const vm26b = box("width:200pt;height:auto", "VM26b box");
await write({
    name: "word-stops-vml-text-boxes",
    children: [
        ...inProse(TEXT_BOXES),
        ...probe("VM26b", [
            new Paragraph({ children: [new TextRun("VM26b "), marker("VM26b")] }),
            new Paragraph({
                numbering: { reference: "numbers", level: 0 },
                children: [new TextRun("VM26b a numbered paragraph of the text")],
            }),
        ]),
    ],
    options: {
        numbering: {
            config: [
                {
                    reference: "numbers",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            style: { paragraph: { indent: { left: 360, hanging: 360 } } },
                        },
                    ],
                },
            ],
        },
    },
    injections: [
        injectShapes(() => "word/document.xml", [...TEXT_BOXES.map(([one, make]) => [one, make()] as const), ["VM26b", vm26b]]),
        listItems,
    ],
});

// The header's text boxes and rectangle, in the header of the probe's page
const headerShapes: readonly (readonly [string, string])[] = [
    ["VM22a", box("width:200pt;height:auto", "VM22a box")],
    [
        "VM22b",
        box("width:200pt;height:auto", "VM22b box").replace(
            "</w:p></w:txbxContent>",
            "</w:p><w:p><w:r><w:t>VM22b line 2</w:t></w:r></w:p><w:p><w:r><w:t>VM22b line 3</w:t></w:r></w:p></w:txbxContent>",
        ),
    ],
    ["VM22c", rect("width:100pt;height:30pt")],
];
await write({
    name: "word-stops-vml-header",
    sections: [
        {
            properties: PAGE,
            headers: {
                default: new Header({
                    children: ["VM22a", "VM22b", "VM22c"].map(
                        (name) => new Paragraph({ children: [new TextRun(`${name} header `), marker(name), new TextRun(" after")] }),
                    ),
                }),
            },
            children: [...probe("VM22", [new Paragraph(`VM22 ${prose(60)}`)])],
        },
    ],
    injections: [
        injectShapes(
            (parts) => [...parts.keys()].find((path) => /word\/header\d*\.xml$/.test(path) && parts.get(path)!.includes("@@VM22a@@"))!,
            headerShapes,
            "w:hdr",
        ),
    ],
});

// A text box in a text box
const outer = box("width:300pt;height:auto", "VM22d outer");
await write({
    name: "word-stops-vml-nested",
    children: probe("VM22d", [new Paragraph({ children: [new TextRun("VM22d "), marker("VM22d")] })]),
    injections: [
        injectShapes(
            () => "word/document.xml",
            [
                [
                    "VM22d",
                    outer.replace(
                        "<w:r><w:t>VM22d outer</w:t></w:r>",
                        `<w:r><w:t xml:space="preserve">VM22d outer </w:t></w:r>${box("width:100pt;height:auto", "VM22d inner")}`,
                    ),
                ],
            ],
        ),
    ],
});

// A footnote in a text box
await write({
    name: "word-stops-vml-note",
    children: probe("VM26a", [new Paragraph({ children: [new TextRun("VM26a "), marker("VM26a")] })]),
    options: { footnotes: { 1: { children: [new Paragraph("VM26a note")] } } },
    injections: [
        injectShapes(
            () => "word/document.xml",
            [
                [
                    "VM26a",
                    box("width:200pt;height:auto", "VM26a box").replace(
                        "</w:t></w:r></w:p></w:txbxContent>",
                        '</w:t></w:r><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="1"/></w:r></w:p></w:txbxContent>',
                    ),
                ],
            ],
        ),
    ],
});

// A w:pict with only a shape type in it
await write({
    name: "word-stops-vml-shape-type",
    children: inProse([["VM29e", () => ""]]),
    injections: [injectShapes(() => "word/document.xml", [["VM29e", `<w:r><w:pict>${SHAPETYPE_RECT}</w:pict></w:r>`]])],
});
