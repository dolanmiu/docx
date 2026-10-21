// Captions for a table and a picture, numbered by Word, with cross-references to them and a table of figures
// See docs/usage/captions.md for full documentation.

import * as fs from "fs";
import {
    Bookmark,
    Document,
    HeadingLevel,
    ImageRun,
    NumberedItemReference,
    NumberedItemReferenceFormat,
    Packer,
    PageReference,
    Paragraph,
    SequentialIdentifier,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
} from "docx";

// A caption, with its label and number in a bookmark that cross-references refer to
const caption = (label: string, bookmark: string, title: string): Paragraph =>
    new Paragraph({
        style: "Caption",
        children: [
            new Bookmark({ id: bookmark, children: [new TextRun(`${label} `), new SequentialIdentifier(label)] }),
            new TextRun(`: ${title}`),
        ],
    });

// A reference to a caption's label and number, such as "Table 1", which Word works out when it updates the fields
const reference = (bookmark: string, text: string): NumberedItemReference =>
    new NumberedItemReference(bookmark, text, { referenceFormat: NumberedItemReferenceFormat.NONE });

const row = (cells: readonly string[]): TableRow =>
    new TableRow({ children: cells.map((text) => new TableCell({ children: [new Paragraph(text)] })) });

const doc = new Document({
    features: { updateFields: true },
    sections: [
        {
            children: [
                new Paragraph({ text: "Pizza report", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Tables and figures", heading: HeadingLevel.HEADING_2 }),
                new TableOfContents("Tables", { captionLabelIncludingNumbers: "Table", hyperlink: true }),
                new TableOfContents("Figures", { captionLabelIncludingNumbers: "Figure", hyperlink: true }),
                new Paragraph({ text: "Sales", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({
                    children: [
                        new TextRun("Margherita sold the most ("),
                        reference("salesTable", "Table 1"),
                        new TextRun("), and the special is in "),
                        reference("specialFigure", "Figure 1"),
                        new TextRun(", on page "),
                        new PageReference("specialFigure"),
                        new TextRun("."),
                    ],
                }),
                caption("Table", "salesTable", "Pizzas sold in May"),
                new Table({ rows: [row(["Pizza", "Sold"]), row(["Margherita", "412"]), row(["Pepperoni", "389"])] }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "gif",
                            data: fs.readFileSync("./demo/assets/images/pizza.gif"),
                            transformation: { width: 200, height: 200 },
                        }),
                    ],
                }),
                caption("Figure", "specialFigure", "Today's special"),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
