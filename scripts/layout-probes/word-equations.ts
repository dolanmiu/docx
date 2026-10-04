// Probes of how Word lays out equations (`m:oMath`, `m:oMathPara`), where docx/layout stops at "an equation": how wide
// Word makes an equation of letters, digits and operators in a line of text, and how tall it makes its line, in the line
// and on a line of its own, with and without fractions, scripts, roots and sums. Each line of text names its probe, as
// "EQ1a before", then the equation, then "after", so the reader finds the equation between them in pdftotext's HTML of a
// PDF saved from Word, and its letters, which Word draws in Cambria Math, in pdftocairo's SVG. Calibri 11, single spaced,
// no space before or after, on A4 with 1440 margins: 9026 twips of text, lines of 268.55 twips. Each page starts with a
// line naming the probes on it ("EQ1 above").
//
// EQ1a to EQ1z: equations in a line of text, one to a paragraph, of what docx's `MathRun` writes: a letter, letters and
//       operators, digits, Greek, brackets, each alphabet, the operators, plain and normal text, spaces, and a function
// EQ2a, EQ2b: an equation in a line of text, between lines of text: whether the line is taller
// EQ2c: an equation alone in its paragraph (`m:oMath`), as docx's math demos write them: whether Word shows it as a line of
//       its own, centred, and how tall the line is
// EQ2d: the same in `m:oMathPara`
// EQ3a to EQ3g: a superscript, a subscript, a fraction, a square root, a sum with its limits, a fraction in brackets, and a
//       subscript with a superscript, each in a line of text: how wide each is, and how tall its line
// EQ4a to EQ4g: the same, each alone in its paragraph
// EQ5:  a justified paragraph whose equation, a sum of 16 letters, goes past the end of its first line: whether Word breaks
//       it, and where
//
// What Word showed, in word-equations.pdf, saved from Word 16 for Mac on 2026-10-03, read with word-equations.py for its
// lines and word-equations2.py for where it drew each character:
//
// - EQ1: an equation of text is as wide as Cambria Math's characters, letters in italic (Unicode's mathematical italic
//   letters, h as Planck's constant), digits and operators upright, with the spaces TeX puts between atoms: 4 eighteenths
//   of an em either side of a binary operator, 5 either side of a relation, 3 after a comma and after a function's name,
//   and none beside brackets, and an italic letter's italic correction from Cambria Math after the last of a run of them.
//   A minus sign at the start is unary, with no space. A space typed in it is drawn as Cambria Math's. Every width is
//   Word's to within a tenth of a twip. "if" in normal text is drawn in the paragraph's font. Operators next to each other
//   aren't spaced as TeX spaces them: a minus sign before an equals sign has none (EQ1x)
// - EQ2: an equation of text in a line of Calibri 11 leaves the line as it is. One alone in its paragraph, `m:oMath` or
//   `m:oMathPara`, is centred on a line of its own as tall as a line of Cambria Math, 257.9 twips, without its paragraph
//   mark's Calibri
// - EQ3, EQ4: a fraction, a script, a root or a sum makes its line taller, by how Word builds it up
// - EQ5: an equation that goes past the end of its line is broken after an operator, its "+" ending the first line
//
// Usage: npm run run-ts -- scripts/layout-probes/word-equations.ts, which writes build/word-probes/word-equations.docx
// cspell:ignore pdftocairo
import * as fs from "fs";

import {
    AlignmentType,
    Document,
    type ISectionOptions,
    Math as Equation,
    MathFraction,
    MathFunction,
    MathRadical,
    MathRoundBrackets,
    MathRun,
    MathSubScript,
    MathSubSuperScript,
    MathSum,
    MathSuperScript,
    Packer,
    Paragraph,
    TextRun,
} from "docx";

type MathChild = ConstructorParameters<typeof Equation>[0]["children"][number];

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A line of text with an equation in it, between its probe's name and "after" */
const inLine = (probe: string, children: readonly MathChild[]): Paragraph =>
    new Paragraph({ children: [new TextRun(`${probe} before `), new Equation({ children: [...children] }), new TextRun(" after")] });

/** A paragraph of only an equation, which Word shows on a line of its own */
const alone = (children: readonly MathChild[]): Paragraph => new Paragraph({ children: [new Equation({ children: [...children] })] });

/** A page of probes, with a line naming them at its top */
const page = (name: string, children: readonly Paragraph[]): ISectionOptions => ({ children: [line(`${name} above`), ...children] });

const run = (text: string): MathRun => new MathRun(text);

// The equations of EQ1, by the letter of their probe
const RUNS: readonly (readonly [string, readonly MathChild[]])[] = [
    ["a", [run("x")]],
    ["b", [run("a+b=c")]],
    ["c", [run("2x+1")]],
    ["d", [run("xy")]],
    ["e", [run("f(x)")]],
    ["f", [run("a\u2212b")]],
    ["g", [run("a\u00d7b")]],
    ["h", [run("a/b")]],
    ["i", [run("123.45")]],
    ["j", [run("\u03b1+\u03b2")]],
    ["k", [run("x,y")]],
    ["l", [run("(a+b)")]],
    ["m", [run("a<b")]],
    ["n", [run("\u2212x")]],
    ["o", [run("ABC")]],
    ["p", [run("h")]],
    ["q", [new MathRun({ text: "a+b", style: "plain" })]],
    ["r", [new MathRun({ text: "if ", normalText: true }), run("x")]],
    ["s", [run("0123456789")]],
    ["t", [run("abcdefghijklm")]],
    ["u", [run("nopqrstuvwxyz")]],
    ["v", [run("ABCDEFGHIJKLM")]],
    ["w", [run("NOPQRSTUVWXYZ")]],
    ["x", [run("+\u2212=<>\u00b1\u00d7\u00f7\u2264\u2265\u2260")]],
    ["y", [run("x + y")]],
    ["z", [new MathFunction({ name: [run("sin")], children: [run("x")] })]],
];

// The equations of EQ3 and EQ4, by the letter of their probe
const STRUCTURES: readonly (readonly [string, readonly MathChild[]])[] = [
    ["a", [new MathSuperScript({ children: [run("x")], superScript: [run("2")] })]],
    ["b", [new MathSubScript({ children: [run("x")], subScript: [run("i")] })]],
    ["c", [new MathFraction({ numerator: [run("1")], denominator: [run("2")] })]],
    ["d", [new MathRadical({ children: [run("2")] })]],
    ["e", [new MathSum({ children: [run("i")], subScript: [run("i=1")], superScript: [run("n")] })]],
    ["f", [new MathRoundBrackets({ children: [new MathFraction({ numerator: [run("a")], denominator: [run("b")] })] })]],
    ["g", [new MathSubSuperScript({ children: [run("x")], subScript: [run("i")], superScript: [run("2")] })]],
];

const sections: ISectionOptions[] = [
    page("EQ1", [...RUNS.map(([letter, children]) => inLine(`EQ1${letter}`, children)), ...fill("EQ1", 3)]),
    page("EQ2", [
        ...fill("EQ2a", 3),
        inLine("EQ2a", [run("x")]),
        ...fill("EQ2b", 3),
        inLine("EQ2b", [run("a+b=c")]),
        ...fill("EQ2c", 3),
        alone([run("a+b=c")]),
        ...fill("EQ2d", 3),
        new Paragraph({ children: [new Equation({ children: [run("a+b=c")] })] }),
        ...fill("EQ2e", 3),
    ]),
    page(
        "EQ3",
        STRUCTURES.flatMap(([letter, children]) => [...fill(`EQ3${letter}`, 2), inLine(`EQ3${letter}`, children)]),
    ),
    page(
        "EQ4",
        STRUCTURES.flatMap(([letter, children]) => [...fill(`EQ4${letter}`, 2), alone(children)]),
    ),
    page("EQ5", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                new TextRun(`EQ5 ${prose(13)} `),
                new Equation({ children: [run("a+b+c+d+e+f+g+h+i+j+k+l+m+n+o+p")] }),
                new TextRun(` ${prose(60)}`),
            ],
        }),
        ...fill("EQ5", 3),
    ]),
];

// EQ2d's equation, in `m:oMathPara`, which docx doesn't write
const MATH_PARAGRAPH = "EQ2d";

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const written = await zip.file("word/document.xml")!.async("string");
    // The equation after EQ2d's lines is put in `m:oMathPara`
    const marker = new RegExp(`(${MATH_PARAGRAPH} fill 3</w:t></w:r></w:p><w:p>)(<m:oMath>.*?</m:oMath>)`);
    if (!marker.test(written)) {
        throw new Error(`No equation after ${MATH_PARAGRAPH}'s lines`);
    }
    zip.file("word/document.xml", written.replace(marker, "$1<m:oMathPara>$2</m:oMathPara>"));
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-equations.docx", await zip.generateAsync({ type: "nodebuffer" }));
};

main();
