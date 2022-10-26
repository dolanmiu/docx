// Example of how to add images to the document - You can use Buffers, UInt8Arrays or Base64 strings
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    Document,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    Paragraph,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
} from "../build";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Hello World"),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/image1.jpeg"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                            altText: {
                                title: "This is an ultimate title",
                                description: "This is an ultimate image",
                                name: "My Ultimate Image",
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/dog.png").toString("base64"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/cat.jpg"),
                            transformation: {
                                width: 100,
                                height: 100,
                                flip: {
                                    vertical: true,
                                },
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/parrots.bmp"),
                            transformation: {
                                width: 150,
                                height: 150,
                                flip: {
                                    horizontal: true,
                                },
                                rotation: 225,
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/pizza.gif"),
                            transformation: {
                                width: 200,
                                height: 200,
                                flip: {
                                    horizontal: true,
                                    vertical: true,
                                },
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/pizza.gif"),
                            transformation: {
                                width: 200,
                                height: 200,
                                rotation: 45,
                            },
                            floating: {
                                zIndex: 10,
                                horizontalPosition: {
                                    offset: 1014400,
                                },
                                verticalPosition: {
                                    offset: 1014400,
                                },
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync("./demo/images/cat.jpg"),
                            transformation: {
                                width: 200,
                                height: 200,
                            },
                            floating: {
                                zIndex: 5,
                                horizontalPosition: {
                                    relative: HorizontalPositionRelativeFrom.PAGE,
                                    align: HorizontalPositionAlign.RIGHT,
                                },
                                verticalPosition: {
                                    relative: VerticalPositionRelativeFrom.PAGE,
                                    align: VerticalPositionAlign.BOTTOM,
                                },
                            },
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
