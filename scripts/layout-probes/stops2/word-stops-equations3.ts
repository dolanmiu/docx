// cspell:ignore mathbb overbrace underbrace sqrt lfloor rfloor cdots otimes subseteq supset notin Leftrightarrow
// cspell:ignore Longrightarrow setminus propto phant transp aln strikeH zeroWid zeroAsc zeroDesc hideTop
/**
 * Probes of what Word's PDFs of word-stops-equations2.ts left open, where docx/layout still stops at an equation Word builds
 * up, or at a size Word's PDFs leave between two:
 *
 * - EQ46: roots over radicands with a descender, whose sign is one of two sizes as Word takes a radicand to be at least
 *   1242 to 1260 of Cambria Math's units tall ("a root whose sign's size Word's PDFs leave between two")
 * - EQ47: brackets around parts that need a share of 0.816 to 0.840 of twice their reach from the maths axis ("brackets
 *   whose size Word's PDFs leave between two")
 * - EQ48: accents over parts whose share, between 0.901 and 0.959, decides their size ("an accent whose size Word's PDFs
 *   leave between two")
 * - EQ49: braces over and under parts whose share, between 0.921 and 1.086, decides their size ("a brace whose size Word's
 *   PDFs leave between two")
 * - EQ50: superscripts in a sum's, a limit's and an integral's lower limit, which TeX cramps ("a superscript in a lower
 *   limit")
 * - EQ51: fractions, sums and functions beside brackets and bars ("an equation with a fraction, a sum or a function beside
 *   a bracket or bar")
 * - EQ52: symbols Word hasn't been seen beside letters: logic, set operators, arrows, and others
 * - EQ53: a sum in a script's script, and a fraction in a displayed script's script
 * - EQ54: equation arrays with no ampersand in their rows, two, or an alignment mark (`m:aln`)
 * - EQ55: boxes with a side hidden or struck through, phantoms that take less than their part's room, and pre-scripts
 *   (`m:sPre`)
 *
 * word-stops-equation-small2.docx: the same sums, integrals and fractions as word-stops-equation-small.docx, with the
 * document's maths settings putting fractions small (`m:smallFrac`), but leaving displayed equations' defaults on (EQ56).
 *
 * Each probe is the equation in a line of text, "EQ46a ... after", and on a line of its own in `m:oMathPara`, between a
 * line above and a line below, as in word-stops-equations2.ts. Calibri 11 on A4 with inch margins; equations in Cambria
 * Math 11.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-equations3.ts [folder]
 */
import { Math as Equation, Paragraph, TextRun } from "docx";

import { latexToMath } from "../../../src/math";

import { type Child, PAGE, group, line, newPage, probe, write } from "./kit";

const name = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnopqrstuvwxyz"[index]}`;
const equation = (latex: string): Equation => new Equation({ children: latexToMath(latex) });
/** The equation in a line of text, and on a line of its own between lines above and below it */
const both = (probe: string, latex: string): Child[] => [
    ...group(probe, [new Paragraph({ children: [new TextRun(`${probe} `), equation(latex), new TextRun(" after")] })]),
    ...group(`${probe}d`, [new Paragraph({ children: [new TextRun("@@PARA@@"), equation(latex)] })]),
];

const CASES: readonly (readonly [string, readonly string[]])[] = [
    ["EQ46", ["\\sqrt{p}", "\\sqrt{q}", "\\sqrt{\\rho}", "\\sqrt{\\eta}", "\\sqrt{\\mu}", "\\sqrt{\\chi}", "\\sqrt{\\gamma}", "\\sqrt{y}"]],
    [
        "EQ47",
        [
            "\\left( a^{a^{t}} \\right)",
            "\\left[ a^{a^{t}} \\right]",
            "\\left\\{ a^{a^{t}} \\right\\}",
            "\\left| a^{a^{t}} \\right|",
            "\\left( x^{a^{t}} \\right)",
            "\\left( A^{a^{t}} \\right)",
        ],
    ],
    [
        "EQ48",
        [
            "\\hat{d}",
            "\\hat{g}",
            "\\hat{u}",
            "\\hat{T}",
            "\\hat{W}",
            "\\hat{Z}",
            "\\tilde{d}",
            "\\tilde{t}",
            "\\tilde{I}",
            "\\hat{a^2}",
            "\\hat{H_i}",
        ],
    ],
    [
        "EQ49",
        [
            "\\overbrace{cc}^{n}",
            "\\overbrace{ee}^{n}",
            "\\overbrace{mm}^{n}",
            "\\overbrace{rr}^{n}",
            "\\overbrace{ww}^{n}",
            "\\overbrace{DD}^{n}",
            "\\overbrace{OO}^{n}",
            "\\underbrace{cc}_{n}",
        ],
    ],
    ["EQ50", ["\\sum_{i^2} x", "\\lim_{x^2} y", "\\int_{a^2}^{b} x"]],
    [
        "EQ51",
        [
            "\\frac{a}{b}(x)",
            "(x)\\frac{a}{b}",
            "\\frac{a}{b}\\sin x",
            "(a)\\sin x",
            "\\frac{a}{b}|x|",
            "\\frac{a}{b}\\sum_i a_i",
            "(a)\\sum_i a_i",
        ],
    ],
    [
        "EQ52",
        [
            "a\\lor b",
            "a\\otimes b",
            "A\\subseteq B",
            "A\\supset B",
            "a\\notin B",
            "\\exists x",
            "a\\Leftrightarrow b",
            "a\\leftarrow b",
            "f\\circ g",
            "a\\cdots b",
            "\\lfloor x\\rfloor",
            "a\\Longrightarrow b",
            "a\\setminus b",
            "a\\propto b",
        ],
    ],
    ["EQ53", ["x^{y^{\\sum a}}", "x^{y^{\\frac{a}{b}}}"]],
];

// EQ54 and EQ55: what docx doesn't write, as Office Math markup, in place of a placeholder run
const run = (text: string, properties = ""): string => `<m:r>${properties ? `<m:rPr>${properties}</m:rPr>` : ""}<m:t>${text}</m:t></m:r>`;
const row = (...runs: readonly string[]): string => `<m:e>${runs.join("")}</m:e>`;
const RAW: readonly (readonly [string, string])[] = [
    ["EQ54a", `<m:eqArr>${row(run("a=b"))}${row(run("c=d"))}</m:eqArr>`],
    ["EQ54b", `<m:eqArr>${row(run("a&amp;=b&amp;c"))}${row(run("dd&amp;=e&amp;f"))}</m:eqArr>`],
    ["EQ54c", `<m:eqArr>${row(run("a"), run("=b", "<m:aln/>"))}${row(run("cc"), run("=d", "<m:aln/>"))}</m:eqArr>`],
    ["EQ55a", `<m:borderBox><m:borderBoxPr><m:hideTop m:val="1"/></m:borderBoxPr>${row(run("x"))}</m:borderBox>`],
    ["EQ55b", `<m:borderBox><m:borderBoxPr><m:strikeH m:val="1"/></m:borderBoxPr>${row(run("x"))}</m:borderBox>`],
    ["EQ55c", `<m:phant><m:phantPr><m:show m:val="0"/><m:zeroWid m:val="1"/></m:phantPr>${row(run("x"))}</m:phant>${run("y")}`],
    ["EQ55d", `<m:phant><m:phantPr><m:show m:val="0"/><m:zeroAsc m:val="1"/></m:phantPr>${row(run("A"))}</m:phant>${run("y")}`],
    ["EQ55e", `<m:phant><m:phantPr><m:show m:val="0"/><m:zeroDesc m:val="1"/></m:phantPr>${row(run("g"))}</m:phant>${run("y")}`],
    ["EQ55f", `<m:phant><m:phantPr><m:transp m:val="1"/></m:phantPr>${row(run("+"))}</m:phant>${run("y")}`],
    ["EQ55g", `<m:sPre><m:sub>${run("1")}</m:sub><m:sup>${run("2")}</m:sup>${row(run("x"))}</m:sPre>`],
];

const children: Child[] = [
    line("EQ above"),
    ...CASES.flatMap(([prefix, cases]) => [newPage(), ...cases.flatMap((latex, index) => both(name(prefix, index), latex))]),
    newPage(),
    ...RAW.flatMap(([probe]) => [
        ...group(probe, [new Paragraph({ children: [new TextRun(`${probe} `), new TextRun(`@@RAW_${probe}@@`), new TextRun(" after")] })]),
        ...group(`${probe}d`, [new Paragraph({ children: [new TextRun(`@@RAWPARA_${probe}@@`)] })]),
    ]),
    ...probe("EQ end", []),
];

const MATHPARA = (xml: string): string => `<m:oMathPara>${xml}</m:oMathPara>`;
const mathPara = (parts: Map<string, string>): void => {
    const text = parts.get("word/document.xml")!;
    parts.set(
        "word/document.xml",
        text.replace(/<w:r><w:t xml:space="preserve">@@PARA@@<\/w:t><\/w:r>(<m:oMath>.*?<\/m:oMath>)/g, (_, found: string) =>
            MATHPARA(found),
        ),
    );
};
const raw = (parts: Map<string, string>): void => {
    const text = parts.get("word/document.xml")!;
    parts.set(
        "word/document.xml",
        RAW.reduce(
            (written, [probe, xml]) =>
                written
                    .replace(`<w:r><w:t xml:space="preserve">@@RAW_${probe}@@</w:t></w:r>`, `<m:oMath>${xml}</m:oMath>`)
                    .replace(`<w:r><w:t xml:space="preserve">@@RAWPARA_${probe}@@</w:t></w:r>`, MATHPARA(`<m:oMath>${xml}</m:oMath>`)),
            text,
        ),
    );
};

await write({ name: "word-stops-equations3", sections: [{ properties: PAGE, children }], injections: [mathPara, raw] });

// EQ56: small fractions with displayed equations' defaults on
const settingsChildren: Child[] = [
    line("EQ56 above"),
    ...both("EQ56a", "\\sum_{i=1}^{n} i"),
    ...both("EQ56b", "\\int_0^1 x"),
    ...both("EQ56c", "\\frac{a}{b}"),
];
// The settings, whose children must be in the order shared-math.xsd's CT_MathPr has them
const mathPr = (xml: string) => (parts: Map<string, string>) => {
    const text = parts.get("word/settings.xml")!;
    const withNamespace = text.includes('xmlns:m="')
        ? text
        : text.replace("<w:settings ", '<w:settings xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
    parts.set("word/settings.xml", withNamespace.replace("</w:settings>", `<m:mathPr>${xml}</m:mathPr></w:settings>`));
};
await write({
    name: "word-stops-equation-small2",
    sections: [{ properties: PAGE, children: settingsChildren }],
    injections: [mathPara, mathPr('<m:mathFont m:val="Cambria Math"/><m:smallFrac m:val="1"/>')],
});
