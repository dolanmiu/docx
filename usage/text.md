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

Set `vanish: false` to show text that its style hides.

`SpecVanish` is for a paragraph's mark, together with `vanish`, which you set with the paragraph's `run` option. Hiding a paragraph's mark runs the paragraph on into the next one, and `specVanish` keeps them joined even when hidden text is shown. This is Word's style separator: a heading can share a line with the text after it, and the Table of Contents still lists only the heading. On its own, `specVanish` doesn't hide anything.

```ts live
import { Document, HeadingLevel, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    run: { vanish: true, specVanish: true },
                    children: [new TextRun("Introduction.")],
                }),
                new Paragraph({
                    children: [new TextRun(" This text is on the same line as the heading.")],
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

## Hyphens

`NoBreakHyphen` is a hyphen that a line never breaks at, the character Word inserts for Ctrl+Shift+-. It keeps a negative number or a hyphenated name on one line. `SoftHyphen` is an optional hyphen: it's hidden unless Word breaks the line there.

```ts live
import { Document, NoBreakHyphen, Paragraph, SoftHyphen, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun({ children: ["The balance is ", new NoBreakHyphen(), "1,234.56"] })],
                }),
                new Paragraph({
                    children: [new TextRun({ children: ["Extra", new SoftHyphen(), "ordinary"] })],
                }),
            ],
        },
    ],
});
```
