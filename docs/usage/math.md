# Math

!> Math requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

## Intro

-   To add math, create a `Math` object
-   Add `MathComponents` inside `Math`
-   `MathComponents` can have nested `MathComponents` inside. e.g. A fraction where the numerator is a square root, and the demoninator as another fraction. More on `MathComponents` below

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

`MathFractions` require a `numerator` and a `demoninator`, which are both a list of `MathComponents`

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
            child: [new MathRun("2")],
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
    child: [new MathRun("i")],
}),
```

```ts
new MathSum({
    child: [
        new MathSuperScript({
            child: new MathRun("e"),
            superScript: new MathRun("2"),
        })
    ],
    subScript: [new MathRun("i")],
    superScript: [new MathRun("10")],
}),
```
