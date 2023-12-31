// Example of how to add images to the document - You can use Buffers, UInt8Arrays or Base64 strings

import * as fs from "fs";
import {
    convertMillimetersToTwip,
    Document,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    Paragraph,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
} from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Hello World"),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "jpg",
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
                            type: "png",
                            data: fs.readFileSync("./demo/images/dog.png").toString("base64"),
                            transformation: {
                                width: 100,
                                height: 100,
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "FF0000",
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "jpg",
                            data: fs.readFileSync("./demo/images/cat.jpg"),
                            transformation: {
                                width: 100,
                                height: 100,
                                flip: {
                                    vertical: true,
                                },
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "0000FF",
                                width: convertMillimetersToTwip(600),
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "bmp",
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
                            type: "gif",
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
                            type: "gif",
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
                            type: "jpg",
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
                new Paragraph({
                    children: [
                        new ImageRun({
                            type: "svg",
                            data: fs.readFileSync("./demo/images/linux-svg.svg"),
                            transformation: {
                                width: 200,
                                height: 200,
                            },
                            fallback: {
                                type: "png",
                                data: fs.readFileSync("./demo/images/linux-png.png"),
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
