/**
 * Probes of Word's automatic hyphenation (`w:autoHyphenation`), and of the settings that change it: when Word hyphenates
 * the word that doesn't fit at the end of a line, and when it certainly doesn't. Word hyphenates by its own dictionaries,
 * one for each language, which docx/layout can't have, so what matters is where Word leaves a word whole. The same
 * probes are written four times:
 *
 * - `word-hyphenation.docx`: automatic hyphenation, with Word's defaults: a hyphenation zone of a quarter of an inch, no
 *   limit to the lines in a row that end with a hyphen, and words in capitals hyphenated
 * - `word-hyphenation-zone.docx`: with a hyphenation zone of an inch (`w:hyphenationZone` 1440). Word's own help says
 *   Word leaves a word whole when the room it would leave at the end of the line is no more than the zone, and its VBA
 *   help says the zone is 99999999 unless the document is in compatibility mode
 * - `word-hyphenation-limit.docx`: with at most one line in a row ending with a hyphen (`w:consecutiveHyphenLimit` 1),
 *   and words in capitals left whole (`w:doNotHyphenateCaps`)
 * - `word-hyphenation-manual.docx`: the same limit and capitals, without automatic hyphenation: whether the limit holds
 *   for soft hyphens
 *
 * Calibri 11 on A4 with 1440 margins, lines of 9026 twips (451.3 points), single spaced with no space between paragraphs.
 * Each paragraph starts with the name of its probe. The room a line leaves is measured from where the word after its last
 * space would start to the end of the line, with docx/layout's widths of Calibri, which are Word's within a twip, so a
 * room is good to about a tenth of a point. Each group of probes starts a page, and none ends one. word-hyphenation.py
 * reads them.
 *
 * HY1: prose of long English words, 12 lines or so, in no language, as docx writes it, so in Word's own (HY1a), in
 *      English (United States) (HY1b) and English (United Kingdom) (HY1c), and justified (HY1d): whether Word
 *      hyphenates, where, and how much room the lines it hyphenates and those it doesn't leave
 * HY2: the prose of HY1a in a paragraph that suppresses hyphenation (`w:suppressAutoHyphens`, HY2a), and in a style that
 *      does (HY2b)
 * HY3: a first line that leaves a room tuned for the word after it: "unbelievably" with 13.9 points (just short of
 *      "un-", 14.9), 16 (past "un-", short of the default zone's 18), 20, 28 (past "unbe-", 26.2) and 44 (past "unbeliev-",
 *      41.7) (HY3a to HY3e), and "abandonment" with 10 (past "a-", 8.6, short of "ab-", 14.4), 27 (past "aban-", 25.5) and
 *      60 (past "abandon-", 42.8, short of the zone of an inch) (HY3f to HY3h), and "incomprehensibilities" with 80, past
 *      the zone of an inch (HY3i): the least room Word hyphenates in, and whether the zone counts
 * HY4: justified lines: room for "un-" only were the spaces squeezed (13 points, HY4a), for "unbelievably" squeezed
 *      (53.8 points, 3 short, as Word squeezes a word in without hyphenation, HY4b), and HY4b left-aligned (HY4c): whether
 *      Word squeezes a line to hyphenate, and hyphenates rather than squeezes
 * HY5: short words with room for their first part and a hyphen, but not for all of them: "into" (in-), "upon" (up-),
 *      "also" (al-), "under" (un-), "after" (af-), "never" (nev-), "number" (num-), "garden" (gar-) and "better" (bet-)
 *      (HY5a to HY5i): the shortest words Word hyphenates
 * HY6: numbers with room for half: "1234567890123" (HY6a) and "3.14159265358979" (HY6b)
 * HY7: "unbelievably" with room for "unbeliev-", not checked for spelling (`w:noProof`, HY7a), and in no language
 *      (`w:lang` zxx, HY7b)
 * HY8: "extraordinarily" with a soft hyphen (`w:softHyphen`) after "extra": room for "extraordinar-" but not the word
 *      (61 points, HY8a), for "ex-" but not "extra-" (18 points, HY8b), and HY8a without the soft hyphen (HY8c): whether
 *      Word hyphenates a word with a soft hyphen elsewhere
 * HY9: lines in a row ending with hyphens: words with soft hyphens between their parts, as `word-watertight-text.docx`
 *      TX10a (HY9a), a first line ending at the hyphen of "well-known" (HY9b) and at the soft hyphen of "extra-ordinarily"
 *      (HY9c), each followed by a line that leaves room for "unbeliev-": which hyphens the limit counts
 * HY10: capitals with room for "UNBELIEV-": typed in capitals (HY10a), in small letters shown as capitals (`w:caps`,
 *       HY10b), and only the first letter a capital, with room for "Unbeliev-" (HY10c)
 * HY11: a table sized to its text (no widths), its first column "incomprehensibilities" and its second long prose, with
 *       hyphenation (HY11a) and in the style without it (HY11b): whether hyphenation changes the widths Word gives columns
 * HY12: a word longer than a line, "pneumonoultramicroscopicsilicovolcanoconiosis" three times over: whether Word
 *       hyphenates it or breaks it after the last letter that fits
 * HY13: prose of words of three letters or fewer (HY13a) and of four (HY13b), 5 lines each: whether hyphenation changes
 *       lines where no word is hyphenated
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore Calibri pneumonoultramicroscopicsilicovolcanoconiosis incomprehensibilities Donau dampf schiff fahrts gesellschaft zxx unbe unbeliev aban extraordinar
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    AlignmentType,
    Document,
    LineRuleType,
    Packer,
    Paragraph,
    type ParagraphChild,
    SoftHyphen,
    Table,
    TableCell,
    TableRow,
    TextRun,
} from "docx";

import { measureTextWidth } from "../../src/text-layout/text-width";

const FONT = { font: "Calibri", size: 11 };
// The width of the text, in points
const LIMIT = 9026 / 20;
const measure = (text: string): number => measureTextWidth(text, FONT);

const LONG = (
    "international communication understanding responsibility administration representative establishment documentation " +
    "environmental characteristic transportation manufacturing investigation consideration organization development " +
    "particularly information significant opportunity professional relationship independent temperature performance " +
    "requirement agricultural comfortable photographer conversation imagination introduction description competition " +
    "celebration experimental vocabulary electricity mathematics philosophy personality restaurant university television " +
    "government everything helicopter kaleidoscope unbelievable extraordinary nevertheless furthermore approximately " +
    "unfortunately simultaneously occasionally"
).split(" ");
const SHORT = "the of and a in to for with on by".split(" ");
/** Prose of long words with a short one after every second, the same each time */
const prose = (count: number): string =>
    Array.from({ length: count }, (_, i) =>
        i % 3 === 2 ? SHORT[Math.floor(i / 3) % SHORT.length] : LONG[(i - Math.floor(i / 3)) % LONG.length],
    ).join(" ");

// Short words to fill a line with, before the word that tunes it
const FILLER = "the sea was calm and we set out at dawn to see the old fort on the hill by the bay and the cove".split(" ");
// What goes after the probed word on the next line
const REST = "and so on to the end";

/**
 * A word of m's, e's, r's and i's as wide as it can be made to `width` points: the word that tunes a line
 */
const pad = (width: number): string => {
    let best = "";
    let error = Infinity;
    for (let m = 0; m <= 8; m++) {
        for (let e = 0; e <= 6; e++) {
            for (let r = 0; r <= 6; r++) {
                for (let i = 0; i <= 6; i++) {
                    const word = "m".repeat(m) + "e".repeat(e) + "r".repeat(r) + "i".repeat(i);
                    const off = Math.abs(measure(word) - width);
                    if (word.length > 0 && off < error) {
                        best = word;
                        error = off;
                    }
                }
            }
        }
    }
    return best;
};

/**
 * The text of a line that starts with `start` and leaves `room` points for the word after it: short words, then a word
 * that tunes it, then a space
 */
const tunedLine = (start: string, room: number): string => {
    const words = [start];
    for (const word of FILLER) {
        if (measure(`${[...words, word].join(" ")} `) > LIMIT - room - 30) {
            break;
        }
        words.push(word);
    }
    const head = `${words.join(" ")} `;
    const tuned = `${head}${pad(LIMIT - room - measure(head) - measure(" "))} `;
    const off = LIMIT - room - measure(tuned);
    if (Math.abs(off) > 0.2) {
        throw new Error(`${start}: room ${room} is ${off.toFixed(2)} out`);
    }
    return tuned;
};

/** A paragraph whose first line leaves `room` points for `word`, in runs of these options, and then the rest */
const tuned = (
    probe: string,
    room: number,
    word: string,
    options: { readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; readonly run?: Record<string, unknown> } = {},
    width: number = measure(word),
): Paragraph => {
    if (width <= room) {
        throw new Error(`${probe}: ${word} fits in ${room}`);
    }
    return new Paragraph({
        ...(options.alignment ? { alignment: options.alignment } : {}),
        children: [new TextRun(tunedLine(probe, room)), new TextRun({ text: word, ...options.run }), new TextRun(` ${REST}`)],
    });
};

/** A paragraph of text, in the style or with the hyphenation given */
const paragraph = (text: string, options: { readonly style?: string; readonly noHyphens?: boolean } = {}): Paragraph =>
    new Paragraph({
        ...(options.style ? { style: options.style } : {}),
        // Written as suppressLineNumbers, then replaced: see INJECTIONS
        ...(options.noHyphens ? { suppressLineNumbers: true } : {}),
        children: [new TextRun(text)],
    });

/** The first paragraph of a group, which starts a page */
const heading = (text: string): Paragraph => new Paragraph({ pageBreakBefore: true, children: [new TextRun(text)] });

// HY9a: a German word with soft hyphens between its parts, as word-watertight-text.ts TX10a
const COMPOUND = ["Donau", "dampf", "schiff", "fahrts", "gesellschaft"];
const softHyphenated = (parts: readonly string[]): ParagraphChild[] =>
    parts
        .flatMap((part, index) => (index === 0 ? [part] : [new SoftHyphen(), part]))
        .map((child) => (typeof child === "string" ? new TextRun(child) : new TextRun({ children: [child] })));

/**
 * HY9b and HY9c: a first line that ends at the hyphen in `first` (its parts), as `room` leaves room for the first part and
 * its hyphen but not the next, then a second line that leaves room for "unbeliev-"
 */
const twoLines = (probe: string, parts: readonly string[], soft: boolean): Paragraph => {
    const [head, ...tail] = parts;
    const room = measure(`${head}-`) + 3;
    const after = tail.join("");
    // The second line starts with what is after the hyphen, then is filled to leave room for "unbeliev-"
    const second = tunedLine(after, 44).slice(after.length);
    return new Paragraph({
        children: [
            new TextRun(tunedLine(probe, room)),
            ...(soft ? softHyphenated(parts) : [new TextRun(parts.join("-"))]),
            new TextRun(second),
            new TextRun(`unbelievably ${REST}`),
        ],
    });
};

const LONGEST = "pneumonoultramicroscopicsilicovolcanoconiosis";

const content = [
    heading("HY1 prose"),
    new Paragraph({ children: [new TextRun(`HY1a ${prose(110)}`)] }),
    new Paragraph({ children: [new TextRun({ text: `HY1b ${prose(110)}`, language: { value: "en-US" } })] }),
    new Paragraph({ children: [new TextRun({ text: `HY1c ${prose(110)}`, language: { value: "en-GB" } })] }),
    heading("HY1 justified"),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun(`HY1d ${prose(110)}`)] }),
    heading("HY2 suppressed"),
    paragraph(`HY2a ${prose(110)}`, { noHyphens: true }),
    paragraph(`HY2b ${prose(110)}`, { style: "NoHyphens" }),
    heading("HY3 rooms"),
    tuned("HY3a", 13.9, "unbelievably"),
    tuned("HY3b", 16, "unbelievably"),
    tuned("HY3c", 20, "unbelievably"),
    tuned("HY3d", 28, "unbelievably"),
    tuned("HY3e", 44, "unbelievably"),
    tuned("HY3f", 10, "abandonment"),
    tuned("HY3g", 27, "abandonment"),
    tuned("HY3h", 60, "abandonment"),
    tuned("HY3i", 80, "incomprehensibilities"),
    heading("HY4 justified"),
    tuned("HY4a", 13, "unbelievably", { alignment: AlignmentType.JUSTIFIED }),
    tuned("HY4b", 53.8, "unbelievably", { alignment: AlignmentType.JUSTIFIED }),
    tuned("HY4c", 53.8, "unbelievably"),
    heading("HY5 short words"),
    ...(
        [
            ["HY5a", "into", "in-"],
            ["HY5b", "upon", "up-"],
            ["HY5c", "also", "al-"],
            ["HY5d", "under", "un-"],
            ["HY5e", "after", "af-"],
            ["HY5f", "never", "nev-"],
            ["HY5g", "number", "num-"],
            ["HY5h", "garden", "gar-"],
            ["HY5i", "better", "bet-"],
        ] as const
    ).map(([probe, word, part]) => tuned(probe, measure(part) + 1.5, word)),
    heading("HY6 numbers"),
    tuned("HY6a", 45, "1234567890123"),
    tuned("HY6b", 45, "3.14159265358979"),
    heading("HY7 proofing"),
    tuned("HY7a", 44, "unbelievably", { run: { noProof: true } }),
    tuned("HY7b", 44, "unbelievably", { run: { language: { value: "zxx" } } }),
    heading("HY8 soft hyphens"),
    new Paragraph({
        children: [
            new TextRun(tunedLine("HY8a", 61)),
            new TextRun({ children: ["extra", new SoftHyphen(), "ordinarily"] }),
            new TextRun(` ${REST}`),
        ],
    }),
    new Paragraph({
        children: [
            new TextRun(tunedLine("HY8b", 18)),
            new TextRun({ children: ["extra", new SoftHyphen(), "ordinarily"] }),
            new TextRun(` ${REST}`),
        ],
    }),
    tuned("HY8c", 61, "extraordinarily"),
    heading("HY9 hyphens in a row"),
    new Paragraph({
        children: [new TextRun("HY9a"), ...Array.from({ length: 30 }, () => [new TextRun(" "), ...softHyphenated(COMPOUND)]).flat()],
    }),
    twoLines("HY9b", ["well", "known"], false),
    twoLines("HY9c", ["extra", "ordinarily"], true),
    heading("HY10 capitals"),
    tuned("HY10a", 50, "UNBELIEVABLY"),
    tuned("HY10b", 50, "unbelievably", { run: { allCaps: true } }, measure("UNBELIEVABLY")),
    tuned("HY10c", measure("Unbeliev-") + 2, "Unbelievably"),
    heading("HY11 tables"),
    ...(["HY11a", "HY11b"] as const).flatMap((probe) => [
        new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [paragraph(`${probe} incomprehensibilities`, probe === "HY11b" ? { style: "NoHyphens" } : {})],
                        }),
                        new TableCell({
                            children: [paragraph(`${probe} cell ${prose(40)}`, probe === "HY11b" ? { style: "NoHyphens" } : {})],
                        }),
                    ],
                }),
            ],
        }),
        paragraph(`${probe} below`),
    ]),
    heading("HY12 a long word"),
    paragraph(`HY12 ${LONGEST.repeat(3)} ${REST}`),
    heading("HY13 short words"),
    paragraph(
        `HY13a ${Array.from({ length: 90 }, (_, i) => "the cat sat on a mat and ate an egg by the old red box of tea".split(" ")[(i * 5) % 17]).join(" ")}`,
    ),
    paragraph(
        `HY13b ${Array.from({ length: 70 }, (_, i) => "they went into town upon some days when snow fell over many tall dark hill farm".split(" ")[(i * 7) % 16]).join(" ")}`,
    ),
    paragraph("HY13 end"),
];

/** [what docx writes, what replaces it], in document.xml */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [[/<w:suppressLineNumbers\/>/g, "<w:suppressAutoHyphens/>"]];

// HY2b and HY11b's style, which suppresses hyphenation
const STYLES =
    '<w:style w:type="paragraph" w:customStyle="1" w:styleId="NoHyphens"><w:name w:val="No Hyphens"/><w:basedOn w:val="Normal"/>' +
    "<w:pPr><w:suppressAutoHyphens/></w:pPr></w:style>";

const doc = (hyphenation: NonNullable<ConstructorParameters<typeof Document>[0]["hyphenation"]>): Document =>
    new Document({
        hyphenation,
        styles: {
            default: { document: { run: { font: "Calibri", size: 22 } } },
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    paragraph: { spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } },
                },
            ],
        },
        sections: [{ children: content }],
    });

const DOCUMENTS = [
    ["word-hyphenation", { autoHyphenation: true }],
    ["word-hyphenation-zone", { autoHyphenation: true, hyphenationZone: 1440 }],
    ["word-hyphenation-limit", { autoHyphenation: true, consecutiveHyphenLimit: 1, doNotHyphenateCaps: true }],
    ["word-hyphenation-manual", { consecutiveHyphenLimit: 1, doNotHyphenateCaps: true }],
] as const;

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    for (const [name, hyphenation] of DOCUMENTS) {
        const zip = await JSZip.loadAsync(await Packer.toBuffer(doc(hyphenation)));
        const styles = await zip.file("word/styles.xml")!.async("string");
        zip.file("word/styles.xml", styles.replace("</w:styles>", `${STYLES}</w:styles>`));
        const body = await zip.file("word/document.xml")!.async("string");
        zip.file(
            "word/document.xml",
            INJECTIONS.reduce((xml, [marker, replacement]) => xml.replace(marker, replacement), body),
        );
        writeFileSync(`build/word-probes/${name}.docx`, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    }
};

void main();
