// cspell:ignore overbrace sqrt eqArr sPre transp borderBox hideTop hideBot hideLeft hideRight phant varsigma
/**
 * Probes of what Word's PDFs of word-stops-equations3.ts left open, where docx/layout still stops at an equation Word
 * builds up, or lays one out by a rule seen in one case only:
 *
 * - EQ57: equation arrays with a second ampersand in a row, which EQ54b showed Word spacing by about 0.7 points, after
 *   letters whose italic corrections differ (a, 𝑓 and 𝑊 before the ampersand: 50, 60 and 80 units), after digits, with
 *   a third ampersand, and with an ampersand in one row and none in the other ("an equation array with more than one
 *   ampersand in a row", "an equation array with an ampersand in some rows and none in others")
 * - EQ58: the italic correction of a script's last letter, which Word adds at the end of an equation (EQ11b) and leaves
 *   out under an accent (EQ48k): before an ordinary atom, an operator and a bracket, and at the end of a numerator, a
 *   radicand and a bar, and accents over two and three letters, whose size the layout takes as the widest no wider than
 *   them
 * - EQ59: boxes with a side hidden: the left, the right and the bottom around 𝑥, and the top and the bottom around a
 *   fraction ("a box with its left or right side hidden", "a box with its top or bottom hidden, where the room there
 *   would show in its line")
 * - EQ60: transparent phantoms (`m:transp`) beside atoms that would space their part otherwise than an ordinary atom: a
 *   plus shown between letters, an equals sign hidden between letters, and a letter before a plus ("a transparent
 *   phantom whose part the atoms beside it would space otherwise than an ordinary atom")
 * - EQ61: pre-scripts (`m:sPre`) of letters, before a fraction, before 𝑦, and before a base with a superscript of its own
 * - EQ62: a bracket, a brace, accents and a root whose sizes Word's PDFs still leave between two: brackets around 𝑎^𝑏
 *   (0.816 to 0.835 of twice its reach), a brace over 𝑐𝑒 (0.981 to 1.021 of its width), hats over 𝑔𝑖 and 𝑏𝑡 (0.979 to 1
 *   of their width) and a root over 𝜍, whose depth of 423 units puts its sign between two in a line of text (a radicand
 *   of 1243 to 1260 units)
 *
 * Each probe is the equation in a line of text, "EQ57a ... after", and on a line of its own in `m:oMathPara`, between a
 * line above and a line below, as in word-stops-equations3.ts. Calibri 11 on A4 with inch margins; equations in Cambria
 * Math 11.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-equations4.ts [folder]
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
    [
        "EQ58",
        [
            "x_i y",
            "x^f y",
            "x_i+y",
            "(x_i)",
            "\\frac{x_i}{2}",
            "\\sqrt{x_i}",
            "\\overline{x_i}",
            "\\hat{x_i}",
            "\\hat{ab}",
            "\\hat{xy}",
            "\\hat{abc}",
        ],
    ],
    ["EQ62", ["\\left( a^{b} \\right)", "\\overbrace{ce}^{n}", "\\hat{gi}", "\\hat{bt}"]],
];

// EQ57, EQ59 to EQ61 and EQ62e: what docx doesn't write, as Office Math markup, in place of a placeholder run
const run = (text: string, properties = ""): string => `<m:r>${properties ? `<m:rPr>${properties}</m:rPr>` : ""}<m:t>${text}</m:t></m:r>`;
const row = (...runs: readonly string[]): string => `<m:e>${runs.join("")}</m:e>`;
const fraction = `<m:f><m:num>${run("a")}</m:num><m:den>${run("b")}</m:den></m:f>`;
const box = (side: string, content: string): string =>
    `<m:borderBox><m:borderBoxPr><m:${side} m:val="1"/></m:borderBoxPr>${row(content)}</m:borderBox>`;
const phantom = (properties: string, content: string): string => `<m:phant><m:phantPr>${properties}</m:phantPr>${row(content)}</m:phant>`;
const prescripts = (sub: string, sup: string, base: string): string =>
    `<m:sPre><m:sub>${run(sub)}</m:sub><m:sup>${run(sup)}</m:sup>${row(base)}</m:sPre>`;
const RAW: readonly (readonly [string, string])[] = [
    ["EQ57a", `<m:eqArr>${row(run("f&amp;=g&amp;h"))}${row(run("W&amp;=x&amp;y"))}</m:eqArr>`],
    ["EQ57b", `<m:eqArr>${row(run("a&amp;=1&amp;c"))}${row(run("dd&amp;=2&amp;f"))}</m:eqArr>`],
    ["EQ57c", `<m:eqArr>${row(run("a&amp;=b&amp;c&amp;=d"))}${row(run("dd&amp;=e&amp;f&amp;=g"))}</m:eqArr>`],
    ["EQ57d", `<m:eqArr>${row(run("a&amp;=b"))}${row(run("c=d"))}</m:eqArr>`],
    ["EQ59a", box("hideLeft", run("x"))],
    ["EQ59b", box("hideRight", run("x"))],
    ["EQ59c", box("hideBot", run("x"))],
    ["EQ59d", box("hideTop", fraction)],
    ["EQ59e", box("hideBot", fraction)],
    ["EQ60a", `${run("a")}${phantom('<m:transp m:val="1"/>', run("+"))}${run("b")}`],
    ["EQ60b", `${run("a")}${phantom('<m:show m:val="0"/><m:transp m:val="1"/>', run("="))}${run("b")}`],
    ["EQ60c", `${phantom('<m:transp m:val="1"/>', run("a"))}${run("+b")}`],
    ["EQ61a", prescripts("a", "b", run("x"))],
    ["EQ61b", prescripts("1", "2", fraction)],
    ["EQ61c", prescripts("i", "j", run("y"))],
    ["EQ61d", prescripts("1", "2", `<m:sSup>${row(run("x"))}<m:sup>${run("3")}</m:sup></m:sSup>`)],
    ["EQ62e", `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/>${row(run("ς"))}</m:rad>`],
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

await write({ name: "word-stops-equations4", sections: [{ properties: PAGE, children }], injections: [mathPara, raw] });
