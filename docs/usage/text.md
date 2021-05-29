# Text Runs

!> TextRuns requires an understanding of [Paragraphs](usage/paragraph.md).

You can add multiple `text runs` in `Paragraphs`. This is the most verbose way of writing a `Paragraph` but it is also the most flexible:

```ts
import { Paragraph, TextRun } from "docx";

const paragraph = new Paragraph({
    children: [new TextRun("My awesome text here for my university dissertation"), new TextRun("Foo Bar")],
});
```

Text objects have methods inside which changes the way the text is displayed.

## Typographical Emphasis

More info [here](https://english.stackexchange.com/questions/97081/what-is-the-typography-term-which-refers-to-the-usage-of-bold-italics-and-unde)

### Bold

```ts
const text = new TextRun({
    text: "Foo Bar",
    bold: true,
});
```

### Italics

```ts
const text = new TextRun({
    text: "Foo Bar",
    italics: true,
});
```

### Underline

Underline has a few options

#### Options

| Property | Type            | Notes    | Possible Values                                                                                                                                                           |
| -------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type     | `UnderlineType` | Optional | SINGLE, WORD, DOUBLE, THICK, DOTTED, DOTTEDHEAV, DASH, DASHEDHEAV, DASHLONG, DASHLONGHEAV, DOTDASH, DASHDOTHEAVY, DOTDOTDAS, DASHDOTDOTHEAVY, WAVE, WAVYHEAVY, WAVYDOUBLE |
| color    | `string`        | Optional | Color Hex values                                                                                                                                                          |

**Example:**

```ts
const text = new TextRun({
    text: "and then underlined ",
    underline: {
        type: UnderlineType.DOUBLE,
        color: "990011",
    },
});
```

To do a simple vanilla underline:

```ts
const text = new TextRun({
    text: "and then underlined ",
    underline: {},
});
```

### Emphasis Mark

```ts
const text = new TextRun({
    text: "and then emphasis mark",
    emphasisMark: {},
});
```

### Shading and Highlighting

```ts
const text = new TextRun({
    text: "shading",
    shading: {
        type: ShadingType.REVERSE_DIAGONAL_STRIPE,
        color: "00FFFF",
        fill: "FF0000",
    },
});
```

```ts
const text = new TextRun({
    text: "highlighting",
    highlight: "yellow",
});
```

### Strike through

```ts
const text = new TextRun({
    text: "strike",
    strike: true,
});
```

### Double strike through

```ts
const text = new TextRun({
    text: "doubleStrike",
    doubleStrike: true,
});
```

### Superscript

```ts
const text = new TextRun({
    text: "superScript",
    superScript: true,
});
```

### Subscript

```ts
const text = new TextRun({
    text: "subScript",
    subScript: true,
});
```

### All Capitals

```ts
const text = new TextRun({
    text: "allCaps",
    allCaps: true,
});
```

### Small Capitals

```ts
const text = new TextRun({
    text: "smallCaps",
    smallCaps: true,
});
```

## Break

Sometimes you would want to put text underneath another line of text but inside the same paragraph.

```ts
const text = new TextRun({
    text: "break",
    break: 1,
});
```

Adding two breaks:

```ts
const text = new TextRun({
    text: "break",
    break: 2,
});
```
