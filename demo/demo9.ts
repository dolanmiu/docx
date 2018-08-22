// Add images to header and footer
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer } from "../build";

const doc = new Document();

doc.createParagraph("Hello World");

doc.Header.createImage(fs.readFileSync("./demo/images/pizza.gif"));
doc.Footer.createImage(fs.readFileSync("./demo/images/pizza.gif"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
