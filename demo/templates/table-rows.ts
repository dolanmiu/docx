// Patch a table designed in a template, repeating its row for each item

import * as fs from "fs";
import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    IPatch,
    Packer,
    Paragraph,
    patchDocument,
    PatchType,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

// The template, made here as it would be in Word: a table with a header, a row with the items' fields, and a total
const cell = (text: string, { header = false, alignment = AlignmentType.LEFT } = {}) =>
    new TableCell({
        shading: header ? { type: ShadingType.CLEAR, fill: "1F4E79" } : undefined,
        children: [new Paragraph({ alignment, children: [new TextRun({ text, bold: header, color: header ? "FFFFFF" : undefined })] })],
    });

const template = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Order {{order_number}}" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    columnWidths: [5000, 2000, 2000],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                cell("Item", { header: true }),
                                cell("Quantity", { header: true, alignment: AlignmentType.CENTER }),
                                cell("Price", { header: true, alignment: AlignmentType.RIGHT }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                cell("{{items.name}}"),
                                cell("{{items.quantity}}", { alignment: AlignmentType.CENTER }),
                                cell("{{currency}}{{items.price}}", { alignment: AlignmentType.RIGHT }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    borders: { top: { style: BorderStyle.DOUBLE, size: 6, color: "1F4E79" } },
                                    children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })],
                                }),
                                new TableCell({
                                    borders: { top: { style: BorderStyle.DOUBLE, size: 6, color: "1F4E79" } },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.RIGHT,
                                            children: [new TextRun({ text: "{{currency}}{{total}}", bold: true })],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ spacing: { before: 240 }, text: "Thank you for your order." }),
            ],
        },
    ],
});

const order = {
    number: "1042",
    items: [
        { name: "Apples", quantity: 6, price: 0.4 },
        { name: "Pears", quantity: 4, price: 0.55 },
        { name: "Figs", quantity: 12, price: 0.3 },
    ],
};

const text = (value: string): IPatch => ({ type: PatchType.PARAGRAPH, children: [new TextRun(value)] });
const total = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

Packer.toBuffer(template)
    .then((data) =>
        patchDocument({
            outputType: "nodebuffer",
            data,
            patches: {
                order_number: text(order.number),
                currency: text("£"),
                total: text(total.toFixed(2)),
                // The row with the {{items.…}} fields is copied for each item, and keeps its look
                items: {
                    type: PatchType.TABLE_ROWS,
                    rows: order.items.map((item) => ({
                        name: text(item.name),
                        quantity: text(String(item.quantity)),
                        price: text((item.quantity * item.price).toFixed(2)),
                    })),
                },
            },
        }),
    )
    .then((doc) => {
        fs.writeFileSync("My Document.docx", doc);
    });
