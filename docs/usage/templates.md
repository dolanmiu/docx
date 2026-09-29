# Templates

Templates allow you to modify existing Word documents by replacing placeholder text with dynamic content. This is useful for generating documents from pre-designed layouts.

!> For detailed information on the `patchDocument` function, see the [Patcher](usage/patcher.md) guide.

## Overview

The template workflow consists of:

1. Create a Word document (.docx) with placeholder tags like `{{placeholder}}`
2. Use `patchDocument` to replace the placeholders with content
3. Export the modified document

## Creating a Template

Open your Word processor and create a document with placeholders:

```
Dear {{customer_name}},

Thank you for your order #{{order_number}}.

Your items will ship on {{ship_date}}.

Best regards,
{{company_name}}
```

?> Use double curly braces `{{}}` for placeholders. These will be replaced at runtime.

## Basic Usage

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph, patchDocument, PatchType, TextRun } from "docx";

// The template, made here as it would be in Word
const template = new Document({
    sections: [
        {
            children: [
                new Paragraph("Dear {{customer_name}},"),
                new Paragraph("Thank you for your order #{{order_number}}."),
                new Paragraph("Your items will ship on {{ship_date}}."),
                new Paragraph("Best regards,"),
                new Paragraph("{{company_name}}"),
            ],
        },
    ],
});

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: await Packer.toBuffer(template), // or fs.readFileSync("template.docx")
    patches: {
        customer_name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("John Smith")],
        },
        order_number: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("12345")],
        },
        ship_date: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("January 15, 2024")],
        },
        company_name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Acme Corp")],
        },
    },
});

fs.writeFileSync("output.docx", doc);
```

## Patch Types

The examples below patch [simple-template.docx](https://github.com/dolanmiu/docx/blob/master/demo/assets/simple-template.docx), which has placeholders such as `{{name}}`, `{{paragraph_replace}}` and `{{table}}`.

### PARAGRAPH Type

Use `PatchType.PARAGRAPH` to replace with inline content (TextRun, images, hyperlinks):

```ts live
import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Hello "), new TextRun({ text: "World", bold: true })],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

### DOCUMENT Type

Use `PatchType.DOCUMENT` to replace with block-level content (paragraphs, tables):

```ts live
import * as fs from "fs";
import { Paragraph, patchDocument, PatchType, Table, TableCell, TableRow } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph("First paragraph"),
                new Paragraph("Second paragraph"),
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("First cell")] }),
                                new TableCell({ children: [new Paragraph("Second cell")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

## Advanced Patches

### Images

```ts live
import * as fs from "fs";
import { ImageRun, patchDocument, PatchType } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        image_test: {
            type: PatchType.PARAGRAPH,
            children: [
                new ImageRun({
                    type: "png",
                    data: fs.readFileSync("./demo/assets/images/dog.png"),
                    transformation: { width: 100, height: 90 },
                }),
            ],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

### Hyperlinks

```ts live
import * as fs from "fs";
import { ExternalHyperlink, patchDocument, PatchType, TextRun } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        item_1: {
            type: PatchType.PARAGRAPH,
            children: [
                new ExternalHyperlink({
                    children: [
                        new TextRun({
                            text: "Visit our website",
                            style: "Hyperlink",
                        }),
                    ],
                    link: "https://example.com",
                }),
            ],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

### Tables

```ts live
import * as fs from "fs";
import { Paragraph, patchDocument, PatchType, Table, TableCell, TableRow } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        table: {
            type: PatchType.DOCUMENT,
            children: [
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Item")] }),
                                new TableCell({ children: [new Paragraph("Price")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Widget")] }),
                                new TableCell({ children: [new Paragraph("$9.99")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

### Footnotes and endnotes

A patch refers to a footnote with a `FootnoteReferenceRun`, and the footnotes go in `footnotes`, as they do in a `Document` (see [Footnotes](usage/footnotes.md)). Endnotes work the same way, with `EndnoteReferenceRun` and `endnotes`:

```ts live
import * as fs from "fs";
import { EndnoteReferenceRun, FootnoteReferenceRun, Paragraph, patchDocument, PatchType, TextRun } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("John Doe"), new FootnoteReferenceRun(1)],
        },
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph({
                    children: [new TextRun("The report is due on Friday."), new EndnoteReferenceRun(1)],
                }),
            ],
        },
    },
    footnotes: {
        1: { children: [new Paragraph("Our new head of sales.")] },
    },
    endnotes: {
        1: { children: [new Paragraph("Send it to the whole team.")] },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

The ids only link each reference to its note. In the patched document, each note is given an id that none of the template's own notes have, and Word numbers the notes in the order they appear. Each reference a patch inserts gets a note of its own, so a placeholder that is in the template twice gets two. Only the notes that a patch refers to are written.

A template that has no footnotes or endnotes yet is given what they need, including the styles that show their numbers as superscript.

## Preserving Styles

Set `keepOriginalStyles: true` to preserve the formatting of the placeholder text:

```ts live
import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template-3.docx"),
    keepOriginalStyles: true, // Preserve template formatting
    patches: {
        salutation: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Mr.")],
        },
        "first-name": {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("John")],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

## Headers and Footers

Placeholders in headers and footers are also replaced:

```ts live
import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "docx";

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("./demo/assets/simple-template.docx"),
    patches: {
        header_adjective: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("great header")],
        },
        footer_text: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Confidential")],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

## Complete Example

Invoice template:

```ts live
import * as fs from "fs";
import { Document, Packer, Paragraph, patchDocument, PatchType, Table, TableCell, TableRow, TextRun } from "docx";

// Invoice data
const invoice = {
    number: "INV-2024-001",
    date: "January 10, 2024",
    customer: "Acme Corporation",
    items: [
        { name: "Widget A", qty: 5, price: 10.0 },
        { name: "Widget B", qty: 3, price: 15.0 },
    ],
    total: 95.0,
};

// The template, made here as it would be in Word
const template = new Document({
    sections: [
        {
            children: [
                new Paragraph("Invoice {{invoice_number}}"),
                new Paragraph("Date: {{invoice_date}}"),
                new Paragraph("Bill to: {{customer_name}}"),
                new Paragraph("{{line_items}}"),
                new Paragraph("Total: {{total}}"),
            ],
        },
    ],
});

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: await Packer.toBuffer(template), // or fs.readFileSync("invoice-template.docx")
    patches: {
        invoice_number: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun(invoice.number)],
        },
        invoice_date: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun(invoice.date)],
        },
        customer_name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun(invoice.customer)],
        },
        line_items: {
            type: PatchType.DOCUMENT,
            children: [
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Item")] }),
                                new TableCell({ children: [new Paragraph("Qty")] }),
                                new TableCell({ children: [new Paragraph("Price")] }),
                            ],
                        }),
                        ...invoice.items.map(
                            (item) =>
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(item.name)] }),
                                        new TableCell({ children: [new Paragraph(String(item.qty))] }),
                                        new TableCell({ children: [new Paragraph(`$${item.price.toFixed(2)}`)] }),
                                    ],
                                }),
                        ),
                    ],
                }),
            ],
        },
        total: {
            type: PatchType.PARAGRAPH,
            children: [
                new TextRun({
                    text: `$${invoice.total.toFixed(2)}`,
                    bold: true,
                }),
            ],
        },
    },
});

fs.writeFileSync("invoice-output.docx", doc);
```

## Tips

- **Placeholder naming**: Use descriptive names like `customer_name` instead of `x1`
- **Testing**: Open the template in Word to verify placeholders are formatted as plain text
- **Complex layouts**: Design the layout in Word, then add placeholders where content varies
- **Reusable templates**: Store templates in a dedicated folder for easy access

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/templates/patch-document.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/templates/patch-document.ts_
