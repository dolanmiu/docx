// Setting styles with JavaScript configuration
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Footer, HeadingLevel, Media, Packer, Paragraph, Table } from "../build";

const doc = new Document();

doc.Styles.createParagraphStyle("Heading1", "Heading 1")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .font("Calibri")
    .size(52)
    .center()
    .bold()
    .color("000000")
    .spacing({ line: 340 })
    .underline("single", "000000");

doc.Styles.createParagraphStyle("Heading2", "Heading 2")
    .basedOn("Normal")
    .next("Normal")
    .font("Calibri")
    .quickFormat()
    .size(26)
    .bold()
    .spacing({ line: 340 });

doc.Styles.createParagraphStyle("Heading3", "Heading 3")
    .basedOn("Normal")
    .next("Normal")
    .font("Calibri")
    .quickFormat()
    .size(26)
    .bold()
    .spacing({ line: 276 });

doc.Styles.createParagraphStyle("Heading4", "Heading 4")
    .basedOn("Normal")
    .next("Normal")
    .justified()
    .font("Calibri")
    .size(26)
    .bold();

doc.Styles.createParagraphStyle("normalPara", "Normal Para")
    .basedOn("Normal")
    .next("Normal")
    .font("Calibri")
    .quickFormat()
    .leftTabStop(453.543307087)
    .maxRightTabStop()
    .size(26)
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("normalPara2", "Normal Para2")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .font("Calibri")
    .size(26)
    .justified()
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("aside", "Aside")
    .basedOn("Normal")
    .next("Normal")
    .color("999999")
    .italics()
    .indent({ left: 720 })
    .spacing({ line: 276 });

doc.Styles.createParagraphStyle("wellSpaced", "Well Spaced")
    .basedOn("Normal")
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("ListParagraph", "List Paragraph")
    .quickFormat()
    .basedOn("Normal");

const image = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));

const table = new Table({
    rows: 4,
    columns: 4,
});
table
    .getRow(0)
    .getCell(0)
    .add(new Paragraph("Pole No."));

const image1 = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));
const image2 = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));

doc.addSection({
    properties: {
        top: 700,
        right: 700,
        bottom: 700,
        left: 700,
    },
    footers: {
        default: new Footer({
            children: [
                new Paragraph({
                    text: "1",
                    style: "normalPara",
                    alignment: AlignmentType.RIGHT,
                }),
            ],
        }),
    },
    children: [
        new Paragraph(image),
        new Paragraph({
            text: "HEADING",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            text: "Ref. :",
            style: "normalPara",
        }),
        new Paragraph({
            text: "Date :",
            style: "normalPara",
        }),
        new Paragraph({
            text: "To,",
            style: "normalPara",
        }),
        new Paragraph({
            text: "The Superindenting Engineer,(O &M)",
            style: "normalPara",
        }),
        new Paragraph({
            text: "Sub : ",
            style: "normalPara",
        }),
        new Paragraph({
            text: "Ref. : ",
            style: "normalPara",
        }),
        new Paragraph({
            text: "Sir,",
            style: "normalPara",
        }),
        new Paragraph({
            text: "BRIEF DESCRIPTION",
            style: "normalPara",
        }),
        table,
        new Paragraph(image1),
        new Paragraph({
            text: "Test",
            style: "normalPara2",
        }),
        new Paragraph(image2),
        new Paragraph({
            text: "Test 2",
            style: "normalPara2",
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
