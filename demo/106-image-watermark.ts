// Add an image watermark behind every page

import * as fs from "fs";
import { Document, Header, ImageWatermark, Packer, PageBreak, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new ImageWatermark({
                                    type: "png",
                                    data: fs.readFileSync("./demo/images/dog.png"),
                                    transformation: {
                                        width: 400,
                                        height: 400,
                                    },
                                    title: "dog",
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph("This section has a washed out picture watermark centred on the page."),
                new Paragraph({ children: [new PageBreak()] }),
                new Paragraph("The watermark repeats on every page of the section because it lives in the header."),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
