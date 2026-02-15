# Quickstart Guide

Get up and running with docx in under 5 minutes.

**In this guide:**

- Install docx
- Create your first document
- Add text, tables, and images
- Export in multiple formats

## Installation

```terminal
npm install --save docx
```

## Your First Document

Create a "Hello World" document in just a few lines:

```ts
import { Document, Packer, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            // Documents are organized into sections
            children: [
                new Paragraph({
                    children: [new TextRun("Hello World!")],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

That's it! Run this code to create your first Word document.

## Adding Common Elements

### Bold and Styled Text

```ts
new Paragraph({
    children: [
        new TextRun("Normal text, "),
        new TextRun({
            text: "bold text, ",
            bold: true,
        }),
        new TextRun({
            text: "italic text",
            italics: true,
        }),
    ],
});
```

See the [Text guide](usage/text.md) for all formatting options.

### Headings

```ts
import { HeadingLevel } from "docx";

new Paragraph({
    text: "My Heading",
    heading: HeadingLevel.HEADING_1,
});
```

### Bullet Points

```ts
[
    new Paragraph({
        text: "First item",
        bullet: { level: 0 },
    }),
    new Paragraph({
        text: "Second item",
        bullet: { level: 0 },
    }),
    new Paragraph({
        text: "Nested item",
        bullet: { level: 1 },
    }),
];
```

See the [Bullet Points guide](usage/bullet-points.md) for more options.

### Tables

```ts
import { Table, TableRow, TableCell } from "docx";

new Table({
    rows: [
        new TableRow({
            children: [new TableCell({ children: [new Paragraph("Cell 1")] }), new TableCell({ children: [new Paragraph("Cell 2")] })],
        }),
    ],
});
```

See the [Tables guide](usage/tables.md) for advanced table features.

### Images

```ts
import { ImageRun } from "docx";

new Paragraph({
    children: [
        new ImageRun({
            type: "png",
            data: fs.readFileSync("./image.png"),
            transformation: {
                width: 200,
                height: 200,
            },
        }),
    ],
});
```

See the [Images guide](usage/images.md) for positioning and wrapping options.

## Export Options

### Node.js - Save to File

```ts
import * as fs from "fs";

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("document.docx", buffer);
});
```

### Node.js - Stream

```ts
import * as fs from "fs";

Packer.toStream(doc).then((stream) => {
    stream.pipe(fs.createWriteStream("document.docx"));
});
```

### Browser - Download

```ts
import { saveAs } from "file-saver";

Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "document.docx");
});
```

### Base64 String

```ts
Packer.toBase64String(doc).then((base64) => {
    console.log(base64);
});
```

See the [Packers guide](usage/packers.md) for all export options.

## Next Steps

Now that you've created your first document, explore these guides:

- **[Document](usage/document.md)** - Document properties and settings
- **[Sections](usage/sections.md)** - Page layouts and breaks
- **[Paragraph](usage/paragraph.md)** - Text formatting and alignment
- **[Tables](usage/tables.md)** - Complex table layouts
- **[Images](usage/images.md)** - Image positioning and wrapping
- **[Headers & Footers](usage/headers-and-footers.md)** - Page headers and footers
- **[Styling](usage/styling-with-js.md)** - Reusable styles

?> Check out the [demo folder](https://github.com/dolanmiu/docx/tree/master/demo) for 90+ working examples covering every feature.
