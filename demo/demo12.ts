// Scaling images
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World");
doc.addParagraph(paragraph);

const image = doc.createImage(fs.readFileSync("./demo/images/pizza.gif"));
const image2 = doc.createImage(fs.readFileSync("./demo/images/pizza.gif"));
const image3 = doc.createImage(fs.readFileSync("./demo/images/pizza.gif"));
const image4 = doc.createImage(fs.readFileSync("./demo/images/pizza.gif"));

image.scale(0.5);
image2.scale(1);
image3.scale(2.5);
image4.scale(4);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
