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

```ts
import * as fs from "fs";
import { patchDocument, PatchType, TextRun } from "docx";

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("template.docx"),
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
}).then((doc) => {
    fs.writeFileSync("output.docx", doc);
});
```

## Patch Types

### PARAGRAPH Type

Use `PatchType.PARAGRAPH` to replace with inline content (TextRun, images, hyperlinks):

```ts
my_patch: {
    type: PatchType.PARAGRAPH,
    children: [
        new TextRun("Hello "),
        new TextRun({ text: "World", bold: true }),
    ],
}
```

### DOCUMENT Type

Use `PatchType.DOCUMENT` to replace with block-level content (paragraphs, tables):

```ts
my_patch: {
    type: PatchType.DOCUMENT,
    children: [
        new Paragraph("First paragraph"),
        new Paragraph("Second paragraph"),
        new Table({
            rows: [/* ... */],
        }),
    ],
}
```

## Advanced Patches

### Images

```ts
import { ImageRun, PatchType } from "docx";

image_placeholder: {
    type: PatchType.PARAGRAPH,
    children: [
        new ImageRun({
            type: "png",
            data: fs.readFileSync("./logo.png"),
            transformation: { width: 100, height: 50 },
        }),
    ],
}
```

### Hyperlinks

```ts
import { ExternalHyperlink, PatchType, TextRun } from "docx";

link_placeholder: {
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
}
```

### Tables

```ts
import { Paragraph, PatchType, Table, TableCell, TableRow } from "docx";

table_placeholder: {
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
}
```

## Preserving Styles

Set `keepOriginalStyles: true` to preserve the formatting of the placeholder text:

```ts
patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("template.docx"),
    keepOriginalStyles: true, // Preserve template formatting
    patches: {
        // ...
    },
});
```

## Headers and Footers

Placeholders in headers and footers are also replaced:

```ts
header_title: {
    type: PatchType.PARAGRAPH,
    children: [new TextRun("Company Report 2024")],
},
footer_text: {
    type: PatchType.PARAGRAPH,
    children: [new TextRun("Confidential")],
}
```

## Complete Example

Invoice template:

```ts
import * as fs from "fs";
import { ExternalHyperlink, ImageRun, Paragraph, patchDocument, PatchType, Table, TableCell, TableRow, TextRun } from "docx";

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

patchDocument({
    outputType: "nodebuffer",
    data: fs.readFileSync("invoice-template.docx"),
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
}).then((doc) => {
    fs.writeFileSync("invoice-output.docx", doc);
});
```

## Tips

- **Placeholder naming**: Use descriptive names like `customer_name` instead of `x1`
- **Testing**: Open the template in Word to verify placeholders are formatted as plain text
- **Complex layouts**: Design the layout in Word, then add placeholders where content varies
- **Reusable templates**: Store templates in a dedicated folder for easy access

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/85-template-document.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/85-template-document.ts_
