# Math

!> Math requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

## Intro

1.  To add math, create a `Math` object
2.  Add `MathComponents` inside `Math`
3.  `MathComponents` can have nested `MathComponents` inside. e.g. A fraction where the numerator is a square root, and the denominator as another fraction. More on `MathComponents` below
4.  Make sure to add the `Math` object inside a `Paragraph`

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
