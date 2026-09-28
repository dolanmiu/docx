# Math from LaTeX

<!-- cspell:ignore binom infty textrm pmatrix bmatrix Bmatrix vmatrix Vmatrix smallmatrix dcases rcases alignat alignedat flalign eqnarray gathered multline displaymath subarray substack mathbb mathcal mathscr mathfrak mathsf mathtt mathrm mathit mathbf boldsymbol textbf operatorname overbrace underbrace overbracket underbracket overparen underparen overset underset stackrel xrightarrow xleftarrow bcancel xcancel hphantom vphantom mathstrut nolimits bigcup bigcap bigoplus bigotimes iint iiint oint nicefrac sfrac dfrac tfrac cfrac dbinom tbinom lvert rvert langle rangle lfloor rfloor lceil rceil pmod bmod varepsilon newcommand textcolor widehat widetilde ddot dddot mathring overrightarrow overleftarrow Bigl Bigr biggl biggr texmath -->

!> Math from LaTeX requires an understanding of [Math](usage/math.md).

`latexToMath` turns LaTeX math into `docx`'s math components. They go in a `Math`, as any others do, and Word shows and edits them as equations, as it does those typed into it.

It reads the math that LaTeX, MathJax and KaTeX write, which is what most tools that write math give, such as a language model's answer or a Markdown document.

## Example

```ts live
import { AlignmentType, Document, Paragraph } from "docx";
import { Math, latexToMath } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new Math({ children: latexToMath("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}") })],
                }),
            ],
        },
    ],
});
```

In JavaScript strings, each backslash is written twice: `"\\frac"` is LaTeX's `\frac`. A template literal with `String.raw` saves doubling them: ``String.raw`\frac{a}{b}` ``.

## Inline and display math

Math in a paragraph with text is inline, as LaTeX's `$…$`. Math in a paragraph of its own is display math, as `$$…$$`, and is best centred. `latexToMath` leaves out the delimiters `$…$`, `$$…$$`, `\(…\)` and `\[…\]`, so LaTeX can be given with them or without.

```ts live
import { AlignmentType, Document, Paragraph, TextRun } from "docx";
import { Math, latexToMath } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Euler's identity, "),
                        new Math({ children: latexToMath("$e^{i\\pi} + 1 = 0$") }),
                        new TextRun(", links five constants. Summed, the first n squares are:"),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new Math({ children: latexToMath("$$\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$$") })],
                }),
            ],
        },
    ],
});
```

## Mixing with components

`latexToMath` gives a list of components, which can go among others anywhere math goes, such as in a fraction or a matrix:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRun, latexToMath } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRun("f(x)="),
                                new MathFraction({
                                    numerator: latexToMath("\\sin x"),
                                    denominator: latexToMath("\\sqrt{1 + x^2}"),
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Matrices, cases and aligned equations

LaTeX's environments become matrices, cases and aligned equations. `\tag` gives an equation its number:

```ts live
import { AlignmentType, Document, Paragraph } from "docx";
import { Math, latexToMath } from "docx/math";

const equation = (latex: string): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new Math({ children: latexToMath(latex) })] });

const doc = new Document({
    sections: [
        {
            children: [
                equation("A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}"),
                equation("|x| = \\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x & \\text{otherwise} \\end{cases}"),
                equation("\\begin{align} y &= mx + b \\tag{1} \\\\ y' &= m \\tag{2} \\end{align}"),
            ],
        },
    ],
});
```

## What it reads

| LaTeX                                                                                                  | Math                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Letters, digits, `+ - = < >`, and characters such as `α` and `≤` typed as they are                     | `MathRun`, one for each run of text in the same font. `-` is written as the minus sign `−`              |
| Greek letters, symbols, relations, arrows and dots, such as `\alpha`, `\infty`, `\le`, `\to`, `\cdots` | Their characters. Capital Greek letters are upright, as in LaTeX                                        |
| `x^2`, `x_i`, `x_i^2`, `f'`, `{}^{14}_6\mathrm{C}`                                                     | `MathSuperScript`, `MathSubScript`, `MathSubSuperScript`                                                |
| `\frac`, `\dfrac`, `\tfrac`, `\cfrac`, `{a \over b}`                                                   | `MathFraction`                                                                                          |
| `\nicefrac`, `\sfrac`                                                                                  | `MathFraction` with `type: "skewed"`                                                                    |
| `\binom`, `\dbinom`, `\tbinom`, `{n \choose k}`, `{a \atop b}`                                         | `MathFraction` with `type: "noBar"`, in `MathBrackets` for a binomial                                   |
| `\sqrt{x}`, `\sqrt[3]{x}`                                                                              | `MathRadical`                                                                                           |
| `\sum`, `\prod`, `\coprod`, `\int`, `\iint`, `\iiint`, `\oint`, `\bigcup`, `\bigcap`, `\bigoplus` …    | `MathLargeOperator`, with `\limits` and `\nolimits` as `limits`                                         |
| `\sin`, `\cos`, `\log`, `\ln`, `\exp`, `\operatorname{rank}` …                                         | `MathFunction`, with its name upright                                                                   |
| `\lim`, `\max`, `\min`, `\sup`, `\inf`, `\det`, `\operatorname*{argmax}` …                             | `MathFunction`, with its limits below its name (`MathLimitLower`)                                       |
| `\left( … \middle                                                                                      | … \right)`, with any delimiters, and `.` for none                                                       | `MathBrackets`, which grow with what they hold |
| `\big(`, `\Bigl[`, `\biggr)` …                                                                         | The bracket, which doesn't grow                                                                         |
| `\hat`, `\bar`, `\vec`, `\dot`, `\ddot`, `\tilde`, `\widehat`, `\overrightarrow` …                     | `MathAccent`                                                                                            |
| `\overline`, `\underline`                                                                              | `MathBar`                                                                                               |
| `\overbrace{…}^{…}`, `\underbrace{…}_{…}`, `\overbracket`, `\underparen` …                             | `MathBrace`, with the script as its label                                                               |
| `\overset`, `\underset`, `\stackrel`, `\xrightarrow[below]{above}` …                                   | `MathLimitUpper`, `MathLimitLower`                                                                      |
| `\boxed`, `\cancel`, `\bcancel`, `\xcancel`                                                            | `MathBox`                                                                                               |
| `\phantom`, `\hphantom`, `\vphantom`, `\smash`                                                         | `MathPhantom`                                                                                           |
| `\mathrm`, `\mathit`, `\mathbf`, `\boldsymbol`, and `\rm`, `\bf` in a group                            | `MathRun` with a `style`                                                                                |
| `\mathbb`, `\mathcal`, `\mathscr`, `\mathfrak`, `\mathsf`, `\mathtt`                                   | `MathRun` with a `script`                                                                               |
| `\text`, `\textrm`, `\mbox` …, which can hold `$…$`                                                    | `MathRun` with `normalText`                                                                             |
| `\,`, `\:`, `\;`, `\quad`, `\qquad`, `~`                                                               | Spaces of their widths                                                                                  |
| `\not=`, `\not\in` …                                                                                   | The relation with a line through it, such as `≠`                                                        |
| `\bmod`, `\pmod{n}`                                                                                    | mod, upright                                                                                            |
| `matrix`, `pmatrix`, `bmatrix`, `Bmatrix`, `vmatrix`, `Vmatrix`, `smallmatrix`, `array`, `\substack`   | `MathMatrix`                                                                                            |
| `cases`, `dcases`, `rcases`                                                                            | `MathCases`                                                                                             |
| `align`, `aligned`, `alignat`, `gather`, `gathered`, `split`, `multline`, `eqnarray`                   | `MathEquationArray`, with a row's `\tag{1}` as its `equationNumber`, `"(1)"`                            |
| `equation`                                                                                             | Its math, or a `MathEquationArray` of one row with a `\tag`                                             |
| `a &= b \\ &= c` outside an environment                                                                | `MathEquationArray`, as MathJax reads it                                                                |
| `\displaystyle`, `\label`, `\nonumber`, `\hline`, `\color`, `\textcolor` …                             | Nothing: Word works out sizes itself, and its math has no colours of its own. `\textcolor`'s math stays |

A large operator or a function applies to the math after it, up to a relation such as `=`, a `+` or `−`, a comma, or another operator, outside brackets. So `\sum_i a_i + b` applies the sum to `a_i`, and `\int_0^1 f(x)\,dx` applies the integral to `f(x)\,dx`. LaTeX doesn't say, and Word draws them the same either way. It matters only when the equation is edited in Word.

## What it doesn't read

`latexToMath` throws an error for anything it doesn't read, which says what and where, such as:

```
latexToMath: unknown command \foo, at character 10 of "\frac{a}{\foo}"
```

Catch it to write the LaTeX some other way, such as in a `TextRun`. These aren't read, or are read only in part:

- commands defined with `\newcommand` or `\def`, which can be replaced in the text first;
- spacing in units: `\hspace{…}` is written as a quad, and `\kern` isn't read;
- `\textbf{…}` is written as normal text, not bold;
- LaTeX's automatic equation numbers: `align` numbers its rows only with `\tag`.

## Compatibility

Word is the reference: `latexToMath` writes what Word writes for each. Other applications draw less of it:

- **LibreOffice** draws only ∑, ∏, ∐ and the integrals as large operators, and draws `¿` for others, such as ⋃. It draws `\mathbb` letters, but not bold, script or fraktur ones, and doesn't draw boxes or lines struck through. It shows the `&` and `#` of aligned equations, as [Math](usage/math.md) says.
- **Pages** draws all but `\boxed`'s box, and shows the `#` before equation numbers.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/math/latex.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/math/latex.ts_
