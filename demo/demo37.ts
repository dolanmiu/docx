// Add images to header and footer
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Media, Packer } from "../build";

const doc = new Document();
const image = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));
doc.createParagraph("Hello World");

doc.Header.addImage(image);
doc.Header.createImage(fs.readFileSync("./demo/images/pizza.gif"));
doc.Header.createImage(fs.readFileSync("./demo/images/image1.jpeg"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
