# Custom Fonts

Custom fonts allow you to embed fonts directly into your document, ensuring consistent appearance across different systems.

## Embedding Fonts

Embed a font by providing the font data in the `Document` constructor:

```ts
import * as fs from "fs";
import { CharacterSet, Document, Paragraph, TextRun } from "docx";

const fontData = fs.readFileSync("./fonts/MyCustomFont.ttf");

const doc = new Document({
    fonts: [
        {
            name: "MyCustomFont",
            data: fontData,
            characterSet: CharacterSet.ANSI,
        },
    ],
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "This text uses a custom font",
                            font: "MyCustomFont",
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Font Options

| Property     | Type           | Notes    | Description                |
| ------------ | -------------- | -------- | -------------------------- |
| name         | `string`       | Required | Font name to reference     |
| data         | `Buffer`       | Required | Font file data             |
| characterSet | `CharacterSet` | Optional | Character set for the font |

## Character Sets

Available character sets:

| Value                      | Description              |
| -------------------------- | ------------------------ |
| `CharacterSet.ANSI`        | Standard ANSI characters |
| `CharacterSet.DEFAULT`     | Default character set    |
| `CharacterSet.SYMBOL`      | Symbol characters        |
| `CharacterSet.MAC`         | Macintosh characters     |
| `CharacterSet.SHIFTJIS`    | Japanese Shift-JIS       |
| `CharacterSet.HANGUL`      | Korean Hangul            |
| `CharacterSet.JOHAB`       | Korean Johab             |
| `CharacterSet.GB2312`      | Simplified Chinese       |
| `CharacterSet.CHINESEBIG5` | Traditional Chinese      |
| `CharacterSet.GREEK`       | Greek characters         |
| `CharacterSet.TURKISH`     | Turkish characters       |
| `CharacterSet.VIETNAMESE`  | Vietnamese characters    |
| `CharacterSet.HEBREW`      | Hebrew characters        |
| `CharacterSet.ARABIC`      | Arabic characters        |
| `CharacterSet.BALTIC`      | Baltic characters        |
| `CharacterSet.RUSSIAN`     | Cyrillic characters      |
| `CharacterSet.THAI`        | Thai characters          |
| `CharacterSet.EASTEUROPE`  | Eastern European         |

## Using Custom Fonts

### In TextRun

```ts
new TextRun({
    text: "Custom font text",
    font: "MyCustomFont",
});
```

### In Paragraph Style

```ts
new Paragraph({
    run: {
        font: "MyCustomFont",
    },
    children: [new TextRun("All text in this paragraph uses the custom font")],
});
```

### In Document Styles

```ts
const doc = new Document({
    fonts: [{ name: "CustomFont", data: fontData, characterSet: CharacterSet.ANSI }],
    styles: {
        default: {
            document: {
                run: {
                    font: "CustomFont",
                },
            },
        },
    },
    sections: [
        /* ... */
    ],
});
```

## Multiple Fonts

Embed multiple fonts:

```ts
const doc = new Document({
    fonts: [
        {
            name: "HeadingFont",
            data: fs.readFileSync("./fonts/Heading.ttf"),
            characterSet: CharacterSet.ANSI,
        },
        {
            name: "BodyFont",
            data: fs.readFileSync("./fonts/Body.ttf"),
            characterSet: CharacterSet.ANSI,
        },
    ],
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Heading",
                            font: "HeadingFont",
                            size: 48,
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Body text with a different font",
                            font: "BodyFont",
                        }),
                    ],
                }),
            ],
        },
    ],
});
```

## Mixing System and Custom Fonts

You can mix embedded fonts with system fonts:

```ts
new Paragraph({
    children: [
        new TextRun({
            text: "System font (Arial), ",
            font: "Arial",
        }),
        new TextRun({
            text: "Custom embedded font",
            font: "MyCustomFont",
        }),
    ],
});
```

## Browser Usage

In browsers, convert your font file to a base64 string or ArrayBuffer:

```ts
import { CharacterSet, Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

// Fetch the font file and convert to ArrayBuffer
const response = await fetch("./fonts/MyFont.ttf");
const fontData = await response.arrayBuffer();

const doc = new Document({
    fonts: [
        {
            name: "MyFont",
            data: Buffer.from(fontData),
            characterSet: CharacterSet.ANSI,
        },
    ],
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Text with embedded font",
                            font: "MyFont",
                        }),
                    ],
                }),
            ],
        },
    ],
});

// Export the document
Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "document.docx");
});
```

## Supported Font Formats

- **TTF** (TrueType Font) - Most common, widely supported
- **OTF** (OpenType Font) - Also supported

?> For best compatibility, use TTF fonts when possible.

## Demo

### Embedding Custom Fonts

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/91-custom-fonts.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/91-custom-fonts.ts_

### Declarative Custom Fonts

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/92-declarative-custom-fonts.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/92-declarative-custom-fonts.ts_
