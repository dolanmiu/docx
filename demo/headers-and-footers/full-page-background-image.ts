// A picture behind the text of every page, with negative margins so the paragraphs holding it don't push the text in

import * as fs from "fs";
import {
    Document,
    Footer,
    Header,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    PageOrientation,
    Paragraph,
    TextRun,
    VerticalPositionRelativeFrom,
} from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    size: { orientation: PageOrientation.LANDSCAPE },
                    margin: {
                        // Negative, so the header's and footer's paragraphs don't push the text in: it starts exactly at the top of
                        // the page, and ends exactly half an inch from the bottom. -0 would be the same as 0
                        top: -1,
                        bottom: -720,
                        // No more than the margins, as LibreOffice doesn't let a header or footer overlap the text
                        header: 0,
                        footer: 360,
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    type: "jpg",
                                    data: fs.readFileSync("./demo/assets/images/image1.jpeg"),
                                    // The size of an A4 page across, in pixels
                                    transformation: { width: 1123, height: 794 },
                                    floating: {
                                        horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                                        verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                                        behindDocument: true,
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph("Footer text")],
                }),
            },
            children: [
                new Paragraph({ children: [new TextRun({ text: "Penguins", bold: true, size: 72 })] }),
                ...Array.from({ length: 60 }, (_, i) => new Paragraph(`Line ${i + 1}, on a page with the picture behind it`)),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
