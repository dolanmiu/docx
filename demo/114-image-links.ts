// Images that open a web page when clicked (Ctrl+click in Word), and decorative images that screen readers skip.
// See docs/usage/images.md.

import * as fs from "fs";
import { Document, HorizontalPositionRelativeFrom, ImageRun, Packer, Paragraph, TextRun, VerticalPositionRelativeFrom } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Click the parrots to read about them:"),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "bmp",
                            data: fs.readFileSync("./demo/images/parrots.bmp"),
                            transformation: { width: 200, height: 150 },
                            altText: { name: "Parrots", description: "Two parrots on a branch", title: "Parrots" },
                            link: "https://en.wikipedia.org/wiki/Parrot",
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("A decorative image, which screen readers skip: "),
                        new ImageRun({
                            type: "gif",
                            data: fs.readFileSync("./demo/images/pizza.gif"),
                            transformation: { width: 40, height: 40 },
                            decorative: true,
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("A floating image can have a link too."),
                        new ImageRun({
                            type: "png",
                            data: fs.readFileSync("./demo/images/dog.png"),
                            transformation: { width: 100, height: 100 },
                            floating: {
                                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 5000000 },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 1000000 },
                            },
                            altText: { name: "Dog", description: "A dog", title: "Dog" },
                            link: "https://en.wikipedia.org/wiki/Dog",
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
