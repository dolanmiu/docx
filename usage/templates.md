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

### TABLE_ROWS Type

Use `PatchType.TABLE_ROWS` to fill a table designed in the template with any number of rows. The table keeps its look, such as its header, borders and shading, and each row of data gets its own copy of the template's row.

The row to repeat holds the patch's fields: placeholders made of the patch's key, a dot and the field's name, such as `{{items.name}}` and `{{items.price}}` for the patch `items`. Each of `rows` gives the patches for one copy, by the name of the field they patch. A field's patch is a `PARAGRAPH` or `DOCUMENT` patch, as above.

```ts live
import * as fs from "fs";
import { Document, IPatch, Packer, Paragraph, patchDocument, PatchType, ShadingType, Table, TableCell, TableRow, TextRun } from "docx";

// The template, made here as it would be in Word: a header, and a row with the fields
const header = (text: string) =>
    new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "1F4E79" },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })] })],
    });

const template = new Document({
    sections: [
        {
            children: [
                new Table({
                    columnWidths: [4000, 2000],
                    rows: [
                        new TableRow({ tableHeader: true, children: [header("Fruit"), header("Price")] }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("{{items.name}}")] }),
                                new TableCell({ children: [new Paragraph("£{{items.price}}")] }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});

const text = (value: string): IPatch => ({ type: PatchType.PARAGRAPH, children: [new TextRun(value)] });

const doc = await patchDocument({
    outputType: "nodebuffer",
    data: await Packer.toBuffer(template), // or fs.readFileSync("template.docx")
    patches: {
        items: {
            type: PatchType.TABLE_ROWS,
            rows: [
                { name: text("Apples"), price: text("0.40") },
                { name: text("Pears"), price: text("0.55") },
                { name: text("Figs"), price: text("0.30") },
            ],
        },
    },
});

fs.writeFileSync("My Document.docx", doc);
```

- **Other placeholders**: The rows are repeated before the other patches are applied, so a placeholder of another patch in the repeated row, such as `{{currency}}`, is patched in every copy.
- **More than one row for each item**: Rows next to each other that hold the fields are repeated together, such as a row for an item and a row under it for its notes.
- **Missing fields**: A field that a row has no patch for, or whose patch is `undefined`, is left empty.
- **No rows**: With no rows, the rows are removed and the rest of the table, such as its header, is kept. A table left with no rows at all is removed.
- **Tables in tables**: A field's patch can be a `TABLE_ROWS` patch too, to repeat rows of a table in the repeated row. Its fields are then such as `{{orders.items.name}}`. When they are in the repeated row itself, rather than in a table in it, the row is repeated for each item, with its order's fields, and an order without items has no row.
- **Bookmarks and ids**: Like content pasted in Word, only the first copy keeps the row's bookmarks, and the ids Word gives its paragraphs, rows and content controls, as these must be unique in a document.

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
const cell = (text: string) => new TableCell({ children: [new Paragraph(text)] });
const template = new Document({
    sections: [
        {
            children: [
                new Paragraph("Invoice {{invoice_number}}"),
                new Paragraph("Date: {{invoice_date}}"),
                new Paragraph("Bill to: {{customer_name}}"),
                new Table({
                    rows: [
                        new TableRow({ tableHeader: true, children: [cell("Item"), cell("Qty"), cell("Price")] }),
                        new TableRow({
                            children: [cell("{{line_items.name}}"), cell("{{line_items.qty}}"), cell("${{line_items.price}}")],
                        }),
                    ],
                }),
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
            type: PatchType.TABLE_ROWS,
            rows: invoice.items.map((item) => ({
                name: { type: PatchType.PARAGRAPH, children: [new TextRun(item.name)] },
                qty: { type: PatchType.PARAGRAPH, children: [new TextRun(String(item.qty))] },
                price: { type: PatchType.PARAGRAPH, children: [new TextRun(item.price.toFixed(2))] },
            })),
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
