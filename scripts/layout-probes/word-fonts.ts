/**
 * Probes of how Word measures text in a font, for docx/layout's measurer of font files: when it kerns, which of a font's
 * kerning it uses, and how tall its lines are. Each line's first word names its probe, so the lines can be found in a PDF
 * saved from Word with pdftotext -bbox-layout, and word-fonts.py reads them.
 *
 * The text is in Aptos, Office's default font since 2023, which Word has and docx's width tables don't, at 12 points,
 * single spaced, with no space between paragraphs. Each probe's text is one word, so its width is the width of its box.
 *
 * F1: kerning off and on, with pairs that both Aptos's kern table and its GPOS table kern ("ToTo")
 * F2: kerning off and on, with pairs that only Aptos's GPOS table kerns ("PcPc", "YyYy")
 * F3: kerning from 14 points (`w:kern` 28), on text of 12, 14 and 16 points
 * F4: kerning between runs: each letter of F1's word in its own run
 * F5: Calibri, whose kern and GPOS tables kern the same pairs, without and with kerning
 * F6: the height of Aptos's lines: 30 lines at 12 points and 30 at 11
 * F7: bold and italic Aptos, which are fonts of their own, without and with kerning
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-fonts.ts [output .docx] [directory with Aptos.ttf and Calibri.ttf]
 *
 * Given Word's fonts (on a Mac, /Applications/Microsoft Word.app/Contents/Resources/DFonts), it also prints how wide
 * docx/layout measures each probe's word, to compare with what word-fonts.py reads from Word's PDF.
 *
 * Word's PDF of it is word-fonts.pdf, beside it. Word kerned only with `w:kern`, and only text of its size or larger,
 * with the pairs of Aptos's GPOS table, which has pairs its kern table doesn't, and across runs. Its lines of Aptos are
 * 1.2207 ems apart, from Aptos's typographic ascent and descent, which Aptos says to use, rather than 1.2847 from its
 * ascent and descent for Windows. LibreOffice kerned the same, but text smaller than `w:kern` too.
 */
// cspell:ignore Aptos DFonts GPOS bbox
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { Document, Packer, Paragraph, type ParagraphChild, TextRun } from "docx";

import { createFontFileMeasurer, readFontFile } from "../../src/text-layout";

type Probe = {
    readonly name: string;
    readonly text: string;
    readonly font?: string;
    /** Size in points */
    readonly size?: number;
    /** The smallest size kerned, in points (`w:kern`) */
    readonly kerning?: number;
    readonly bold?: boolean;
    readonly italic?: boolean;
    /** Each letter in a run of its own */
    readonly split?: boolean;
};

const SIZE = 12;
const BOTH = "ToToToToToToToToToTo";
const GPOS_ONLY = ["PcPcPcPcPcPcPcPcPcPc", "YyYyYyYyYyYyYyYyYyYy"];

const PROBES: readonly Probe[] = [
    { name: "F1a", text: BOTH },
    { name: "F1b", text: BOTH, kerning: 1 },
    { name: "F2a", text: GPOS_ONLY[0] },
    { name: "F2b", text: GPOS_ONLY[0], kerning: 1 },
    { name: "F2c", text: GPOS_ONLY[1] },
    { name: "F2d", text: GPOS_ONLY[1], kerning: 1 },
    { name: "F3a", text: BOTH, size: 12, kerning: 14 },
    { name: "F3b", text: BOTH, size: 14, kerning: 14 },
    { name: "F3c", text: BOTH, size: 16, kerning: 14 },
    { name: "F3d", text: BOTH, size: 14 },
    { name: "F3e", text: BOTH, size: 16 },
    { name: "F4a", text: BOTH, kerning: 1, split: true },
    { name: "F5a", text: BOTH, font: "Calibri" },
    { name: "F5b", text: BOTH, font: "Calibri", kerning: 1 },
    { name: "F7a", text: BOTH, bold: true },
    { name: "F7b", text: BOTH, bold: true, kerning: 1 },
    { name: "F7c", text: BOTH, italic: true },
    { name: "F7d", text: BOTH, italic: true, kerning: 1 },
];

const runOptions = ({ font = "Aptos", size = SIZE, kerning, bold, italic }: Probe): ConstructorParameters<typeof TextRun>[0] & object => ({
    font,
    size: size * 2,
    bold,
    italics: italic,
    ...(kerning === undefined ? {} : { kern: kerning * 2 }),
});

const probeParagraph = (probe: Probe): Paragraph => {
    const options = runOptions(probe);
    const word: readonly ParagraphChild[] = probe.split
        ? [...probe.text].map((letter) => new TextRun({ ...options, text: letter }))
        : [new TextRun({ ...options, text: probe.text })];
    // The probe's name is a word of its own, in the same font and size but not kerned, so the word after it is boxed alone
    return new Paragraph({ children: [new TextRun({ ...options, kern: undefined, text: `${probe.name} ` }), ...word] });
};

const lines = (name: string, count: number, size: number): readonly Paragraph[] =>
    Array.from(
        { length: count },
        (_, index) => new Paragraph({ children: [new TextRun({ font: "Aptos", size: size * 2, text: `${name} line ${index + 1}` })] }),
    );

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Aptos", size: SIZE * 2 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections: [{ children: PROBES.map(probeParagraph) }, { children: [...lines("F6a", 30, 12), ...lines("F6b", 30, 11)] }],
});

const output = process.argv[2] ?? "build/word-probes/word-fonts.docx";
const fonts = process.argv[3];

Packer.toBuffer(doc).then((buffer) => {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, buffer);
    if (!fonts) {
        return;
    }
    const files = ["Aptos.ttf", "Aptos-Bold.ttf", "Aptos-Italic.ttf", "Calibri.ttf"];
    const measurer = createFontFileMeasurer(files.flatMap((file) => readFontFile(readFileSync(join(fonts, file)))));
    console.log("The width docx/layout measures each probe's word at, in points");
    for (const probe of PROBES) {
        const font = { font: probe.font ?? "Aptos", size: probe.size ?? SIZE, bold: probe.bold, italic: probe.italic };
        const plain = measurer.measureWidth(probe.text, font);
        const kerned = measurer.measureWidth(probe.text, { ...font, kerning: probe.kerning });
        console.log(`  ${probe.name}: ${plain.toFixed(3)} without kerning, ${kerned.toFixed(3)} as measured`);
    }
    for (const [name, size] of [
        ["F6a", 12],
        ["F6b", 11],
    ] as const) {
        console.log(`  ${name}: lines ${(measurer.measureLineHeight({ font: "Aptos", size }) * 20).toFixed(2)} twips apart`);
    }
});
