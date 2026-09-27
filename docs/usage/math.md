# Math

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

Types such as `IMathOptions` and `MathComponent` come from `docx/math` too. `docx` still exports the math it had before `docx/math`, so code that imports it from `docx` keeps working. The two export the same classes, so they can be mixed. `MathMatrix`, `MathCases`, `MathEquationArray` and `MathBrackets` come from `docx/math` only.

In a page without a bundler, load `dist/math.umd.cjs` after `dist/index.umd.cjs` (or `dist/math.iife.js` after `dist/index.iife.js`). It adds a `docxMath` global, such as `new docxMath.MathRun("2+2")`.

## Example

```ts
new Math({
    children: [
        new MathRun("2+2"),
        new MathFraction({
            numerator: [new MathRun("hi")],
            denominator: [new MathRun("2")],
        }),
    ],
}),
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

```ts
new MathRun("2+2");
```

```ts
new MathRun("hello");
```

An example of it being used inside `Math`:

```ts
new Math({
    children: [
        new MathRun("2"),
        new MathRun("+"),
        new MathRun("2"),
    ],
}),
```

#### Normal text

Letters in math are drawn in italics, as variables. For words, such as "if" and "otherwise", give the text as normal text, which is upright and in the document's font, with its spaces kept, as Word's "Normal Text" button does (`m:nor`):

```ts
new MathRun({ text: "if ", normalText: true });
```

### Math Fraction

`MathFractions` require a `numerator` and a `denominator`, which are both a list of `MathComponents`

#### Example

```ts
new MathFraction({
    numerator: [new MathRun("1")],
    denominator: [new MathRun("2")],
}),
```

```ts
new MathFraction({
    numerator: [
        new MathRun("1"),
        new MathRadical({
            children: [new MathRun("2")],
        }),
    ],
    denominator: [new MathRun("2")],
}),
```

An example of it being used inside `Math`:

```ts
new Math({
    children: [
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
        new MathText("+"),
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
        new MathText("= 1"),
    ],
}),
```

### Sum

A `MathComponent` for `Σ`. It can take a `superScript` and/or `subScript` as arguments to add `MathComponents` (usually limits) on the top and bottom

```ts
new MathSum({
    children: [new MathRun("i")],
}),
```

```ts
new MathSum({
    children: [
        new MathSuperScript({
            children: [new MathRun("e")],
            superScript: [new MathRun("2")],
        })
    ],
    subScript: [new MathRun("i")],
    superScript: [new MathRun("10")],
}),
```

### Radicals

A `MathComponent` for the `√` symbol. Examples include, square root, cube root etc. There is an optional `degree` parameter to specify the number of times the radicand is multiplied by itself. For example, `3` for cube root.

```ts
new MathRadical({
    children: [new MathRun("2")],
}),
```

Cube root example:

```ts
new MathRadical({
    children: [
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
        new MathRun('+ 1'),
    ],
    degree: [new MathRun("3")],
}),
```

### Super Script

`MathSuperScripts` are the little numbers written to the top right of numbers or variables. It means the exponent or power if written by itself with the number or variable.

```ts
new MathSuperScript({
    children: [new MathRun("x")],
    superScript: [new MathRun("2")],
}),
```

An example with cosine:

```ts
new MathSuperScript({
    children: [new MathRun("cos")],
    superScript: [new MathRun("-1")],
}),
```

### Sub Script

`MathSubScripts` are similar to `MathSuperScripts`, except the little number is written below.

```ts
new MathSubScript({
    children: [new MathRun("F")],
    subScript: [new MathRun("n-1")],
}),
```

### Sub-Super Script

`MathSubSuperScripts` are a combination of both `MathSuperScript` and `MathSubScript`.

```ts
new MathSubSuperScript({
    children: [new MathRun("test")],
    superScript: [new MathRun("hello")],
    subScript: [new MathRun("world")],
}),
```

### Function

`MathFunctions` are a way of describing what happens to an input variable, in order to get the output result. It takes a `name` parameter to specify the name of the function.

```ts
new MathFunction({
    name: [
        new MathSuperScript({
            children: [new MathRun("cos")],
            superScript: [new MathRun("-1")],
        }),
    ],
    children: [new MathRun("100")],
}),
```

### Brackets

#### Brackets of any characters

`MathBrackets` puts brackets of any single characters around math, such as bars for an absolute value, double bars for a norm, or a brace on one side only (`""` for no bracket). The brackets grow with what they hold. Give `items` instead of `children` for several things with a `separator` between them:

```ts
new MathBrackets({ open: "|", close: "|", children: [new MathRun("x")] }); // |x|
new MathBrackets({ open: "‖", close: "‖", children: [new MathRun("v")] }); // ‖v‖
new MathBrackets({ open: "⟨", close: "⟩", separator: "|", items: [[new MathRun("a")], [new MathRun("b")]] }); // ⟨a|b⟩
new MathBrackets({ open: "[", close: ")", children: [new MathRun("0,1")] }); // [0,1)
new MathBrackets({ open: "{", close: "", children: [new MathRun("x")] }); // a brace on the left only
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

```ts
new MathSquareBrackets({
    children: [
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
    ],
}),
```

#### Round brackets

```ts
new MathRoundBrackets({
    children: [
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
    ],
}),
```

#### Curly brackets

```ts
new MathCurlyBrackets({
    children: [
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
    ],
}),
```

#### Angled brackets

```ts
new MathAngledBrackets({
    children: [
        new MathFraction({
            numerator: [new MathRun("1")],
            denominator: [new MathRun("2")],
        }),
    ],
}),
```

### Limit

#### Limit Upper

```ts
new MathLimitUpper({
    children: [new MathRun("x")],
    limit: [new MathRun("-")],
}),
```

#### Limit Lower

```ts
new MathLimitLower({
    children: [new MathRun("lim")],
    limit: [new MathRun("x→0")],
}),
```

### Matrices

`MathMatrix` writes a matrix (`m:m`): rows of cells, each cell a list of `MathComponents`, in brackets or none. A row shorter than the longest gets empty cells at its end.

```ts
new MathMatrix({
    brackets: "round",
    rows: [
        [[new MathRun("1")], [new MathRun("2")], [new MathRun("3")]],
        [[new MathRun("4")], [new MathRun("5")], [new MathRun("6")]],
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

```ts
new Math({
    children: [
        new MathRun("f(x)="),
        new MathCases({
            cases: [
                { value: [new MathRun("1,")], condition: [new MathRun({ text: "if ", normalText: true }), new MathRun("x>0")] },
                { value: [new MathRun("0,")], condition: [new MathRun({ text: "otherwise", normalText: true })] },
            ],
        }),
    ],
});
```

A case's `condition` can be left out. The cases are written as a matrix of two columns, lined up on the left, in a brace with no closing bracket, as pandoc writes them, since LibreOffice draws the `&` of Word's own way. Word allows at most 256 cases.

### Equations lined up, with numbers

`MathEquationArray` writes rows of math, one to a line, lined up at the points between their parts, as LaTeX's `align` and `aligned` (`m:eqArr`). Each row is a list of `parts`: the first, third and every other point between them line up with the same points in the other rows, such as at an `=` sign, and the others are where space goes between columns, as LaTeX's `&`. A part can be empty, such as the first part of a row that goes on from the row before:

```ts
new MathEquationArray({
    rows: [
        { parts: [[new MathRun("(a+b)²")], [new MathRun("=(a+b)(a+b)")]] },
        { parts: [[], [new MathRun("=a²+ab+ba+b²")]] },
        { parts: [[], [new MathRun("=a²+2ab+b²")]] },
    ],
});
```

A row's `equationNumber` is put at the right margin by Word 2016 and later, as Word's own equation numbers (`#` then the number):

```ts
new MathEquationArray({
    rows: [
        { parts: [[new MathRun("y")], [new MathRun("=mx+b")]], equationNumber: "(1)" },
        { parts: [[new MathRun("y′")], [new MathRun("=m")]], equationNumber: "(2)" },
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

```ts
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
});
```

## From LaTeX

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

## Compatibility

Word is the reference. Other applications differ:

- **LibreOffice** centres every column of a matrix, centres the rows of an equation array without lining them up, and shows the `&` between parts and the `#` before equation numbers.
- **Pages** centres every column of a matrix and shows the `#` before equation numbers. It draws all math very small unless the document's default paragraph style has a size, which `docx` doesn't write.
- **Word 2013 and older** show the `#` before equation numbers.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/math/math.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/math/math.ts_

Matrices, equations lined up with numbers, cases, and brackets of any characters:

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/math/matrices-and-alignment.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/math/matrices-and-alignment.ts_
