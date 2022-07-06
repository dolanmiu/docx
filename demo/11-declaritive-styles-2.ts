// Setting styles with JavaScript configuration
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    AlignmentType,
    convertInchesToTwip,
    Document,
    Footer,
    HeadingLevel,
    ImageRun,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TabStopPosition,
    UnderlineType,
    LevelFormat,
} from "../build";

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

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "ref1",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1)",
                        start: 50,
                    },
                ],
            },
        ],
    },
    styles: {
        default: {
            heading1: {
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
            heading2: {
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    spacing: { line: 340 },
                },
            },
            heading3: {
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    spacing: { line: 276 },
                },
            },
            heading4: {
                run: {
                    font: "Calibri",
                    size: 26,
                    bold: true,
                },
                paragraph: {
                    alignment: AlignmentType.JUSTIFIED,
                },
            },
        },
        paragraphStyles: [
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
                    indent: { left: convertInchesToTwip(0.5) },
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
                id: "numberedPara",
                name: "Numbered Para",
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
                    numbering: {
                        reference: "ref1",
                        instance: 0,
                        level: 0,
                    },
                },
            },
        ],
    },
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        top: 700,
                        right: 700,
                        bottom: 700,
                        left: 700,
                    },
                },
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
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/pizza.gif"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                        }),
                    ],
                }),
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
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/pizza.gif"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    text: "Test",
                    style: "normalPara2",
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/pizza.gif"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    text: "Test 2",
                    style: "normalPara2",
                }),
                new Paragraph({
                    text: "Numbered paragraph that has numbering attached to custom styles",
                    style: "numberedPara",
                }),
                new Paragraph({
                    text: "Numbered para would show up in the styles pane at Word",
                    style: "numberedPara",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
