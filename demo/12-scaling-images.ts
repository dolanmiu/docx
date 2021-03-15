// Scaling images
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Media, Packer, Paragraph } from "../build";

const doc = new Document();

const image = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 50,
        height: 50,
    },
});
const image2 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 100,
        height: 100,
    },
});
const image3 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 250,
        height: 250,
    },
});
const image4 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 400,
        height: 400,
    },
});

doc.addSection({
    children: [new Paragraph("Hello World"), new Paragraph(image), new Paragraph(image2), new Paragraph(image3), new Paragraph(image4)],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
