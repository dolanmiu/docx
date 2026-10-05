/**
 * Probes of equations (`m:oMath`) docx/layout stops at, after #3675 laid out equations of text (`word-equations.docx`
 * EQ1 to EQ5, `word-equations2.docx` EQ6 to EQ9). The math demos (math/math, math/latex, math/matrices-and-alignment)
 * stop at the first:
 *
 * - "an equation with a fraction, a script, a root or another part Word builds up" (EQ3 and EQ4 had a few)
 * - "an equation in normal text, another alphabet or bold", "an equation whose text has formatting of its own"
 * - "a character in an equation whose width isn't known"
 * - "an equation with operators next to each other, which Word spaces in a way not yet followed" (EQ1x)
 * - "a full stop in an equation other than a decimal point", "an empty equation", "an equation whose runs are of
 *   different sizes", "an italic sign in an equation before what isn't ordinary"
 * - "an equation that doesn't fit on its line" (EQ5: Word breaks it after an operator), "a paragraph of more than one
 *   equation", "an equation displayed (`m:oMathPara`) beside text in its paragraph", "an equation alone in its paragraph
 *   beside another, or after its list's number", "an equation" (one outside a paragraph)
 *
 * Each case is an equation in a line of text, "EQ1a ... after", whose "after" starts where the equation ends, between a
 * line above and a line below whose distance gives the line's height; and, where it is built up, the same equation alone
 * on a line of its own in `m:oMathPara`, "EQ1a display", between "EQ1a display above" and "EQ1a display below". The
 * equations are written from LaTeX by docx/math's latexToMath, the way docx's math demos write them. Calibri 11 on A4
 * with inch margins; equations in Cambria Math 11.
 *
 * EQ10a to EQ10f: fractions: \frac{a}{b}, \frac{a+b}{c+d}, \frac{1}{\frac{1}{x}}, \frac{\frac{a}{b}}{c}, \binom{n}{k},
 *   \frac{x^2}{\sqrt{y}}
 * EQ11a to EQ11f: scripts: x^2, x_i, x_i^2, x^{2^{3}}, {}^{14}_{6}C, e^{-x^2}
 * EQ12a to EQ12d: roots: \sqrt{x}, \sqrt{x+y}, \sqrt[3]{x}, \sqrt{\frac{a}{b}}
 * EQ13a to EQ13g: large operators: \sum_{i=1}^{n} i, \int_0^1 x\,dx, \prod_{k} a_k, \oint_C F, \sum a, \int f,
 *   \sum\nolimits_{k=1}^{n} a_k
 * EQ14a to EQ14e: brackets that grow: \left( \frac{a}{b} \right), \left[ x^2 \right], \left| x \right|,
 *   \left\{ \frac{1}{2} \right\}, \left\langle \psi \middle| \phi \right\rangle
 * EQ15a to EQ15c: matrices and cases: a 2 by 2 and a 3 by 3 pmatrix, and cases of two lines
 * EQ16a to EQ16f: accents and bars: \hat{x}, \bar{x}, \vec{v}, \overline{AB}, \underline{x}, \tilde{n}
 * EQ17a to EQ17d: functions and limits: \sin x, \log_2 n, \lim_{x \to 0} f(x), \max_{i} a_i
 * EQ18a to EQ18c: \underbrace{a+b}_{c}, \overbrace{a+b}^{c}, \boxed{E=mc^2}
 * EQ19a to EQ19g: normal text and other alphabets: x \text{ if } y, \mathbb{R}, \mathcal{L}, \mathfrak{g}, \mathbf{F},
 *   \boldsymbol{\alpha}, \mathrm{d}x
 * EQ20a to EQ20h: operators next to each other: a-=b, a+-b, a\le-b, (-x), x)+y, a==b, a,-b, a|+b
 * EQ21a to EQ21c: full stops that aren't decimal points: x.y, 1.2.3, a.\,b
 * EQ22: an equation whose runs are of 11 and 16 points (w:sz in one m:r)
 * EQ23: an empty equation (`<m:oMath/>`) between words
 * EQ28a, EQ28b: an equation whose run is bold (a), and spaced out 2 points (b) ("an equation whose text has formatting of
 *   its own")
 * EQ24a to EQ24c: italic signs before what isn't ordinary: \partial+x, \nabla=0, \partial(x)
 * EQ25a, EQ25b: m:oMathPara beside text in its paragraph, before and after it
 * EQ25c: two equations in one m:oMathPara; EQ25d: an equation alone in a numbered paragraph (a list's number before it)
 * EQ26a to EQ26d: equations of 30, 50, 80 and 120 atoms (a+b+c+...) in a line of text, which don't fit on it
 * EQ26e, EQ26f: the 80 and 120 alone in m:oMathPara
 * EQ27a to EQ27k: ten of each character Word draws from Cambria Math that docx/layout's equation widths don't have, as
 *   one equation each line: arrows, relations, set operators, logic, products and other binary operators, the
 *   double-struck capitals, ℏ, ℓ, ∅, ∞-like symbols, primes and Greek variants
 *
 * word-stops-equation-settings.docx: the same EQ10a and EQ26c with the document's maths settings (`m:mathPr`) giving
 * margins of 720 left and right to equations on lines of their own, 240 before and after them (EQS1), and a maths font of
 * Cambria Math named otherwise, "Latin Modern Math", which Word doesn't have (EQS2, a document of its own)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-equations.ts [folder]
 */
// cspell:ignore binom nolimits mathbb mathfrak mathbf mathrm nabla
import { LevelFormat, Math as Equation, Paragraph, TextRun } from "docx";

import { latexToMath } from "../../../src/math";

import { type Child, PAGE, group, line, newPage, probe, write } from "./kit";

type Case = readonly [string, string];
const name = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnop"[index]}`;
const equation = (latex: string): Equation => new Equation({ children: latexToMath(latex) });
/** The equation in a line of text, and on a line of its own between lines above and below it */
const both = (probe: string, latex: string, display = true): Child[] => [
    ...group(probe, [new Paragraph({ children: [new TextRun(`${probe} `), equation(latex), new TextRun(" after")] })]),
    ...(display ? group(`${probe}d`, [new Paragraph({ children: [new TextRun(`@@PARA@@`), equation(latex)] })]) : []),
];

const BUILT: readonly (readonly [string, readonly string[]])[] = [
    [
        "EQ10",
        [
            "\\frac{a}{b}",
            "\\frac{a+b}{c+d}",
            "\\frac{1}{\\frac{1}{x}}",
            "\\frac{\\frac{a}{b}}{c}",
            "\\binom{n}{k}",
            "\\frac{x^2}{\\sqrt{y}}",
        ],
    ],
    ["EQ11", ["x^2", "x_i", "x_i^2", "x^{2^{3}}", "{}^{14}_{6}C", "e^{-x^2}"]],
    ["EQ12", ["\\sqrt{x}", "\\sqrt{x+y}", "\\sqrt[3]{x}", "\\sqrt{\\frac{a}{b}}"]],
    [
        "EQ13",
        ["\\sum_{i=1}^{n} i", "\\int_0^1 x\\,dx", "\\prod_{k} a_k", "\\oint_C F", "\\sum a", "\\int f", "\\sum\\nolimits_{k=1}^{n} a_k"],
    ],
    [
        "EQ14",
        [
            "\\left( \\frac{a}{b} \\right)",
            "\\left[ x^2 \\right]",
            "\\left| x \\right|",
            "\\left\\{ \\frac{1}{2} \\right\\}",
            "\\left\\langle \\psi \\middle| \\phi \\right\\rangle",
        ],
    ],
    [
        "EQ15",
        [
            "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
            "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}",
            "f(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\le 0 \\end{cases}",
        ],
    ],
    ["EQ16", ["\\hat{x}", "\\bar{x}", "\\vec{v}", "\\overline{AB}", "\\underline{x}", "\\tilde{n}"]],
    ["EQ17", ["\\sin x", "\\log_2 n", "\\lim_{x \\to 0} f(x)", "\\max_{i} a_i"]],
    ["EQ18", ["\\underbrace{a+b}_{c}", "\\overbrace{a+b}^{c}", "\\boxed{E=mc^2}"]],
];
const TEXT: readonly (readonly [string, readonly string[]])[] = [
    ["EQ19", ["x \\text{ if } y", "\\mathbb{R}", "\\mathcal{L}", "\\mathfrak{g}", "\\mathbf{F}", "\\boldsymbol{\\alpha}", "\\mathrm{d}x"]],
    ["EQ20", ["a-=b", "a+-b", "a\\le-b", "(-x)", "x)+y", "a==b", "a,-b", "a|+b"]],
    ["EQ21", ["x.y", "1.2.3", "a.\\,b"]],
    ["EQ24", ["\\partial+x", "\\nabla=0", "\\partial(x)"]],
];

// EQ27: the characters, by group, ten of each in an equation
const CHARACTERS: readonly string[] = [
    "←→↑↓↔↕⇐⇒⇔⟵⟶⟹↦",
    "≈≡≅∼≃∝≪≫≺≻⪯⪰≐",
    "⊂⊃⊆⊇⊊⊋∈∉∋∌",
    "∪∩∖⊎⊓⊔⊕⊖⊗⊘⊙",
    "∧∨¬∀∃∄⊢⊨⊤⊥",
    "×÷·∘∙⋅⋆∗†‡",
    "ℕℤℚℝℂℙℍ",
    "ℏℓ℘ℑℜℵ∅∞∠∡",
    "′″‴∴∵∎◻◇",
    "ϑϕϖϱϵϰ",
    "∑∏∐∫∬∭∮⋂⋃⨁",
];

const atoms = (count: number): string => Array.from({ length: count }, (_, index) => "abcdefghijklmnopqrstuvwxyz"[index % 26]).join("+");

const children: Child[] = [
    line("EQ above"),
    ...BUILT.flatMap(([prefix, cases]) => [newPage(), ...cases.flatMap((latex, index) => both(name(prefix, index), latex))]),
    ...TEXT.flatMap(([prefix, cases]) => [newPage(), ...cases.flatMap((latex, index) => both(name(prefix, index), latex, false))]),
    newPage(),
    ...group("EQ22", [new Paragraph({ children: [new TextRun("EQ22 "), equation("a+b+c"), new TextRun(" after")] })]),
    ...group("EQ23", [new Paragraph({ children: [new TextRun("EQ23 before "), new TextRun("@@EMPTY@@"), new TextRun(" after")] })]),
    ...group("EQ28a", [new Paragraph({ children: [new TextRun("EQ28a "), new TextRun("@@BOLDMATH@@"), new TextRun(" after")] })]),
    ...group("EQ28b", [new Paragraph({ children: [new TextRun("EQ28b "), new TextRun("@@SPACEDMATH@@"), new TextRun(" after")] })]),
    newPage(),
    ...group("EQ25a", [new Paragraph({ children: [new TextRun("EQ25a text before "), new TextRun("@@MATHPARA_a@@")] })]),
    ...group("EQ25b", [new Paragraph({ children: [new TextRun("@@MATHPARA_b@@"), new TextRun(" EQ25b text after")] })]),
    ...group("EQ25c", [new Paragraph({ children: [new TextRun("@@MATHPARA_c@@")] })]),
    ...group("EQ25d", [new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [equation("x+y=z")] })]),
    newPage(),
    ...[30, 50, 80, 120].flatMap((count, index) =>
        group(name("EQ26", index), [
            new Paragraph({ children: [new TextRun(`${name("EQ26", index)} `), equation(atoms(count)), new TextRun(" after")] }),
        ]),
    ),
    ...[80, 120].flatMap((count, index) =>
        group(name("EQ26", index + 4), [new Paragraph({ children: [new TextRun("@@PARA@@"), equation(atoms(count))] })]),
    ),
    newPage(),
    ...CHARACTERS.flatMap((characters, index) =>
        group(name("EQ27", index), [
            ...[...characters].map(
                (character) =>
                    new Paragraph({
                        children: [
                            new TextRun(`${name("EQ27", index)} u${character.codePointAt(0)!.toString(16)} `),
                            equation(character.repeat(10)),
                            new TextRun(" after"),
                        ],
                    }),
            ),
        ]),
    ),
    ...probe("EQ end", []),
];

const MATHPARA = (xml: string): string => `<m:oMathPara>${xml}</m:oMathPara>`;
await write({
    name: "word-stops-equations",
    sections: [{ properties: PAGE, children }],
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
                            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                        },
                    ],
                },
            ],
        },
    },
    injections: [
        // A paragraph of only an equation: the equation in m:oMathPara
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                text.replace(/<w:r><w:t xml:space="preserve">@@PARA@@<\/w:t><\/w:r>(<m:oMath>.*?<\/m:oMath>)/g, (_, equation: string) =>
                    MATHPARA(equation),
                ),
            );
        },
        // EQ22: the middle atom in a run of 16 points
        (parts) => {
            const text = parts.get("word/document.xml")!;
            const at = text.indexOf("EQ22 </w:t></w:r><m:oMath>");
            const start = text.indexOf("<m:oMath>", at);
            const end = text.indexOf("</m:oMath>", start) + "</m:oMath>".length;
            const runs = '<m:r><m:t>a+</m:t></m:r><m:r><w:rPr><w:sz w:val="32"/></w:rPr><m:t>b</m:t></m:r><m:r><m:t>+c</m:t></m:r>';
            parts.set("word/document.xml", `${text.slice(0, start)}<m:oMath>${runs}</m:oMath>${text.slice(end)}`);
        },
        // EQ28: an equation whose run has formatting of its own: bold (a), and character spacing of 2 points (b)
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set(
                "word/document.xml",
                text
                    .replace(
                        /<w:r><w:t xml:space="preserve">@@BOLDMATH@@<\/w:t><\/w:r>/,
                        "<m:oMath><m:r><w:rPr><w:b/></w:rPr><m:t>a+b=c</m:t></m:r></m:oMath>",
                    )
                    .replace(
                        /<w:r><w:t xml:space="preserve">@@SPACEDMATH@@<\/w:t><\/w:r>/,
                        '<m:oMath><m:r><w:rPr><w:spacing w:val="40"/></w:rPr><m:t>a+b=c</m:t></m:r></m:oMath>',
                    ),
            );
        },
        // EQ23: an empty equation
        (parts) => {
            const text = parts.get("word/document.xml")!;
            parts.set("word/document.xml", text.replace(/<w:r><w:t xml:space="preserve">@@EMPTY@@<\/w:t><\/w:r>/, "<m:oMath></m:oMath>"));
        },
        // EQ25: displayed equations beside text, and two in one m:oMathPara
        (parts) => {
            let text = parts.get("word/document.xml")!;
            const x = "<m:oMath><m:r><m:t>x+y=z</m:t></m:r></m:oMath>";
            text = text.replace(/<w:r><w:t xml:space="preserve">@@MATHPARA_a@@<\/w:t><\/w:r>/, MATHPARA(x));
            text = text.replace(/<w:r><w:t xml:space="preserve">@@MATHPARA_b@@<\/w:t><\/w:r>/, MATHPARA(x));
            text = text.replace(/<w:r><w:t xml:space="preserve">@@MATHPARA_c@@<\/w:t><\/w:r>/, MATHPARA(x + x));
            parts.set("word/document.xml", text);
        },
    ],
});

// The settings document: EQS1 with margins and space round displayed equations, and EQS2 with another maths font
const settingsChildren = (prefix: string): Child[] => [
    ...both(`${prefix}a`, "\\frac{a}{b}"),
    ...group(`${prefix}b`, [new Paragraph({ children: [new TextRun(`${prefix}b `), equation(atoms(50)), new TextRun(" after")] })]),
    ...group(`${prefix}c`, [new Paragraph({ children: [new TextRun("@@PARA@@"), equation(atoms(80))] })]),
    ...group(`${prefix}e`, [new Paragraph({ children: [new TextRun(`${prefix}e `), equation("x+y=z"), new TextRun(" after")] })]),
];
const mathPara: (parts: Map<string, string>) => void = (parts) => {
    const text = parts.get("word/document.xml")!;
    parts.set(
        "word/document.xml",
        text.replace(/<w:r><w:t xml:space="preserve">@@PARA@@<\/w:t><\/w:r>(<m:oMath>.*?<\/m:oMath>)/g, (_, equation: string) =>
            MATHPARA(equation),
        ),
    );
};
const mathPr = (xml: string) => (parts: Map<string, string>) => {
    const text = parts.get("word/settings.xml")!;
    const withNamespace = text.includes('xmlns:m="')
        ? text
        : text.replace("<w:settings ", '<w:settings xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
    parts.set("word/settings.xml", withNamespace.replace("</w:settings>", `<m:mathPr>${xml}</m:mathPr></w:settings>`));
};
await write({
    name: "word-stops-equation-settings",
    sections: [{ properties: PAGE, children: [line("EQS1 above"), ...settingsChildren("EQS1")] }],
    injections: [
        mathPara,
        mathPr(
            '<m:mathFont m:val="Cambria Math"/><m:dispDef/><m:lMargin m:val="720"/><m:rMargin m:val="720"/><m:defJc m:val="centerGroup"/><m:preSp m:val="240"/><m:postSp m:val="240"/><m:interSp m:val="120"/><m:intraSp m:val="60"/><m:wrapIndent m:val="1440"/><m:intLim m:val="subSup"/><m:naryLim m:val="undOvr"/>',
        ),
    ],
});
await write({
    name: "word-stops-equation-font",
    sections: [{ properties: PAGE, children: [line("EQS2 above"), ...settingsChildren("EQS2")] }],
    injections: [
        mathPara,
        mathPr(
            '<m:mathFont m:val="Latin Modern Math"/><m:dispDef/><m:lMargin m:val="0"/><m:rMargin m:val="0"/><m:defJc m:val="centerGroup"/>',
        ),
    ],
});
