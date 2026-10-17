// Two lines in one and horizontal in vertical, Word's East Asian typography for runs of text

import * as fs from "fs";
import { Document, Packer, PageTextDirectionType, Paragraph, TextRun, TwoLinesInOneBrackets } from "docx";

const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: { ascii: "Calibri", eastAsia: "SimSun" },
                    size: 32,
                },
            },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("财政部"),
                        new TextRun({ text: "国家税务总局", eastAsianLayout: { twoLinesInOne: true } }),
                        new TextRun("文件"),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("会议"),
                        new TextRun({
                            text: "二〇二六年十月",
                            eastAsianLayout: { twoLinesInOne: true, brackets: TwoLinesInOneBrackets.ROUND },
                        }),
                        new TextRun("纪要"),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("Runs in one group: "),
                        new TextRun({ text: "bold ", bold: true, eastAsianLayout: { twoLinesInOne: true, group: 1 } }),
                        new TextRun({ text: "and italic", italics: true, eastAsianLayout: { twoLinesInOne: true, group: 1 } }),
                    ],
                }),
            ],
        },
        {
            properties: {
                page: { textDirection: PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT },
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun("令和"),
                        new TextRun({ text: "8", eastAsianLayout: { horizontalInVertical: true } }),
                        new TextRun("年"),
                        new TextRun({ text: "10", eastAsianLayout: { horizontalInVertical: true } }),
                        new TextRun("月"),
                        new TextRun({ text: "2026", eastAsianLayout: { horizontalInVertical: true, fitToLine: true } }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
