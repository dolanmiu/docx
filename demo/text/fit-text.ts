// Fit text, which squeezes or spreads a run's text so that it takes up the width given for it

import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: { ascii: "Calibri", eastAsia: "MS Mincho" },
                    size: 22,
                },
            },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ children: [new TextRun({ text: "Name", fitText: { width: 1440 } }), new TextRun(": Jane Smith")] }),
                new Paragraph({ children: [new TextRun({ text: "Address", fitText: { width: 1440 } }), new TextRun(": 1 Harbour Road")] }),
                new Paragraph({
                    children: [new TextRun({ text: "Telephone number", fitText: { width: 1440 } }), new TextRun(": 01234 567890")],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Date of ", fitText: { width: 1440, group: 1 } }),
                        new TextRun({ text: "birth", bold: true, fitText: { width: 1440, group: 1 } }),
                        new TextRun(": 1 April 1990"),
                    ],
                }),
                new Paragraph(""),
                // Four characters of 11 points wide
                new Paragraph({ children: [new TextRun({ text: "氏名", fitText: { width: "44pt" } }), new TextRun("：山田太郎")] }),
                new Paragraph({ children: [new TextRun({ text: "住所", fitText: { width: "44pt" } }), new TextRun("：東京都千代田区")] }),
                new Paragraph({ children: [new TextRun({ text: "電話番号", fitText: { width: "44pt" } }), new TextRun("：03-1234-5678")] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
