/**
 * Probes of the list numbers where docx/layout still stopped after `word-stops-lists.docx`, `-list-definitions.docx` and
 * `-picture-bullets.docx` (round 25), saved from Word in round 26 (`word-stops-lists2.pdf`): see README.md for what they
 * showed.
 *
 * LI13a to LI13d: a number in a border, which LI4a showed Word putting the text right after the number's box when the box
 * ends past the hanging indent's stop: a border of half a point next to the number, whose box ends before the stop (a), of
 * half a point 4 points away, whose box ends 13 twips before it (b), LI4a's border with a hanging indent of 1080, whose
 * stop is past the box (c), and LI4a's border with a space after the number (d) ("a list number with a border")
 * LI14: a level left out, whose text writes the number of a level its list doesn't have, between paragraphs of the level
 *   below it: whether the second of those is 2, or 1 again ("a list number after a paragraph at a level Word leaves out
 *   above it")
 * LI15: a list whose level 0 is aligned both, which Word leaves out (LI11), with paragraphs of its level 1: whether they are
 *   numbered ("a list number at another level of a list with a level aligned both")
 * LI16: a line of only a number in Courier New 14 over a mark of Calibri 11, before the paragraph's text, which a word
 *   too long for the rest of the line puts on the next ("a line of only a list number of another size or font than its
 *   paragraph's mark, before the paragraph's text")
 * LI17: automatic spacing between paragraphs of two lists made from the same definition (`instance`), and of one ("automatic
 *   spacing between paragraphs of lists made from the same definition")
 * LI18a to LI18d: numbers aligned distribute (a), numTab (b), lowKashida (c) and thaiDistribute (d), which the schema has
 *   for paragraphs ("a list number aligned in a way not yet followed")
 * LI19a, LI19b: a level numbered as Word 6 did (w:legacy, legacySpace 120, legacyIndent 360) whose number is wider than its
 *   indent (a), and whose legacyIndent of 720 isn't its hanging indent of 360 (b) ("a list numbered as Word 6 numbered
 *   lists")
 * LI20a, LI20b: picture bullets, which Word didn't draw in LI8: with the shape type Word writes before the shape (a), and of
 *   20 points (b) ("a list whose bullets are pictures")
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-lists2.ts [folder]
 */
import { BorderStyle, LevelFormat, LevelSuffix, Paragraph, TextRun } from "docx";

import { PAGE, PNG, line, probe, prose, write } from "./kit";

const numbered = (reference: string, level: number, text: string, options: object = {}): Paragraph =>
    new Paragraph({ ...options, numbering: { reference, level }, children: text ? [new TextRun(text)] : [] });
const indent = (left: number, hanging = 360) => ({ paragraph: { indent: { left, hanging } } });
const decimal = (reference: string, more: object = {}, style: object = indent(720)) => ({
    reference,
    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style, ...more }],
});
const border = (size: number, space: number) => ({ border: { style: BorderStyle.SINGLE, size, color: "000000", space } });

const LISTS = [
    decimal("li13a", {}, { ...indent(720), run: border(4, 0) }),
    decimal("li13b", {}, { ...indent(720), run: border(4, 4) }),
    decimal("li13c", {}, { ...indent(1440, 1080), run: border(12, 4) }),
    decimal("li13d", { suffix: LevelSuffix.SPACE }, { ...indent(720), run: border(12, 4) }),
    {
        reference: "li14",
        levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.%3.", style: indent(720) },
            { level: 1, format: LevelFormat.DECIMAL, text: "%2)", style: indent(1440) },
        ],
    },
    {
        reference: "li15",
        levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: indent(720) },
            { level: 1, format: LevelFormat.DECIMAL, text: "%2)", style: indent(1440) },
        ],
    },
    // Courier New 14 for the number, and a long text after it
    {
        reference: "li16",
        levels: [
            {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: "Number %1 of the list:",
                style: { ...indent(720), run: { font: "Courier New", size: 28 } },
            },
        ],
    },
    decimal("li17"),
    ...["li18a", "li18b", "li18c", "li18d"].map((reference) => decimal(reference)),
    decimal("li19a", { start: 10000 }),
    decimal("li19b"),
    { reference: "li20a", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", style: indent(720) }] },
    { reference: "li20b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", style: indent(720) }] },
];

const auto = { spacing: { beforeAutoSpacing: true, afterAutoSpacing: true } } as object;

/**
 * Changes the levels of a list in the numbering part: the abstract definitions are written in the order of the config,
 * after docx's own
 */
const changeList = (numbering: string, reference: string, change: (xml: string) => string): string => {
    const index = LISTS.findIndex((list) => list.reference === reference);
    const abstracts = [...numbering.matchAll(/<w:abstractNum [^>]*>.*?<\/w:abstractNum>/gs)];
    const abstract = abstracts[abstracts.length - LISTS.length + index];
    return numbering.replace(abstract[0], change(abstract[0]));
};

/** Takes out of the footnotes part those no reference in the body refers to, which the kit writes for every document */
const onlyReferencedNotes = (parts: Map<string, string>): void => {
    const notes = parts.get("word/footnotes.xml");
    if (notes === undefined) {
        return;
    }
    const referenced = new Set(
        [...parts.get("word/document.xml")!.matchAll(/<w:footnoteReference [^>]*w:id="(-?\d+)"/g)].map(([, id]) => id),
    );
    parts.set(
        "word/footnotes.xml",
        notes.replace(/<w:footnote w:id="(\d+)">.*?<\/w:footnote>/gs, (note, id: string) => (referenced.has(id) ? note : "")),
    );
};

/** A picture bullet as Word writes one: the picture's shape type, then the shape, in the numbering part */
const pictureBullet = (id: number, points: number, relationship: string): string =>
    `<w:numPicBullet w:numPicBulletId="${id}"><w:pict><v:shapetype xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f"><v:stroke joinstyle="miter"/><v:formulas><v:f eqn="if lineDrawn pixelLineWidth 0"/><v:f eqn="sum @0 1 0"/><v:f eqn="sum 0 0 @1"/><v:f eqn="prod @2 1 2"/><v:f eqn="prod @3 21600 pixelWidth"/><v:f eqn="prod @3 21600 pixelHeight"/><v:f eqn="sum @0 0 1"/><v:f eqn="prod @6 1 2"/><v:f eqn="prod @7 21600 pixelWidth"/><v:f eqn="sum @8 21600 0"/><v:f eqn="prod @7 21600 pixelHeight"/><v:f eqn="sum @10 21600 0"/></v:formulas><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/></v:shapetype><v:shape xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" id="_x0000_i${1025 + id}" type="#_x0000_t75" style="width:${points}pt;height:${points}pt" o:bullet="t"><v:imagedata xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${relationship}" o:title=""/></v:shape></w:pict></w:numPicBullet>`;

await write({
    name: "word-stops-lists2",
    options: { numbering: { config: LISTS } } as object,
    sections: [
        {
            properties: PAGE,
            children: [
                ...["a", "b", "c", "d"].flatMap((letter) =>
                    probe(`LI13${letter}`, [
                        numbered(`li13${letter}`, 0, `LI13${letter} ${prose(30)}`),
                        numbered(`li13${letter}`, 0, `LI13${letter} ${prose(30)}`),
                    ]),
                ),
                ...probe("LI14", [
                    numbered("li14", 1, "LI14 level 1 first"),
                    numbered("li14", 0, "LI14 level 0 left out"),
                    numbered("li14", 1, "LI14 level 1 second"),
                ]),
                ...probe("LI15", [numbered("li15", 1, "LI15 level 1 first"), numbered("li15", 1, "LI15 level 1 second")]),
                ...probe("LI16", [numbered("li16", 0, `LI16${"W".repeat(36)}`), line("LI16 next")]),
                ...probe("LI17", [
                    new Paragraph({ ...auto, numbering: { reference: "li17", level: 0, instance: 1 }, text: "LI17 first list" }),
                    new Paragraph({ ...auto, numbering: { reference: "li17", level: 0, instance: 2 }, text: "LI17 second list" }),
                    new Paragraph({ ...auto, numbering: { reference: "li17", level: 0, instance: 2 }, text: "LI17 second again" }),
                    line("LI17 after", auto),
                ]),
                ...["a", "b", "c", "d"].flatMap((letter) =>
                    probe(`LI18${letter}`, [
                        numbered(`li18${letter}`, 0, `LI18${letter} ${prose(30)}`),
                        numbered(`li18${letter}`, 0, `LI18${letter} ${prose(30)}`),
                    ]),
                ),
                ...["a", "b"].flatMap((letter) =>
                    probe(`LI19${letter}`, [
                        numbered(`li19${letter}`, 0, `LI19${letter} ${prose(30)}`),
                        numbered(`li19${letter}`, 0, `LI19${letter} ${prose(30)}`),
                    ]),
                ),
                ...["a", "b"].flatMap((letter) =>
                    probe(`LI20${letter}`, [
                        numbered(`li20${letter}`, 0, `LI20${letter} ${prose(30)}`),
                        numbered(`li20${letter}`, 0, `LI20${letter} ${prose(30)}`),
                    ]),
                ),
            ],
        },
    ],
    injections: [
        onlyReferencedNotes,
        (parts) => {
            let numbering = parts.get("word/numbering.xml")!;
            // LI15's level 0 aligned both, and LI18's numbers aligned in the schema's other ways for paragraphs
            const aligned = (reference: string, jc: string): void => {
                numbering = changeList(numbering, reference, (xml) => xml.replace(/<w:lvlJc w:val="[^"]*"\/>/, `<w:lvlJc w:val="${jc}"/>`));
            };
            aligned("li15", "both");
            aligned("li18a", "distribute");
            aligned("li18b", "numTab");
            aligned("li18c", "lowKashida");
            aligned("li18d", "thaiDistribute");
            // LI19: Word 6's numbering, before the alignment, as the schema has it
            numbering = changeList(numbering, "li19a", (xml) =>
                xml.replace(/<w:lvlJc /, '<w:legacy w:legacy="1" w:legacySpace="120" w:legacyIndent="360"/><w:lvlJc '),
            );
            numbering = changeList(numbering, "li19b", (xml) =>
                xml.replace(/<w:lvlJc /, '<w:legacy w:legacy="1" w:legacySpace="120" w:legacyIndent="720"/><w:lvlJc '),
            );
            // LI20: picture bullets of 9 and 20 points, as Word writes them, with their shape type
            numbering = changeList(numbering, "li20a", (xml) =>
                xml.replace(/<w:lvlText [^>]*\/>/, '<w:lvlText w:val=""/><w:lvlPicBulletId w:val="0"/>'),
            );
            numbering = changeList(numbering, "li20b", (xml) =>
                xml.replace(/<w:lvlText [^>]*\/>/, '<w:lvlText w:val=""/><w:lvlPicBulletId w:val="1"/>'),
            );
            numbering = numbering.replace(
                "<w:abstractNum ",
                `${pictureBullet(0, 9, "rIdStopsImage")}${pictureBullet(1, 20, "rIdStopsImage")}<w:abstractNum `,
            );
            parts.set("word/numbering.xml", numbering);
            const rels =
                parts.get("word/_rels/numbering.xml.rels") ??
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
            parts.set(
                "word/_rels/numbering.xml.rels",
                rels.replace(
                    "</Relationships>",
                    '<Relationship Id="rIdStopsImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/stops.png"/></Relationships>',
                ),
            );
            const types = parts.get("[Content_Types].xml")!;
            if (!types.includes('Extension="png"')) {
                parts.set("[Content_Types].xml", types.replace("</Types>", '<Default Extension="png" ContentType="image/png"/></Types>'));
            }
        },
    ],
    files: { "word/media/stops.png": PNG },
});
