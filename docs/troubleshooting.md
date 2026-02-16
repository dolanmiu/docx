# Troubleshooting

This guide covers common issues and their solutions when working with docx.

## Quick Index

| Symptom                  | Go to                                      |
| ------------------------ | ------------------------------------------ |
| File corrupt/won't open  | [Document Won't Open](#document-wont-open) |
| Images appear blank      | [Images Not Showing](#images-not-showing)  |
| Buffer not defined error | [Browser Issues](#browser-issues)          |
| Table cells misaligned   | [Table Issues](#table-issues)              |
| Styles not applying      | [Styling Issues](#styling-issues)          |
| Memory errors            | [Memory Issues](#memory-issues)            |

## Document Won't Open

### "The file is corrupt and cannot be opened"

**Cause:** The document was not written correctly, often due to not waiting for the document to finish generating.

**Solutions:**

1. Ensure you're using `await` or `.then()` with `Packer` methods:

```ts
// Correct - using await
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync("document.docx", buffer);

// Correct - using .then()
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("document.docx", buffer);
});

// Wrong - missing await
const buffer = Packer.toBuffer(doc); // Returns a Promise, not a buffer!
fs.writeFileSync("document.docx", buffer);
```

2. In Express.js, ensure the response completes:

```ts
app.get("/download", async (req, res) => {
    const doc = new Document({
        /* ... */
    });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=document.docx");
    res.send(buffer);
});
```

### "We're sorry. We can't open document.docx"

**Cause:** Invalid XML structure in the document.

**Solutions:**

1. Check for invalid characters in text content:

```ts
// Remove control characters
const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
new TextRun(cleanText);
```

2. Ensure all required properties are provided:

```ts
// ImageRun requires type, data, and transformation
new ImageRun({
    type: "png",
    data: buffer,
    transformation: { width: 100, height: 100 }, // Required!
});
```

## Images Not Showing

### Image appears as blank or broken

**Cause:** Incorrect image data or type.

**Solutions:**

1. Verify the image type matches the file:

```ts
// Match type to actual file format
new ImageRun({
    type: "png", // Must match the actual image format
    data: fs.readFileSync("image.png"),
    transformation: { width: 100, height: 100 },
});
```

2. In browsers, ensure proper data conversion:

```ts
// Convert fetch response to ArrayBuffer
const response = await fetch(imageUrl);
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

new ImageRun({
    type: "png",
    data: buffer,
    transformation: { width: 100, height: 100 },
});
```

3. Check image dimensions are specified:

```ts
// Both width and height are required
transformation: {
    width: 100,   // Required
    height: 100,  // Required
}
```

## Browser Issues

### "Buffer is not defined"

**Cause:** Node.js `Buffer` is not available in browsers.

**Solutions:**

1. Use a polyfill (a library that provides missing browser functionality) like `buffer`:

```ts
import { Buffer } from "buffer";
window.Buffer = Buffer;
```

2. Or configure your bundler (Webpack/Vite) to include polyfills

3. For Vite, use `vite-plugin-node-polyfills`

### Blob download not working

**Cause:** Incorrect blob handling.

**Solution:**

```ts
import { saveAs } from "file-saver";

Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "document.docx");
});
```

## Table Issues

### Table cells not aligning

**Cause:** Missing or inconsistent column widths.

**Solution:**

```ts
new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph("Cell 1")],
                }),
                new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph("Cell 2")],
                }),
            ],
        }),
    ],
});
```

### Merged cells not working

**Cause:** Incorrect merge configuration.

**Solution:**

```ts
// Horizontal merge
new TableCell({
    columnSpan: 2,  // Span 2 columns
    children: [new Paragraph("Merged horizontally")],
}),

// Vertical merge
new TableCell({
    rowSpan: 2,  // Span 2 rows
    children: [new Paragraph("Merged vertically")],
}),
```

## Styling Issues

### Styles not applying

**Cause:** Style not defined in the document styles.

**Solution:**

```ts
const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "MyStyle",
                name: "My Custom Style",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    bold: true,
                    color: "FF0000",
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Styled text",
                    style: "MyStyle", // Reference by id
                }),
            ],
        },
    ],
});
```

### Font not displaying

**Cause:** Font not available on the target system.

**Solution:** Embed the font:

```ts
import { CharacterSet, Document } from "docx";

const doc = new Document({
    fonts: [
        {
            name: "CustomFont",
            data: fs.readFileSync("./font.ttf"),
            characterSet: CharacterSet.ANSI,
        },
    ],
    // ...
});
```

## Headers and Footers

### Header/footer not appearing on all pages

**Cause:** Multiple sections with different headers.

**Solution:**

```ts
// Apply headers to each section
sections: [
    {
        headers: { default: myHeader },
        footers: { default: myFooter },
        children: [
            /* ... */
        ],
    },
    {
        // New section inherits headers unless overridden
        headers: { default: myHeader }, // Repeat if needed
        footers: { default: myFooter },
        children: [
            /* ... */
        ],
    },
];
```

### Different first page header not working

**Cause:** Missing `titlePage` property.

**Solution:**

```ts
sections: [
    {
        properties: {
            titlePage: true, // Required for different first page
        },
        headers: {
            default: normalHeader,
            first: firstPageHeader, // Only shows with titlePage: true
        },
        children: [
            /* ... */
        ],
    },
];
```

## Page Numbers

### Page numbers not updating

**Cause:** Page numbers are fields that update when the document opens.

**Note:** This is expected behavior. Page numbers will update when opened in Word.

### Page X of Y not working

**Solution:**

```ts
import { PageNumber, NumberFormat } from "docx";

new Paragraph({
    children: [
        new TextRun("Page "),
        new TextRun({
            children: [PageNumber.CURRENT],
        }),
        new TextRun(" of "),
        new TextRun({
            children: [PageNumber.TOTAL_PAGES],
        }),
    ],
});
```

## Table of Contents

### TOC shows "Update this table"

**Cause:** TOC fields need updating in Word.

**Solution:**

1. Set `updateFields: true` in document features:

```ts
const doc = new Document({
    features: {
        updateFields: true,
    },
    // ...
});
```

2. When opening in Word, right-click the TOC and select "Update Field"

## Memory Issues

### "JavaScript heap out of memory"

**Cause:** Processing very large documents or many images.

**Solutions:**

1. Increase Node.js memory:

```bash
node --max-old-space-size=4096 script.js
```

2. Process images before embedding:

```ts
// Resize images before adding to document
const sharp = require("sharp");
const resized = await sharp(imagePath).resize(800, 600).toBuffer();
```

3. Generate documents in batches

## TypeScript Errors

### "Property does not exist on type"

**Cause:** Using incorrect property names or types.

**Solution:** Check the API documentation or TypeScript definitions:

```ts
// Use IntelliSense to see available options
new Paragraph({
    // Ctrl+Space in VS Code to see options
});
```

## Getting Help

If you can't find a solution here:

1. Check the [Demo files](https://github.com/dolanmiu/docx/tree/master/demo) for working examples
2. Search [GitHub Issues](https://github.com/dolanmiu/docx/issues) for similar problems
3. Open a new issue with:
    - docx version number
    - Node.js version
    - Minimal reproducible code example
    - Expected vs actual behavior
