// A second probe of how Word lays out equations, where word-equations.ts left it open: how wide each letter, digit and
// operator of an equation of text is, in Cambria Math, and the italic correction Word adds after each italic letter, to
// make a table of them from Word's own PDF, as the width tables' widths come from Word's PDFs; how tall a line with such
// an equation is in other fonts and sizes, and on a line of its own; and how Word spaces some operators. Each line of text
// names its probe, as "EQ6a before", then the equation, then "after". Word draws each character of an equation on its own
// in its PDF, so word-equations2.py reads where each is from the PDF's content, and pdftotext's HTML for the lines.
// Calibri 11, single spaced, no space before or after, on A4 with 1440 margins, unless a probe says otherwise.
//
// EQ6a to EQ6z, EQ6A to EQ6Z: each italic letter, then "+1": how wide it is, and its italic correction before "+"
// EQ6g01 to EQ6g25, EQ6G01 to EQ6G24: each Greek letter, small and capital, the same
// EQ7a, EQ7b: the letters in plain style (`m:sty="p"`), a to z and A to Z, one equation each
// EQ7c: the digits and the full stop, comma and slash; EQ7d: binary operators between letters; EQ7e: relations between
//       letters; EQ7f: brackets round letters; EQ7g: other punctuation and symbols between letters
// EQ8a: an italic letter before a digit, "x2", "a1"; EQ8b: an italic letter before a plain one; EQ8c: a minus sign after a
//       bracket, an equals sign, a comma and a plus sign; EQ8d: normal text between letters; EQ8e: a function whose name
//       is plain, "sin x"; EQ8f: two letters with a space between them
// EQ9a to EQ9c: an equation in a line of Arial 11, Times New Roman 12 and Courier New 10, between lines of the same:
//       whether Cambria Math's ascent and descent make the line taller
// EQ9d: an equation in a paragraph whose style is 16 points: what size it is drawn in
// EQ9e: an equation whose run is 16 points (`w:sz` in `m:r`)
// EQ9f to EQ9h: an equation alone in its paragraph in Arial 11, Times New Roman 12 and 16 points: how tall its line is
// EQ9i: an equation alone in its paragraph with 240 before and 120 after
// EQ9j: two equations in one `m:oMathPara`: whether each is a line of its own, and how tall
//
// What Word showed, in word-equations2.pdf, saved from Word 16 for Mac on 2026-10-04 and read with word-equations2.py:
//
// - EQ6: each italic letter's width and italic correction are Cambria Math's own, to within a thousandth of an em. Word
//   draws Greek capitals in italic too
// - EQ7: every operator here is spaced as TeX spaces it, 4 eighteenths for the binary operators and 5 for the relations,
//   brackets and bars have no space beside them, and punctuation (, ; : ! ?) has 3 after it. An italic letter's italic
//   correction is added before an operator, a bracket, a bar, a slash and punctuation, and not before a prime, which Word
//   draws for an apostrophe, nor before infinity, the partial differential sign and nabla, the last two drawn in italic.
//   A full stop after a digit, not before one, has 3 after it before a comma
// - EQ8: no italic correction before a digit, a plain letter or normal text. A minus sign after a bracket, an equals sign,
//   a comma or a plus sign is unary, as in TeX, and a relation after a closing bracket has its 5 eighteenths. A function
//   whose name is plain has 3 eighteenths after its name too
// - EQ9: an equation is drawn in its paragraph's style's size, or its run's own (`w:sz`), not the size of the text beside
//   it, and takes room in its line as text in Cambria Math does: the line is as tall as the tallest ascent and the deepest
//   descent of its text and its equation, which makes a line of Courier New 10 taller, and a line of only an equation is
//   as tall as a line of Cambria Math, with its paragraph's space before and after. Two equations in one `m:oMathPara`
//   are on one line, one after the other
//
// Usage: npm run run-ts -- scripts/layout-probes/word-equations2.ts, which writes build/word-probes/word-equations2.docx
// cspell:ignore pdftocairo nabla
import * as fs from "fs";

import JSZip from "jszip";

import { Document, type ISectionOptions, Math as Equation, MathFunction, MathRun, Packer, Paragraph, TextRun } from "docx";

type MathChild = ConstructorParameters<typeof Equation>[0]["children"][number];
type RunOptions = ConstructorParameters<typeof TextRun>[0] & object;

const line = (text: string, run: RunOptions = {}): Paragraph => new Paragraph({ children: [new TextRun({ ...run, text })] });
const fill = (probe: string, count: number, run: RunOptions = {}): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`, run));

/** A line of text with an equation in it, between its probe's name and "after", in the font given */
const inLine = (probe: string, children: readonly MathChild[], run: RunOptions = {}, style?: string): Paragraph =>
    new Paragraph({
        ...(style ? { style } : {}),
        children: [
            new TextRun({ ...run, text: `${probe} before ` }),
            new Equation({ children: [...children] }),
            new TextRun({ ...run, text: " after" }),
        ],
    });

/** A paragraph of only an equation, which Word shows on a line of its own */
const alone = (children: readonly MathChild[], options: ConstructorParameters<typeof Paragraph>[0] & object = {}): Paragraph =>
    new Paragraph({ ...options, children: [new Equation({ children: [...children] })] });

/** A page of probes, with a line naming them at its top */
const page = (name: string, children: readonly Paragraph[]): ISectionOptions => ({ children: [line(`${name} above`), ...children] });

const run = (text: string): MathRun => new MathRun(text);
const plain = (text: string): MathRun => new MathRun({ text, style: "plain" });

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GREEK_LOWER =
    "\u03b1\u03b2\u03b3\u03b4\u03b5\u03b6\u03b7\u03b8\u03b9\u03ba\u03bb\u03bc\u03bd\u03be\u03bf\u03c0\u03c1\u03c2\u03c3\u03c4\u03c5\u03c6\u03c7\u03c8\u03c9";
const GREEK_UPPER =
    "\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039a\u039b\u039c\u039d\u039e\u039f\u03a0\u03a1\u03a3\u03a4\u03a5\u03a6\u03a7\u03a8\u03a9";

const ARIAL = { font: "Arial", size: 22 };
const TIMES = { font: "Times New Roman", size: 24 };
const COURIER = { font: "Courier New", size: 20 };

const sections: ISectionOptions[] = [
    page(
        "EQ6",
        [...LOWER].map((letter) => inLine(`EQ6${letter}`, [run(`${letter}+1`)])),
    ),
    page(
        "EQ6",
        [...UPPER].map((letter) => inLine(`EQ6${letter}`, [run(`${letter}+1`)])),
    ),
    page(
        "EQ6g",
        [...GREEK_LOWER].map((letter, i) => inLine(`EQ6g${String(i + 1).padStart(2, "0")}`, [run(`${letter}+1`)])),
    ),
    page(
        "EQ6G",
        [...GREEK_UPPER].map((letter, i) => inLine(`EQ6G${String(i + 1).padStart(2, "0")}`, [run(`${letter}+1`)])),
    ),
    page("EQ7", [
        inLine("EQ7a", [plain(LOWER)]),
        inLine("EQ7b", [plain(UPPER)]),
        inLine("EQ7c", [run("0123456789.,/")]),
        inLine("EQ7d", [run("a+b@MINUS@c@TIMES@d@DIVIDE@e@PLUSMINUS@f@MINUSPLUS@g@DOT@h@STAR@i@RING@j")]),
        inLine("EQ7e", [run("a=b<c>d@LE@e@GE@f@NE@g@APPROX@h@EQUIV@i@SIM@j@ARROW@k@LARROW@l")]),
        inLine("EQ7f", [run("(a)[b]{c}|d|")]),
        inLine("EQ7g", [run("a;b:c!d?e'f@PRIME@g@INFINITY@h@PARTIAL@i@NABLA@j")]),
        ...fill("EQ7", 2),
        inLine("EQ8a", [run("x2"), new MathRun({ text: " ", literal: false }), run("a1")]),
        inLine("EQ8b", [run("x"), plain("a"), run("y")]),
        inLine("EQ8c", [run("(@MINUS@a)=@MINUS@b,@MINUS@c+@MINUS@d")]),
        inLine("EQ8d", [run("x"), new MathRun({ text: " if ", normalText: true }), run("y")]),
        inLine("EQ8e", [new MathFunction({ name: [plain("sin")], children: [run("x")] })]),
        inLine("EQ8f", [run("x y")]),
    ]),
    page("EQ9", [
        ...fill("EQ9a", 2, ARIAL),
        inLine("EQ9a", [run("x+y")], ARIAL),
        ...fill("EQ9b", 2, TIMES),
        inLine("EQ9b", [run("x+y")], TIMES),
        ...fill("EQ9c", 2, COURIER),
        inLine("EQ9c", [run("x+y")], COURIER),
        ...fill("EQ9d", 2),
        inLine("EQ9d", [run("x+y")], {}, "Big"),
        ...fill("EQ9e", 2),
        inLine("EQ9e", [run("@BIG@x+y")]),
        ...fill("EQ9f", 2, ARIAL),
        alone([run("x+y")], { style: "ArialBody" }),
        ...fill("EQ9g", 2, TIMES),
        alone([run("x+y")], { style: "TimesBody" }),
        ...fill("EQ9h", 2),
        alone([run("x+y")], { style: "Big" }),
        ...fill("EQ9i", 2),
        alone([run("x+y")], { spacing: { before: 240, after: 120 } }),
        ...fill("EQ9j", 2),
        alone([run("@PARA@x+y")]),
        ...fill("EQ9k", 2),
    ]),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "Big", name: "Big", basedOn: "Normal", run: { size: 32 } },
            { id: "ArialBody", name: "Arial Body", basedOn: "Normal", run: { font: "Arial", size: 22 } },
            { id: "TimesBody", name: "Times Body", basedOn: "Normal", run: { font: "Times New Roman", size: 24 } },
        ],
    },
    sections,
});

// The characters written for each marker in the equations' text, and the XML for those that aren't text
const CHARACTERS: Readonly<Record<string, string>> = {
    MINUS: "\u2212",
    TIMES: "\u00d7",
    DIVIDE: "\u00f7",
    PLUSMINUS: "\u00b1",
    MINUSPLUS: "\u2213",
    DOT: "\u22c5",
    STAR: "\u2217",
    RING: "\u2218",
    LE: "\u2264",
    GE: "\u2265",
    NE: "\u2260",
    APPROX: "\u2248",
    EQUIV: "\u2261",
    SIM: "\u223c",
    ARROW: "\u2192",
    LARROW: "\u2190",
    PRIME: "\u2032",
    INFINITY: "\u221e",
    PARTIAL: "\u2202",
    NABLA: "\u2207",
};

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    let xml = await zip.file("word/document.xml")!.async("string");
    xml = xml.replace(/@(\w+)@/g, (marker, name: string) => CHARACTERS[name] ?? marker);
    // EQ9e's run is 16 points
    xml = xml.replace(/<m:r><m:t>@BIG@x\+y<\/m:t><\/m:r>/, '<m:r><w:rPr><w:sz w:val="32"/></w:rPr><m:t>x+y</m:t></m:r>');
    // EQ9j's two equations, in one m:oMathPara
    xml = xml.replace(
        /<m:oMath><m:r><m:t>@PARA@x\+y<\/m:t><\/m:r><\/m:oMath>/,
        "<m:oMathPara><m:oMath><m:r><m:t>x+y</m:t></m:r></m:oMath><m:oMath><m:r><m:t>a=b</m:t></m:r></m:oMath></m:oMathPara>",
    );
    if (/@\w+@/.test(xml)) {
        throw new Error(`A marker is left: ${/@\w+@/.exec(xml)![0]}`);
    }
    zip.file("word/document.xml", xml);
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-equations2.docx", await zip.generateAsync({ type: "nodebuffer" }));
};

main();
