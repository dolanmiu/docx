// Multiple sections and headers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Footer, Header, Packer, PageNumber, PageNumberFormat, PageOrientation, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    children: [new Paragraph("Hello World")],
});

doc.addSection({
    headers: {
        default: new Header({
            children: [new Paragraph("First Default Header on another page")],
        }),
    },
    footers: {
        default: new Footer({
            children: [new Paragraph("Footer on another page")],
        }),
    },
    properties: {
        pageNumberStart: 1,
        pageNumberFormatType: PageNumberFormat.DECIMAL,
    },
    children: [new Paragraph("hello")],
});

doc.addSection({
    headers: {
        default: new Header({
            children: [new Paragraph("Second Default Header on another page")],
        }),
    },
    footers: {
        default: new Footer({
            children: [new Paragraph("Footer on another page")],
        }),
    },
    size: {
        orientation: PageOrientation.LANDSCAPE,
    },
    properties: {
        pageNumberStart: 1,
        pageNumberFormatType: PageNumberFormat.DECIMAL,
    },
    children: [new Paragraph("hello in landscape")],
});

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Page number: ", PageNumber.CURRENT],
                        }),
                    ],
                }),
            ],
        }),
    },
    size: {
        orientation: PageOrientation.PORTRAIT,
    },
    children: [new Paragraph("Page number in the header must be 2, because it continues from the previous section.")],
});

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Page number: ", PageNumber.CURRENT],
                        }),
                    ],
                }),
            ],
        }),
    },
    properties: {
        pageNumberFormatType: PageNumberFormat.UPPER_ROMAN,
        orientation: PageOrientation.PORTRAIT,
    },
    children: [
        new Paragraph(
            "Page number in the header must be III, because it continues from the previous section, but is defined as upper roman.",
        ),
    ],
});

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Page number: ", PageNumber.CURRENT],
                        }),
                    ],
                }),
            ],
        }),
    },
    size: {
        orientation: PageOrientation.PORTRAIT,
    },
    properties: {
        pageNumberFormatType: PageNumberFormat.DECIMAL,
        pageNumberStart: 25,
    },
    children: [
        new Paragraph("Page number in the header must be 25, because it is defined to start at 25 and to be decimal in this section."),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
