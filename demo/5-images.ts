// Example of how to add images to the document - You can use Buffers, UInt8Arrays or Base64 strings
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
// import { Document, Packer, Paragraph } from "../build";
import {
    Document,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    Media,
    Packer,
    Paragraph,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
} from "../build";

const doc = new Document();

const image1 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/image1.jpeg"),
    transformation: {
        width: 100,
        height: 100,
    },
});
const image2 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/dog.png").toString("base64"),
    transformation: {
        width: 100,
        height: 100,
    },
});
const image3 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/cat.jpg"),
    transformation: {
        width: 100,
        height: 100,
        flip: {
            vertical: true,
        },
    },
});
const image4 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/parrots.bmp"),
    transformation: {
        width: 150,
        height: 150,
        flip: {
            horizontal: true,
        },
        rotation: 225,
    },
});
const image5 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 200,
        height: 200,
        flip: {
            horizontal: true,
            vertical: true,
        },
    },
});
const image6 = Media.addImage({
    document: doc,
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
});

const image7 = Media.addImage({
    document: doc,
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
});

doc.addSection({
    children: [
        new Paragraph("Hello World"),
        new Paragraph(image1),
        new Paragraph(image2),
        new Paragraph(image3),
        new Paragraph(image4),
        new Paragraph(image5),
        new Paragraph(image6),
        new Paragraph(image7),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
