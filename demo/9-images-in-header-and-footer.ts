// Add images to header and footer
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Footer, Header, Media, Packer, Paragraph } from "../build";

const doc = new Document();

const image1 = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));
const image2 = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph({
                    children: [image1],
                }),
            ],
        }),
    },
    footers: {
        default: new Footer({
            children: [
                new Paragraph({
                    children: [image2],
                }),
            ],
        }),
    },
    children: [new Paragraph("Hello World")],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
