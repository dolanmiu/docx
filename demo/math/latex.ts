// Math from LaTeX (issue #2994): each equation's LaTeX, and the equation latexToMath makes of it. See docs/usage/math-latex.md.

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { Math, latexToMath } from "docx/math";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

// The LaTeX, then its equation on a line of its own, centred
const example = (latex: string): readonly Paragraph[] => [
    new Paragraph({ children: [new TextRun({ text: latex, font: "Courier New", size: 18 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new Math({ children: latexToMath(latex) })] }),
];

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Math from LaTeX")] }),
                new Paragraph({
                    children: [
                        new TextRun("Inline math, such as "),
                        new Math({ children: latexToMath("$e^{i\\pi} + 1 = 0$") }),
                        new TextRun(", goes in a paragraph with its text."),
                    ],
                }),

                heading("Fractions, roots and scripts"),
                ...example("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"),
                ...example("\\sqrt[3]{x^3 + y^3} \\quad \\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!} \\quad {}^{14}_{6}\\mathrm{C}"),
                ...example("f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"),

                heading("Sums, integrals and other large operators"),
                ...example("\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}"),
                ...example("\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi} \\qquad \\oint_C \\mathbf{F} \\cdot d\\mathbf{r}"),
                ...example(
                    "\\prod_{p \\text{ prime}} \\frac{1}{1 - p^{-s}} \\qquad \\bigcup_{i \\in I} A_i \\qquad \\sum\\nolimits_{k} a_k",
                ),

                heading("Functions and brackets"),
                ...example("\\sin^2\\theta + \\cos^2\\theta = 1 \\qquad \\log_2 n \\qquad \\operatorname{rank}(A)"),
                ...example(
                    "\\left( \\frac{a}{b} \\right)^2 \\quad \\left\\| \\mathbf{v} \\right\\| \\quad \\left\\langle \\psi \\middle| \\phi \\right\\rangle \\quad \\lfloor x \\rfloor",
                ),

                heading("Accents, braces and boxes"),
                ...example(
                    "\\hat{x} \\quad \\bar{x} \\quad \\vec{v} \\quad \\dot{x} \\quad \\ddot{x} \\quad \\tilde{n} \\quad \\overline{AB} \\quad \\underline{x}",
                ),
                ...example("\\underbrace{1 + 2 + \\cdots + n}_{n \\text{ terms}} \\qquad \\overbrace{a + b}^{c}"),
                ...example("\\boxed{E = mc^2} \\qquad \\frac{\\cancel{2} x}{\\cancel{2}} = x \\qquad A \\xrightarrow{f} B"),

                heading("Fonts and symbols"),
                ...example("\\forall \\varepsilon > 0\\; \\exists \\delta > 0 : |x - a| < \\delta \\implies |f(x) - f(a)| < \\varepsilon"),
                ...example(
                    "\\mathbb{R}^n \\quad \\mathcal{L} \\quad \\mathfrak{g} \\quad \\mathbf{F} = m\\mathbf{a} \\quad \\boldsymbol{\\alpha} \\quad A \\not\\subset B",
                ),
                ...example("\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}"),

                heading("Matrices and cases"),
                ...example(
                    "A = \\begin{pmatrix} a_{11} & a_{12} & \\cdots \\\\ a_{21} & a_{22} & \\cdots \\\\ \\vdots & \\vdots & \\ddots \\end{pmatrix}",
                ),
                ...example("\\det \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc"),
                ...example("|x| = \\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x & \\text{otherwise} \\end{cases}"),

                heading("Aligned equations"),
                ...example("\\begin{aligned} (a+b)^2 &= (a+b)(a+b) \\\\ &= a^2 + 2ab + b^2 \\end{aligned}"),
                ...example("\\begin{align} y &= mx + b \\tag{1} \\\\ y' &= m \\tag{2} \\end{align}"),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
