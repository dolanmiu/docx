// Example of how to add images to the document - You can use Buffers, UInt8Arrays or Base64 strings
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World");
doc.addParagraph(paragraph);

doc.createImage(fs.readFileSync("./demo/images/image1.jpeg"));
doc.createImage(fs.readFileSync("./demo/images/dog.png").toString("base64"));
doc.createImage(fs.readFileSync("./demo/images/cat.jpg"));
doc.createImage(fs.readFileSync("./demo/images/parrots.bmp"));
doc.createImage(fs.readFileSync("./demo/images/pizza.gif"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
