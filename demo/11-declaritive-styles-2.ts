// Setting styles with JavaScript configuration
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    AlignmentType,
    Document,
    Footer,
    HeadingLevel,
    Media,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TabStopPosition,
    UnderlineType,
} from "../build";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: "Calibri",
                    size: 52,
                    bold: true,
                    color: "000000",
                    underline: {
                        type: UnderlineType.SINGLE,
                        color: "000000",
                    },
                },
                paragraph: {
                    alignment: AlignmentType.CENTER,
                    spacing: { line: 340 },
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    spacing: { line: 340 },
                },
            },
            {
                id: "Heading3",
                name: "Heading 3",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    spacing: { line: 276 },
                },
            },
            {
                id: "Heading4",
                name: "Heading 4",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    alignment: AlignmentType.JUSTIFIED,
                },
            },
            {
                id: "normalPara",
                name: "Normal Para",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                    rightTabStop: TabStopPosition.MAX,
                    leftTabStop: 453.543307087,
                },
            },
            {
                id: "normalPara2",
                name: "Normal Para2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: "Calibri",
                    size: 26,
                },
                paragraph: {
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                },
            },
            {
                id: "aside",
                name: "Aside",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    color: "999999",
                    italics: true,
                },
                paragraph: {
                    spacing: { line: 276 },
                    indent: { left: 720 },
                },
            },
            {
                id: "wellSpaced",
                name: "Well Spaced",
                basedOn: "Normal",
                paragraph: {
                    spacing: { line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 },
                },
            },
            {
                id: "ListParagraph",
                name: "List Paragraph",
                basedOn: "Normal",
                quickFormat: true,
            },
        ],
    },
});

const image = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Test cell 1.")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Test cell 2.")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Test cell 3.")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Test cell 4.")],
                }),
            ],
        }),
    ],
});

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
