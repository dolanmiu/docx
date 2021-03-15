// Add images to header and footer
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Header, Media, Packer, Paragraph } from "../build";

const doc = new Document();
const image = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/image1.jpeg"),
    transformation: {
        width: 100,
        height: 100,
    },
});
const image1 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/pizza.gif"),
    transformation: {
        width: 100,
        height: 100,
    },
});
const image2 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/image1.jpeg"),
    transformation: {
        width: 100,
        height: 100,
    },
});

doc.addSection({
    headers: {
        default: new Header({
            children: [new Paragraph(image), new Paragraph(image1), new Paragraph(image2)],
        }),
    },
    children: [new Paragraph("Hello World")],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
