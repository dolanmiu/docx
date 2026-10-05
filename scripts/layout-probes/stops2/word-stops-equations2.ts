// cspell:ignore binom mathbb mathrm boxed aligned overbrace underbrace phantom sqrt
/**
 * Probes of what Word's PDF of word-stops-equations.ts left open, where docx/layout still stops at an equation Word builds
 * up, or lays one out within a range Word's PDF gave rather than at a rule:
 *
 * - EQ30: scripts and fractions in paragraphs of 9, 10, 10.5, 12, 14 and 16 points, where 73% and 60% of the size round
 *   to more than one half or quarter point ("an equation Word builds up in a size whose scripts' size Word hasn't shown")
 * - EQ31: superscripts in cramped parts, a denominator, a root, a subscript, under a bar and an accent ("a superscript in a
 *   cramped part of an equation")
 * - EQ32: fractions, brackets, sums and functions directly beside letters, digits, punctuation and each other, where TeX
 *   puts a thin space ("an equation with a fraction, brackets, a sum or a function beside a letter or digit")
 * - EQ33: matrices whose rows are too tall to be single spaced, with descenders, scripts and fractions in their cells, for
 *   the gap Word leaves between them, which EQ15b put between 613 and 697 of Cambria Math's units
 * - EQ34: brackets around parts whose size EQ10e, EQ14 and EQ15 leave between two of Cambria Math's ("brackets whose size
 *   Word's PDFs leave between two"), whose share of the parts' height they settle
 * - EQ35: roots over radicands of other heights and depths, where where Word draws the sign isn't followed to within a
 *   tenth of a point (EQ12d, EQ12ad)
 * - EQ36: boxes (`m:borderBox`), whose border Word puts further below its part than above
 * - EQ37: what Word builds up that EQ10 to EQ18 didn't have: a fraction beside other parts in a numerator, a fraction in a
 *   displayed script, a sum in a script, pre-scripts (`m:sPre`), an equation array, a phantom, and braces of their own sizes
 * - EQ38: an equation Word builds up displayed (`m:oMathPara`) beside text, before and after it, and alone after its list's
 *   number
 * - EQ39: symbols Word's PDF showed only next to themselves (EQ27), beside letters: arrows, set operators, logic, products,
 *   and two operators at the start
 * - EQ40: equations too long for their line: in a line of text, broken at a relation, with fractions, and in a justified
 *   paragraph; displayed, with fractions and at relations
 * - EQ41: normal text (`m:nor`) in a fraction, a script, and displayed, and in a run of its own font
 *
 * word-stops-equation-limits.docx and word-stops-equation-small.docx: the same sums, integrals and fractions with the
 * document's maths settings putting sums' limits beside them and integrals' under and over them (EQ42), and displayed
 * fractions small, displayed equations not displayed (EQ43). word-stops-equation-spacing.docx: equations side by side in
 * one `m:oMathPara`, which EQ25c put in a line with nothing between them, with the maths settings' space between equations
 * (`m:interSp`), and one alone, which EQS1 showed Word leaves it out of (EQ44).
 *
 * Each probe is the equation in a line of text, "EQ30a ... after", and on a line of its own in `m:oMathPara`, between a
 * line above and a line below, as in word-stops-equations.ts. Calibri 11 on A4 with inch margins; equations in Cambria
 * Math 11, but for EQ30's.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-equations2.ts [folder]
 */
import { AlignmentType, LevelFormat, Math as Equation, Paragraph, TextRun } from "docx";

import { latexToMath } from "../../../src/math";

import { type Child, PAGE, group, line, newPage, probe, write } from "./kit";

const name = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnopqrstuvwxyz"[index]}`;
const equation = (latex: string): Equation => new Equation({ children: latexToMath(latex) });
/** The equation in a line of text, and on a line of its own between lines above and below it */
const both = (probe: string, latex: string, display = true, style?: string): Child[] => [
    ...group(probe, [
        new Paragraph({ ...(style ? { style } : {}), children: [new TextRun(`${probe} `), equation(latex), new TextRun(" after")] }),
    ]),
    ...(display
        ? group(`${probe}d`, [new Paragraph({ ...(style ? { style } : {}), children: [new TextRun("@@PARA@@"), equation(latex)] })])
        : []),
];

// EQ30: the sizes, and the equations in each
const SIZES = [18, 20, 21, 24, 28, 32];
const SIZED = ["x^2", "x^{2^{3}}", "\\frac{a}{b}"];

const CASES: readonly (readonly [string, readonly string[], boolean])[] = [
    ["EQ31", ["\\frac{1}{x^2}", "\\sqrt{x^2}", "x_{a^2}", "\\overline{x^2}", "\\hat{x^2}", "\\frac{1}{e^{x^2}}"], true],
    [
        "EQ32",
        [
            "2\\frac{a}{b}",
            "\\frac{a}{b}x",
            "x\\left(a+b\\right)",
            "\\left(a\\right)\\left(b\\right)",
            "\\left(a\\right)x",
            "2\\sum_{i} a_i",
            "x\\sin y",
            "\\sin x\\cos y",
            "\\frac{a}{b}\\frac{c}{d}",
            "a,\\frac{1}{2}",
            "\\frac{1}{2},a",
            "\\sum_{i} a_i\\sum_{j} b_j",
        ],
        true,
    ],
    [
        "EQ33",
        [
            "\\begin{pmatrix} g & y \\\\ A & B \\end{pmatrix}",
            "\\begin{pmatrix} a & b \\\\ \\frac{1}{2} & d \\end{pmatrix}",
            "\\begin{pmatrix} a_1 & b_2 \\\\ c_3 & d_4 \\end{pmatrix}",
            "\\begin{pmatrix} p & q \\\\ f & h \\\\ j & k \\end{pmatrix}",
            "\\begin{pmatrix} x_{i_j} & y \\\\ \\frac{a}{b} & z \\end{pmatrix}",
        ],
        true,
    ],
    [
        "EQ34",
        [
            "\\left( x_i^{2^3} \\right)",
            "\\left( A^{B^C} \\right)",
            "\\left( x_{i_j} \\right)",
            "\\left[ x_{i_j} \\right]",
            "\\left\\{ A^{B^C} \\right\\}",
            "\\left( \\sqrt{\\frac{a}{b}} \\right)",
            "\\left( \\sum_i a \\right)",
            "\\left| \\frac{a}{b} \\right|",
        ],
        true,
    ],
    [
        "EQ35",
        [
            "\\sqrt{g}",
            "\\sqrt{A}",
            "\\sqrt{x_i}",
            "\\sqrt{a_{i_j}}",
            "\\sqrt{\\frac{1}{\\frac{1}{x}}}",
            "\\sqrt{\\sum_i a}",
            "\\sqrt{y_1}",
            "\\sqrt{\\frac{a}{b}+c}",
        ],
        true,
    ],
    ["EQ36", ["\\boxed{x}", "\\boxed{x_i}", "\\boxed{\\frac{a}{b}}", "\\boxed{g}", "\\boxed{A}"], true],
    [
        "EQ37",
        [
            "\\frac{1+\\frac{1}{x}}{2}",
            "e^{\\frac{a}{b}}",
            "x^{\\sum_i a}",
            "\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}",
            "\\phantom{x}y",
            "\\underbrace{x}_{n}",
            "\\overbrace{xyz}^{n}",
            "\\underbrace{a+b+c+d+e+f+g+h}_{n}",
        ],
        true,
    ],
    [
        "EQ39",
        [
            "a\\to b",
            "a\\Rightarrow b",
            "a\\cup b",
            "a\\cap b",
            "a\\in B",
            "A\\subset B",
            "p\\land q",
            "\\forall x",
            "a\\cdot b",
            "-+a",
            "a+--b",
            "a\\times-b",
            "a\\oplus b",
            "x\\mapsto y",
            "\\neg p",
        ],
        false,
    ],
    ["EQ41", ["\\frac{\\text{ab}}{c}", "x^{\\text{ab}}", "x\\text{ if }y"], true],
];

const atoms = (count: number, operator = "+"): string =>
    Array.from({ length: count }, (_, index) => "abcdefghijklmnopqrstuvwxyz"[index % 26]).join(operator);
const fractions = (count: number): string =>
    Array.from({ length: count }, (_, index) => `\\frac{${"abcdefghijklmnopqrstuvwxyz"[index % 26]}}{2}`).join("+");

const children: Child[] = [
    line("EQ above"),
    newPage(),
    ...SIZES.flatMap((size, sizeIndex) =>
        SIZED.flatMap((latex, index) => both(`EQ30${"abcdef"[sizeIndex]}${index + 1}`, latex, false, `Size${size}`)),
    ),
    ...CASES.flatMap(([prefix, cases, display]) => [
        newPage(),
        ...cases.flatMap((latex, index) => both(name(prefix, index), latex, display)),
    ]),
    newPage(),
    ...group("EQ38a", [new Paragraph({ children: [new TextRun("EQ38a text before "), new TextRun("@@MATHPARA_a@@")] })]),
    ...group("EQ38b", [new Paragraph({ children: [new TextRun("@@MATHPARA_b@@"), new TextRun(" EQ38b text after")] })]),
    ...group("EQ38c", [new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [equation("\\frac{a}{b}")] })]),
    newPage(),
    ...group("EQ40a", [new Paragraph({ children: [new TextRun("EQ40a "), equation(atoms(40, "=")), new TextRun(" after")] })]),
    ...group("EQ40b", [new Paragraph({ children: [new TextRun("EQ40b "), equation(fractions(30)), new TextRun(" after")] })]),
    ...group("EQ40c", [
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [new TextRun("EQ40c "), equation(atoms(50)), new TextRun(" after")],
        }),
    ]),
    ...group("EQ40d", [new Paragraph({ children: [new TextRun("@@PARA@@"), equation(fractions(40))] })]),
    ...group("EQ40e", [new Paragraph({ children: [new TextRun("@@PARA@@"), equation(atoms(60, "="))] })]),
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
const fraction = "<m:oMath><m:f><m:num><m:r><m:t>a</m:t></m:r></m:num><m:den><m:r><m:t>b</m:t></m:r></m:den></m:f></m:oMath>";
const SIZE_STYLES = SIZES.map((size) => ({ id: `Size${size}`, name: `Size${size}`, run: { size } }));

await write({
    name: "word-stops-equations2",
    sections: [{ properties: PAGE, children }],
    options: {
        styles: { paragraphStyles: SIZE_STYLES },
        numbering: {
            config: [
                {
                    reference: "numbers",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                        },
                    ],
                },
            ],
        },
    },
    injections: [
        mathPara,
        // EQ38: displayed equations Word builds up, beside text
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                text
                    .replace(/<w:r><w:t xml:space="preserve">@@MATHPARA_a@@<\/w:t><\/w:r>/, MATHPARA(fraction))
                    .replace(/<w:r><w:t xml:space="preserve">@@MATHPARA_b@@<\/w:t><\/w:r>/, MATHPARA(fraction)),
            );
        },
    ],
});

// EQ42 and EQ43: the documents' maths settings
const settingsChildren = (prefix: string): Child[] => [
    line(`${prefix} above`),
    ...both(`${prefix}a`, "\\sum_{i=1}^{n} i"),
    ...both(`${prefix}b`, "\\int_0^1 x"),
    ...both(`${prefix}c`, "\\frac{a}{b}"),
];
// The settings, whose children must be in the order shared-math.xsd's CT_MathPr has them
const mathPr = (xml: string) => (parts: Map<string, string>) => {
    const text = parts.get("word/settings.xml")!;
    const withNamespace = text.includes('xmlns:m="')
        ? text
        : text.replace("<w:settings ", '<w:settings xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
    parts.set("word/settings.xml", withNamespace.replace("</w:settings>", `<m:mathPr>${xml}</m:mathPr></w:settings>`));
};
// The equations' own limits' places are left to the settings
const unplaced = (parts: Map<string, string>): void => {
    const text = parts.get("word/document.xml")!;
    parts.set("word/document.xml", text.replace(/<m:limLoc m:val="[^"]*"\/>/g, ""));
};
await write({
    name: "word-stops-equation-limits",
    sections: [{ properties: PAGE, children: settingsChildren("EQ42") }],
    injections: [mathPara, unplaced, mathPr('<m:mathFont m:val="Cambria Math"/><m:intLim m:val="undOvr"/><m:naryLim m:val="subSup"/>')],
});
await write({
    name: "word-stops-equation-small",
    sections: [{ properties: PAGE, children: settingsChildren("EQ43") }],
    injections: [mathPara, mathPr('<m:mathFont m:val="Cambria Math"/><m:smallFrac m:val="1"/><m:dispDef m:val="0"/>')],
});

// EQ44: equations side by side in one m:oMathPara, and one alone, with space between equations in the settings
const run = (text: string): string => `<m:oMath><m:r><m:t>${text}</m:t></m:r></m:oMath>`;
const SPACED: readonly (readonly [string, string])[] = [
    ["EQ44a", run("x+y=z") + run("x+y=z")],
    ["EQ44b", fraction + run("x+y=z")],
    ["EQ44c", run("a") + run("b") + run("c")],
    ["EQ44d", run("x+y=z")],
];
await write({
    name: "word-stops-equation-spacing",
    sections: [
        {
            properties: PAGE,
            children: [
                line("EQ44 above"),
                ...SPACED.flatMap(([probe]) => group(probe, [new Paragraph({ children: [new TextRun(`@@SPACED_${probe}@@`)] })])),
            ],
        },
    ],
    injections: [
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                SPACED.reduce(
                    (written, [probe, xml]) =>
                        written.replace(`<w:r><w:t xml:space="preserve">@@SPACED_${probe}@@</w:t></w:r>`, MATHPARA(xml)),
                    text,
                ),
            );
        },
        mathPr('<m:mathFont m:val="Cambria Math"/><m:interSp m:val="240"/>'),
    ],
});
