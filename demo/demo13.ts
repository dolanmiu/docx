// This example shows 3 styles using XML styles
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const styles = fs.readFileSync("./demo/assets/custom-styles.xml", "utf-8");
const doc = new Document({
    title: "Title",
    externalStyles: styles,
});

doc.createParagraph("Cool Heading Text").heading1();

const paragraph = new Paragraph('This is a custom named style from the template "MyFancyStyle"');
paragraph.style("MyFancyStyle");
doc.addParagraph(paragraph);

doc.createParagraph("Some normal text");

doc.createParagraph("MyFancyStyle again").style("MyFancyStyle");
paragraph.style("MyFancyStyle");
doc.addParagraph(paragraph);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
