# Captions and Cross-references

A caption labels and numbers a table, a picture or an equation, such as "Table 1: Results". A cross-reference refers to it from elsewhere in the text, as Word's **References > Insert Caption** and **Insert Cross-reference** do.

## Captions

A caption is a paragraph in the `Caption` style, with its label and a `SequentialIdentifier`, which numbers the captions with the same label, 1, 2, 3 and on. `docx` writes Word's own Caption style, small italic text in the theme's second dark color:

```ts live
import * as fs from "fs";
import { Document, ImageRun, Paragraph, SequentialIdentifier, Table, TableCell, TableRow, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Table "), new SequentialIdentifier("Table"), new TextRun(": Opening hours")],
                }),
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Weekdays")] }),
                                new TableCell({ children: [new Paragraph("9 to 5")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Saturday")] }),
                                new TableCell({ children: [new Paragraph("10 to 2")] }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "gif",
                            data: fs.readFileSync("./demo/assets/images/pizza.gif"),
                            transformation: { width: 200, height: 200 },
                        }),
                    ],
                }),
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Figure "), new SequentialIdentifier("Figure"), new TextRun(": Today's special")],
                }),
            ],
        },
    ],
});
```

A caption can go above or below what it labels.

### Caption numbers

Word works out the numbers when it updates the document's fields, so it asks to update them when it opens the document, and until then the captions have no numbers. To write the numbers with the document, give it `pageNumbers: estimatePageNumbers` from [`docx/layout`](usage/layout.md), which counts them as Word does. Word then opens it without asking:

```ts live
import { Document, Paragraph, SequentialIdentifier, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    sections: [
        {
            children: [
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Figure "), new SequentialIdentifier("Figure"), new TextRun(": Written as Figure 1")],
                }),
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Figure "), new SequentialIdentifier("Figure"), new TextRun(": Written as Figure 2")],
                }),
            ],
        },
    ],
});
```

A `SequentialIdentifier` takes Word's switches after the label, such as `new SequentialIdentifier("Figure \\r 5")` to number from 5 again, or `new SequentialIdentifier("Figure \\s 1")` to number from 1 again after each Heading 1.

### Changing the caption style

Give `caption` in the default styles to change how captions look. It takes the options of any [paragraph style](usage/styling-with-js.md), and its `run` and `paragraph` replace the Caption style's own:

```ts live
import { Document, Paragraph, SequentialIdentifier, TextRun } from "docx";

const doc = new Document({
    styles: {
        default: {
            caption: {
                run: { bold: true, color: "2E74B5", size: 20 },
                paragraph: { spacing: { before: 120, after: 240 } },
            },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Figure "), new SequentialIdentifier("Figure"), new TextRun(": A caption in bold blue")],
                }),
            ],
        },
    ],
});
```

A paragraph style with the id `Caption` in `paragraphStyles`, or in a template's styles (`externalStyles`), takes the place of `docx`'s.

## Cross-references

To refer to a caption, put its label and number in a [bookmark](usage/bookmarks.md), then refer to the bookmark with a `NumberedItemReference` in the `NONE` format, which writes the bookmark's text, such as "Table 2". Give the text the reference shows until Word updates the document's fields, as Word works it out then. A `PageReference` gives the page the caption is on:

```ts live
import {
    Bookmark,
    Document,
    NumberedItemReference,
    NumberedItemReferenceFormat,
    PageReference,
    Paragraph,
    SequentialIdentifier,
    Table,
    TableCell,
    TableRow,
    TextRun,
} from "docx";

const caption = (bookmark: string, title: string): Paragraph =>
    new Paragraph({
        style: "Caption",
        children: [
            new Bookmark({ id: bookmark, children: [new TextRun("Table "), new SequentialIdentifier("Table")] }),
            new TextRun(`: ${title}`),
        ],
    });

const table = (text: string): Table =>
    new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph(text)] })] })] });

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Sales grew in every region ("),
                        new NumberedItemReference("salesTable", "Table 2", { referenceFormat: NumberedItemReferenceFormat.NONE }),
                        new TextRun(", on page "),
                        new PageReference("salesTable"),
                        new TextRun(")."),
                    ],
                }),
                caption("costsTable", "Costs"),
                table("Costs by region"),
                caption("salesTable", "Sales"),
                table("Sales by region"),
            ],
        },
    ],
});
```

The reference is a link to the caption. Give `hyperlink: false` for plain text.

## Table of Figures

A table of contents with `captionLabelIncludingNumbers` lists the captions with a label, with their numbers and pages, as Word's **Insert Table of Figures** does. Word fills it in when it updates the document's fields:

```ts live
import { Document, Paragraph, SequentialIdentifier, TableOfContents, TextRun } from "docx";

const doc = new Document({
    features: { updateFields: true },
    sections: [
        {
            children: [
                new TableOfContents("Figures", { captionLabelIncludingNumbers: "Figure", hyperlink: true }),
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Figure "), new SequentialIdentifier("Figure"), new TextRun(": The first figure")],
                }),
                new Paragraph({
                    style: "Caption",
                    children: [new TextRun("Figure "), new SequentialIdentifier("Figure"), new TextRun(": The second figure")],
                }),
            ],
        },
    ],
});
```

See [Table of Contents](usage/table-of-contents.md) for its other options.

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/fields/captions-and-cross-references.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/fields/captions-and-cross-references.ts_
