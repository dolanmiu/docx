# Symbol Runs

!> SymbolRuns require an understanding of [Paragraphs](usage/paragraph.md).

You can add multiple `symbol runs` in `Paragraphs` along with [text runs](usage/text.md) using the Paragraph's `children` property.

```ts
import { Paragraph, TextRun, SymbolRun } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("This is a checkbox: "),
        new SymbolRun("F071")
    ],
});
```

## Specifying symbol font

By default symbol runs will use the `Wingdings` font. To switch fonts, pass an object instead of a string to the `SymbolRun` constructor and specify `char` and `symbolfont` properties:

```ts
const symbol = new SymbolRun({
    char: "F071",
    symbolfont: "Arial",
});
```

## Example symbols

Symbols are specified by their hexidecimal code. Ref http://officeopenxml.com/WPtextSpecialContent-symbol.php. Below are some examples.

- `F071`: empty checkbox
- `F043`: thumbs up
- `F04A`: smile
- `F04C`: frown
- `F022`: scissors
- `F0F0`: right arrow
- `F0FE`: checked box

## Typographical Emphasis

Symbol runs can have their display modified just like text runs. For example, they can be bolded and italicized:

```ts
const symbol = new SymbolRun({
    char: "F071",
    bold: true,
    italics: true,
});
```

See the [text run](usage/text.md) documentation for more info.
