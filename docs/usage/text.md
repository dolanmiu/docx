# Text Runs

!> TextRuns requires an understanding of [Paragraphs](usage/paragraph.md).

You can add multiple `text runs` in `Paragraphs`. This is the most verbose way of writing a `Paragraph` but it is also the most flexible:

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("My awesome text here for my university dissertation"), new TextRun("Foo Bar")],
                }),
            ],
        },
    ],
});
```

Text objects have methods inside which changes the way the text is displayed.

## Typographical Emphasis

More info [here](https://english.stackexchange.com/questions/97081/what-is-the-typography-term-which-refers-to-the-usage-of-bold-italics-and-unde)

### Bold

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Italics

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Foo Bar",
                            italics: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Underline

Underline has a few options

#### Options

| Property | Type                   | Notes    | Possible Values                                                                                                                                                           |
| -------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type     | `UnderlineType`        | Optional | SINGLE, WORD, DOUBLE, THICK, DOTTED, DOTTEDHEAV, DASH, DASHEDHEAV, DASHLONG, DASHLONGHEAV, DOTDASH, DASHDOTHEAVY, DOTDOTDAS, DASHDOTDOTHEAVY, WAVE, WAVYHEAVY, WAVYDOUBLE |
| color    | `string \| ThemeColor` | Optional | Color Hex values, or a color of the document's theme such as `{ theme: "accent1" }` (see [Themes](usage/themes.md#text-tables-and-borders-in-the-themes-colors))          |

**Example:**

```ts live
import { Document, Paragraph, TextRun, UnderlineType } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "and then underlined ",
                            underline: {
                                type: UnderlineType.DOUBLE,
                                color: "990011",
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

To do a simple vanilla underline:

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "and then underlined ",
                            underline: {},
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Emphasis Mark

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "and then emphasis mark",
                            emphasisMark: {},
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Shading and Highlighting

```ts live
import { Document, Paragraph, ShadingType, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "shading",
                            shading: {
                                type: ShadingType.REVERSE_DIAGONAL_STRIPE,
                                color: "00FFFF",
                                fill: "FF0000",
                            },
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "highlighting",
                            highlight: "yellow",
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

See [demo/text/highlighting-text.ts](https://github.com/dolanmiu/docx/blob/master/demo/text/highlighting-text.ts) for highlighting examples, and [demo/text/shading-text.ts](https://github.com/dolanmiu/docx/blob/master/demo/text/shading-text.ts) for shading examples.

### Strike through

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "strike",
                            strike: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Double strike through

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "doubleStrike",
                            doubleStrike: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Superscript

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Normal text and "),
                        new TextRun({
                            text: "superScript",
                            superScript: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Subscript

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Normal text and "),
                        new TextRun({
                            text: "subScript",
                            subScript: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### All Capitals

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "allCaps",
                            allCaps: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Small Capitals

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "smallCaps",
                            smallCaps: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

### Vanish and SpecVanish

You may want to hide your text in your document.

`Vanish` should affect the normal display of text, but an application may have settings to force hidden text to be displayed.

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This text is shown. "),
                        new TextRun({
                            text: "This text will be hidden",
                            vanish: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

`SpecVanish` was typically used to ensure that a paragraph style can be applied to a part of a paragraph, and still appear as in the Table of Contents (which in previous word processors would ignore the use of the style if it were being used as a character style).

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This text is shown. "),
                        new TextRun({
                            text: "This text will be hidden forever.",
                            specVanish: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Break

Sometimes you would want to put text underneath another line of text but inside the same paragraph.

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Text before the break"),
                        new TextRun({
                            text: "break",
                            break: 1,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

Adding two breaks:

```ts live
import { Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Text before the break"),
                        new TextRun({
                            text: "break",
                            break: 2,
                        }),
                    ],
                }),
            ],
        },
    ],
});
```
