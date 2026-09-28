# Math

<!-- cspell:ignore binom -->

!> Math requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

## Intro

1.  To add math, create a `Math` object
2.  Add `MathComponents` inside `Math`
3.  `MathComponents` can have nested `MathComponents` inside. e.g. A fraction where the numerator is a square root, and the denominator as another fraction. More on `MathComponents` below
4.  Make sure to add the `Math` object inside a `Paragraph`

## Importing

Math comes with the `docx` package. Import it from `docx/math`, and everything else, such as the document and its paragraphs, from `docx`:

```ts
import { Document, Packer, Paragraph } from "docx";
import { Math, MathFraction, MathRun } from "docx/math";
```

Types such as `IMathOptions` and `MathComponent` come from `docx/math` too. `docx` still exports the math it had before `docx/math`, so code that imports it from `docx` keeps working. The two export the same classes, so they can be mixed. `MathMatrix`, `MathCases`, `MathEquationArray`, `MathBrackets`, `MathLargeOperator`, `MathAccent`, `MathBar`, `MathBrace`, `MathBox`, `MathPhantom` and `latexToMath` come from `docx/math` only.

To write math from LaTeX, such as `\frac{a}{b}`, see [Math from LaTeX](usage/math-latex.md).

In a page without a bundler, load `dist/math.umd.cjs` after `dist/index.umd.cjs` (or `dist/math.iife.js` after `dist/index.iife.js`). It adds a `docxMath` global, such as `new docxMath.MathRun("2+2")`.

## Example

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRun("2+2"),
                                new MathFraction({
                                    numerator: [new MathRun("hi")],
                                    denominator: [new MathRun("2")],
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

This will produce:

<p align="center">
    <img alt="clippy the assistant" src="images/math-example.png" width="200">
</p>

## Math Components

`MathComponents` are the unit sized building blocks of an equation in `docx`. A `MathComponent` takes in more nested `MathComponents` until you reach `MathRun`, which has no children. `MathRun` is similar to a [TextRun](usage/text.md).

### Math Run

`MathRun` is the most basic `MathComponent`.

#### Example

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [new MathRun("2+2")],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [new MathRun("hello")],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

An example of it being used inside `Math`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [new MathRun("2"), new MathRun("+"), new MathRun("2")],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

#### Normal text

Letters in math are drawn in italics, as variables. For words, such as "if" and "otherwise", give the text as normal text, which is upright and in the document's font, with its spaces kept, as Word's "Normal Text" button does (`m:nor`):

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [new MathRun({ text: "if ", normalText: true }), new MathRun("x>0")],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

#### Styles and alphabets

A run's letters can be upright, bold or both, as LaTeX's `\mathrm`, `\mathbf` and `\boldsymbol` (`style`), and in another alphabet, such as double-struck for ℝ or script for ℒ (`script`):

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRun({ text: "R", script: "doubleStruck" }),
                                new MathRun({ text: "L", script: "script" }),
                                new MathRun({ text: "F", style: "bold" }),
                                new MathRun("=m"),
                                new MathRun({ text: "a", style: "bold" }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

| Option       | Type                                                                               | Default | Notes                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `text`       | `string`                                                                           |         |                                                                                                                                  |
| `normalText` | `boolean`                                                                          | `false` | Upright, in the document's font, with its spaces kept (`m:nor`). Not with `style` or `script`                                    |
| `style`      | `"plain"`, `"bold"`, `"italic"`, `"boldItalic"`                                    |         | Upright, bold, italic, or both (`m:sty`). Word draws letters in italic unless a run has a style, or an alphabet other than roman |
| `script`     | `"roman"`, `"script"`, `"fraktur"`, `"doubleStruck"`, `"sansSerif"`, `"monospace"` |         | The alphabet (`m:scr`): 𝒜, 𝔄, 𝔸, 𝖠 and 𝙰                                                                                         |
| `literal`    | `boolean`                                                                          | `false` | Takes the text as it is (`m:lit`), such as an `&` in a `MathEquationArray`, which would otherwise be a point the rows line up at |

### Math Fraction

`MathFractions` require a `numerator` and a `denominator`, which are both a list of `MathComponents`

#### Example

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFraction({
                                    numerator: [new MathRun("1")],
                                    denominator: [new MathRun("2")],
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

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRadical, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFraction({
                                    numerator: [
                                        new MathRun("1"),
                                        new MathRadical({
                                            children: [new MathRun("2")],
                                        }),
                                    ],
                                    denominator: [new MathRun("2")],
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

An example of it being used inside `Math`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFraction({
                                    numerator: [new MathRun("1")],
                                    denominator: [new MathRun("2")],
                                }),
                                new MathRun("+"),
                                new MathFraction({
                                    numerator: [new MathRun("1")],
                                    denominator: [new MathRun("2")],
                                }),
                                new MathRun("= 1"),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

#### Fraction types

A fraction can be skewed, as ½, linear, as a/b, or stacked with no bar, as in a binomial coefficient (`type`, `m:type`):

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRoundBrackets, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFraction({ numerator: [new MathRun("1")], denominator: [new MathRun("2")], type: "skewed" }),
                                new MathFraction({ numerator: [new MathRun("a")], denominator: [new MathRun("b")], type: "linear" }),
                                new MathRoundBrackets({
                                    children: [
                                        new MathFraction({ numerator: [new MathRun("n")], denominator: [new MathRun("k")], type: "noBar" }),
                                    ],
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

`type` is `"stacked"` (the default), `"skewed"`, `"linear"` or `"noBar"`.

### Sum

A `MathComponent` for `Σ`. It can take a `superScript` and/or `subScript` as arguments to add `MathComponents` (usually limits) on the top and bottom

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun, MathSum } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSum({
                                    children: [new MathRun("i")],
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

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun, MathSum, MathSuperScript } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSum({
                                    children: [
                                        new MathSuperScript({
                                            children: [new MathRun("e")],
                                            superScript: [new MathRun("2")],
                                        }),
                                    ],
                                    subScript: [new MathRun("i")],
                                    superScript: [new MathRun("10")],
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

`MathSum` and `MathIntegral` take `limits`: `"aboveBelow"`, as a sum's limits usually are, or `"side"`, as an integral's usually are (`m:limLoc`). For other operators, such as ∏ and ⋃, see [Large operators](#large-operators).

### Radicals

A `MathComponent` for the `√` symbol. Examples include, square root, cube root etc. There is an optional `degree` parameter to specify the number of times the radicand is multiplied by itself. For example, `3` for cube root.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRadical, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRadical({
                                    children: [new MathRun("2")],
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

Cube root example:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRadical, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRadical({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                        new MathRun("+ 1"),
                                    ],
                                    degree: [new MathRun("3")],
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

### Super Script

`MathSuperScripts` are the little numbers written to the top right of numbers or variables. It means the exponent or power if written by itself with the number or variable.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun, MathSuperScript } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSuperScript({
                                    children: [new MathRun("x")],
                                    superScript: [new MathRun("2")],
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

An example with cosine:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun, MathSuperScript } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSuperScript({
                                    children: [new MathRun("cos")],
                                    superScript: [new MathRun("-1")],
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

### Sub Script

`MathSubScripts` are similar to `MathSuperScripts`, except the little number is written below.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun, MathSubScript } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubScript({
                                    children: [new MathRun("F")],
                                    subScript: [new MathRun("n-1")],
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

### Sub-Super Script

`MathSubSuperScripts` are a combination of both `MathSuperScript` and `MathSubScript`.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathRun, MathSubSuperScript } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubSuperScript({
                                    children: [new MathRun("test")],
                                    superScript: [new MathRun("hello")],
                                    subScript: [new MathRun("world")],
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

### Function

`MathFunctions` are a way of describing what happens to an input variable, in order to get the output result. It takes a `name` parameter to specify the name of the function.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFunction, MathRun, MathSuperScript } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFunction({
                                    name: [
                                        new MathSuperScript({
                                            children: [new MathRun("cos")],
                                            superScript: [new MathRun("-1")],
                                        }),
                                    ],
                                    children: [new MathRun("100")],
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

### Brackets

#### Brackets of any characters

`MathBrackets` puts brackets of any single characters around math, such as bars for an absolute value, double bars for a norm, or a brace on one side only (`""` for no bracket). The brackets grow with what they hold. Give `items` instead of `children` for several things with a `separator` between them:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathBrackets, MathRun } from "docx/math";

const brackets = [
    new MathBrackets({ open: "|", close: "|", children: [new MathRun("x")] }), // |x|
    new MathBrackets({ open: "‖", close: "‖", children: [new MathRun("v")] }), // ‖v‖
    new MathBrackets({ open: "⟨", close: "⟩", separator: "|", items: [[new MathRun("a")], [new MathRun("b")]] }), // ⟨a|b⟩
    new MathBrackets({ open: "[", close: ")", children: [new MathRun("0,1")] }), // [0,1)
    new MathBrackets({ open: "{", close: "", children: [new MathRun("x")] }), // a brace on the left only
];

const doc = new Document({
    sections: [
        {
            children: brackets.map((bracket) => new Paragraph({ children: [new Math({ children: [bracket] })] })),
        },
    ],
});
```

| Option      | Type                | Default | Notes                                                                                 |
| ----------- | ------------------- | ------- | ------------------------------------------------------------------------------------- |
| `open`      | `string`            | `"("`   | One character, or `""` for none (`m:begChr`)                                          |
| `close`     | `string`            | `")"`   | One character, or `""` for none (`m:endChr`)                                          |
| `children`  | `MathComponent[]`   |         | What goes between the brackets                                                        |
| `items`     | `MathComponent[][]` |         | Instead of `children`: several things, with `separator` between them                  |
| `separator` | `string`            | `"\|"`  | One character (`m:sepChr`)                                                            |
| `grow`      | `boolean`           | `true`  | Whether the brackets grow with what they hold. LibreOffice and Pages always grow them |

The four kinds below are fixed pairs of these.

#### Square brackets

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRun, MathSquareBrackets } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSquareBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
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

#### Round brackets

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathFraction, MathRoundBrackets, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRoundBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
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

#### Curly brackets

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathCurlyBrackets, MathFraction, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathCurlyBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
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

#### Angled brackets

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathAngledBrackets, MathFraction, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathAngledBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
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

### Limit

#### Limit Upper

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathLimitUpper, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathLimitUpper({
                                    children: [new MathRun("x")],
                                    limit: [new MathRun("-")],
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

#### Limit Lower

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathLimitLower, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathLimitLower({
                                    children: [new MathRun("lim")],
                                    limit: [new MathRun("x→0")],
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

### Large operators

`MathLargeOperator` writes a large operator with limits (`m:nary`), such as ∏, ⋃ or ∮, over what it applies to. `MathSum` and `MathIntegral` are two of these.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathLargeOperator, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathLargeOperator({
                                    operator: "product",
                                    subScript: [new MathRun("i=1")],
                                    superScript: [new MathRun("n")],
                                    children: [new MathRun("i")],
                                }),
                                new MathLargeOperator({
                                    operator: "contourIntegral",
                                    subScript: [new MathRun("C")],
                                    children: [new MathRun("F⋅dr")],
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

| Option        | Type                     | Default                                         | Notes                            |
| ------------- | ------------------------ | ----------------------------------------------- | -------------------------------- |
| `operator`    | See below                |                                                 |                                  |
| `children`    | `MathComponent[]`        |                                                 | What the operator applies to     |
| `subScript`   | `MathComponent[]`        |                                                 | The lower limit                  |
| `superScript` | `MathComponent[]`        |                                                 | The upper limit                  |
| `limits`      | `"aboveBelow"`, `"side"` | `"side"` for integrals, and `"aboveBelow"` else | Where the limits go (`m:limLoc`) |

The operators, with LaTeX's names for them:

| `operator`                                                                  | Operator | LaTeX                                          |
| --------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| `"sum"`, `"product"`, `"coproduct"`                                         | ∑ ∏ ∐    | `\sum`, `\prod`, `\coprod`                     |
| `"union"`, `"intersection"`, `"squareUnion"`, `"multisetUnion"`             | ⋃ ⋂ ⨆ ⨄  | `\bigcup`, `\bigcap`, `\bigsqcup`, `\biguplus` |
| `"logicalOr"`, `"logicalAnd"`                                               | ⋁ ⋀      | `\bigvee`, `\bigwedge`                         |
| `"directSum"`, `"tensorProduct"`, `"circledDot"`                            | ⨁ ⨂ ⨀    | `\bigoplus`, `\bigotimes`, `\bigodot`          |
| `"integral"`, `"doubleIntegral"`, `"tripleIntegral"`, `"quadrupleIntegral"` | ∫ ∬ ∭ ⨌  | `\int`, `\iint`, `\iiint`, `\iiiint`           |
| `"contourIntegral"`, `"surfaceIntegral"`, `"volumeIntegral"`                | ∮ ∯ ∰    | `\oint`, `\oiint`, `\oiiint`                   |

### Accents

`MathAccent` puts an accent over math (`m:acc`), which Word stretches over what it goes over:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathAccent, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathAccent({ accent: "hat", children: [new MathRun("x")] }),
                                new MathAccent({ accent: "rightArrow", children: [new MathRun("v")] }),
                                new MathAccent({ accent: "doubleDot", children: [new MathRun("x")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`accent` is `"hat"` (the default, as `\hat`), `"check"`, `"tilde"`, `"acute"`, `"grave"`, `"dot"`, `"doubleDot"`, `"tripleDot"`, `"breve"`, `"bar"`, `"ring"`, `"rightArrow"` (as `\vec`), `"leftArrow"`, `"leftRightArrow"`, `"rightHarpoon"` or `"leftHarpoon"`.

### Bars

`MathBar` draws a line over or under math (`m:bar`), as long as what it goes over, as LaTeX's `\overline` and `\underline`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathBar, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathBar({ children: [new MathRun("AB")] }),
                                new MathBar({ position: "below", children: [new MathRun("x")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`position` is `"above"` (the default) or `"below"`.

### Braces

`MathBrace` draws a brace over or under math (`m:groupChr`), with a label on its other side, as LaTeX's `\overbrace` and `\underbrace`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathBrace, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathBrace({
                                    position: "below",
                                    children: [new MathRun("1+2+⋯+n")],
                                    label: [new MathRun({ text: "n terms", normalText: true })],
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

| Option     | Type                             | Default   | Notes                                                                               |
| ---------- | -------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| `children` | `MathComponent[]`                |           | What the brace goes over or under                                                   |
| `position` | `"above"`, `"below"`             | `"above"` |                                                                                     |
| `brace`    | `"curly"`, `"square"`, `"round"` | `"curly"` | ⏞ ⏟, ⎴ ⎵ and ⏜ ⏝                                                                    |
| `label`    | `MathComponent[]`                |           | On the brace's other side, in a limit (`m:limUpp` or `m:limLow`), as Word writes it |

### Boxes

`MathBox` draws a box around math (`m:borderBox`), as LaTeX's `\boxed`, or lines struck through it, as `\cancel`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathBox, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathBox({ children: [new MathRun("E=mc²")] }),
                                new MathBox({ borders: [], strikes: ["diagonalUp"], children: [new MathRun("x")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

| Option     | Type                                                                     | Default                              | Notes                                                                         |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| `children` | `MathComponent[]`                                                        |                                      |                                                                               |
| `borders`  | A list of `"top"`, `"bottom"`, `"left"`, `"right"`                       | `["top", "bottom", "left", "right"]` | The sides drawn. `[]` draws none, for lines struck through with no box        |
| `strikes`  | A list of `"horizontal"`, `"vertical"`, `"diagonalUp"`, `"diagonalDown"` | `[]`                                 | `"diagonalUp"` is `\cancel`, `"diagonalDown"` `\bcancel`, and both `\xcancel` |

### Phantoms

`MathPhantom` writes math that takes up room without being seen (`m:phant`), as LaTeX's `\phantom`, to leave space for it or line things up with it. Or math that is seen but takes up less room, as `\smash`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathPhantom, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [new MathRun("a"), new MathPhantom({ children: [new MathRun("+b")] }), new MathRun("+c")],
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

| Option     | Type              | Default | Notes                                                               |
| ---------- | ----------------- | ------- | ------------------------------------------------------------------- |
| `children` | `MathComponent[]` |         |                                                                     |
| `visible`  | `boolean`         | `false` | Whether the math is seen (`m:show`)                                 |
| `width`    | `boolean`         | `true`  | Whether it takes up its width. `false` as `\vphantom` (`m:zeroWid`) |
| `height`   | `boolean`         | `true`  | Whether it takes up its height above the line (`m:zeroAsc`)         |
| `depth`    | `boolean`         | `true`  | Whether it takes up its depth below the line (`m:zeroDesc`)         |

### Matrices

`MathMatrix` writes a matrix (`m:m`): rows of cells, each cell a list of `MathComponents`, in brackets or none. A row shorter than the longest gets empty cells at its end.

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathMatrix, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathMatrix({
                                    brackets: "round",
                                    rows: [
                                        [[new MathRun("1")], [new MathRun("2")], [new MathRun("3")]],
                                        [[new MathRun("4")], [new MathRun("5")], [new MathRun("6")]],
                                    ],
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

| Option              | Type                                                                                             | Default    | Notes                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `rows`              | `MathComponent[][][]`                                                                            |            | Rows of cells. Word allows at most 256 rows and 64 cells in a row                         |
| `brackets`          | `"none"`, `"round"`, `"square"`, `"curly"`, `"angled"`, `"verticalBars"`, `"doubleVerticalBars"` | `"none"`   | ( ), [ ], { }, ⟨ ⟩, \| \| and ‖ ‖                                                         |
| `columnAlignment`   | `"left"`, `"center"`, `"right"`, or one for each column                                          | `"center"` | Where the cells go across their columns (`m:mcJc`). LibreOffice and Pages centre them all |
| `verticalAlignment` | `"top"`, `"center"`, `"bottom"`                                                                  | `"center"` | Where the matrix sits on its line (`m:baseJc`)                                            |

### Cases

`MathCases` writes values, each with its condition, one to a line, in a brace on the left, as LaTeX's `cases`:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathCases, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRun("f(x)="),
                                new MathCases({
                                    cases: [
                                        {
                                            value: [new MathRun("1,")],
                                            condition: [new MathRun({ text: "if ", normalText: true }), new MathRun("x>0")],
                                        },
                                        { value: [new MathRun("0,")], condition: [new MathRun({ text: "otherwise", normalText: true })] },
                                    ],
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

A case's `condition` can be left out. The cases are written as a matrix of two columns, lined up on the left, in a brace with no closing bracket, as pandoc writes them, since LibreOffice draws the `&` of Word's own way. Word allows at most 256 cases.

### Equations lined up, with numbers

`MathEquationArray` writes rows of math, one to a line, lined up at the points between their parts, as LaTeX's `align` and `aligned` (`m:eqArr`). Each row is a list of `parts`: the first, third and every other point between them line up with the same points in the other rows, such as at an `=` sign, and the others are where space goes between columns, as LaTeX's `&`. A part can be empty, such as the first part of a row that goes on from the row before:

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathEquationArray, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathEquationArray({
                                    rows: [
                                        { parts: [[new MathRun("(a+b)²")], [new MathRun("=(a+b)(a+b)")]] },
                                        { parts: [[], [new MathRun("=a²+ab+ba+b²")]] },
                                        { parts: [[], [new MathRun("=a²+2ab+b²")]] },
                                    ],
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

A row's `equationNumber` is put at the right margin by Word 2016 and later, as Word's own equation numbers (`#` then the number):

```ts live
import { Document, Paragraph } from "docx";
import { Math, MathEquationArray, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathEquationArray({
                                    rows: [
                                        { parts: [[new MathRun("y")], [new MathRun("=mx+b")]], equationNumber: "(1)" },
                                        { parts: [[new MathRun("y′")], [new MathRun("=m")]], equationNumber: "(2)" },
                                    ],
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

| Option                  | Type                            | Default    | Notes                                         |
| ----------------------- | ------------------------------- | ---------- | --------------------------------------------- |
| `rows`                  | `MathEquationArrayRow[]`        |            | Word allows at most 64                        |
| `rows[].parts`          | `MathComponent[][]`             |            | At least one, which can be empty              |
| `rows[].equationNumber` | `string`                        |            | Such as `"(1)"`                               |
| `verticalAlignment`     | `"top"`, `"center"`, `"bottom"` | `"center"` | Where the array sits on its line (`m:baseJc`) |

?> Word marks the points with an `&`, and the number with a `#`, in the text. So an `&` or a `#` in a `MathRun` inside an equation array is taken as one too.

Word 2013 and older, LibreOffice and Pages show the `#` before the number. For numbers that every application puts at the margin, put the equation in a paragraph with a centre tab stop and a right tab stop, and the number after a tab. Word then draws the equation at the size of inline math:

```ts live
import { Document, Paragraph, Tab, TabStopPosition, TabStopType, TextRun } from "docx";
import { Math, MathRun } from "docx/math";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    tabStops: [
                        { type: TabStopType.CENTER, position: TabStopPosition.MAX / 2 },
                        { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                    ],
                    children: [
                        new TextRun({ children: [new Tab()] }),
                        new Math({ children: [new MathRun("E=mc²")] }),
                        new TextRun({ children: [new Tab(), "(1)"] }),
                    ],
                }),
            ],
        },
    ],
});
```

## From LaTeX

`latexToMath` turns LaTeX into these components: see [Math from LaTeX](usage/math-latex.md). By hand, LaTeX's environments and commands are these:

| LaTeX                                   | `docx/math`                                                            |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `\begin{matrix}`                        | `new MathMatrix({ rows })`                                             |
| `\begin{pmatrix}`                       | `new MathMatrix({ brackets: "round", rows })`                          |
| `\begin{bmatrix}`                       | `new MathMatrix({ brackets: "square", rows })`                         |
| `\begin{Bmatrix}`                       | `new MathMatrix({ brackets: "curly", rows })`                          |
| `\begin{vmatrix}`                       | `new MathMatrix({ brackets: "verticalBars", rows })`                   |
| `\begin{Vmatrix}`                       | `new MathMatrix({ brackets: "doubleVerticalBars", rows })`             |
| `\begin{cases}`                         | `new MathCases({ cases: [{ value, condition }] })`                     |
| `\begin{aligned}`, `\begin{align*}`     | `new MathEquationArray({ rows: [{ parts }] })`                         |
| `\begin{align}`, `\tag{1}`              | `new MathEquationArray({ rows: [{ parts, equationNumber: "(1)" }] })`  |
| `&` in a row                            | Between two of a row's `parts`                                         |
| `\left\| x \right\|`, `\lVert v \rVert` | `new MathBrackets({ open: "\|", close: "\|", children })`, `open: "‖"` |
| `\langle a \mid b \rangle`              | `new MathBrackets({ open: "⟨", close: "⟩", separator: "\|", items })`  |
| `\text{if}`                             | `new MathRun({ text: "if", normalText: true })`                        |
| `\mathbb{R}`, `\mathbf{F}`              | `new MathRun({ text: "R", script: "doubleStruck" })`, `style: "bold"`  |
| `\prod`, `\bigcup`, `\oint`             | `new MathLargeOperator({ operator: "product", children })`             |
| `\hat{x}`, `\vec{v}`                    | `new MathAccent({ accent: "hat", children })`                          |
| `\overline{AB}`                         | `new MathBar({ children })`                                            |
| `\underbrace{…}_{n}`                    | `new MathBrace({ position: "below", children, label })`                |
| `\boxed{…}`, `\cancel{…}`               | `new MathBox({ children })`, `borders: [], strikes: ["diagonalUp"]`    |
| `\phantom{…}`                           | `new MathPhantom({ children })`                                        |
| `\binom{n}{k}`                          | `MathFraction` with `type: "noBar"` in `MathRoundBrackets`             |

## Compatibility

Word is the reference. Other applications differ:

- **LibreOffice** centres every column of a matrix, centres the rows of an equation array without lining them up, and shows the `&` between parts and the `#` before equation numbers.
- **Pages** centres every column of a matrix and shows the `#` before equation numbers.
- **Word 2013 and older** show the `#` before equation numbers.
- **LibreOffice** draws only ∑, ∏, ∐ and the integrals as large operators, and draws `¿` for others, such as ⋃. Of the alphabets, it draws only double-struck letters, and of the styles none. It doesn't draw boxes or lines struck through.
- **Pages** doesn't draw a box's sides.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/math/math.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/math/math.ts_

Matrices, equations lined up with numbers, cases, and brackets of any characters:

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/math/matrices-and-alignment.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/math/matrices-and-alignment.ts_

Math from LaTeX:

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/math/latex.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/math/latex.ts_
