// This example shows 3 styles using XML styles
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph } from "../build";

const styles = fs.readFileSync("./demo/assets/custom-styles.xml", "utf-8");
const doc = new Document({
    title: "Title",
    externalStyles: styles,
});

doc.addSection({
    children: [
        new Paragraph({
            text: "Cool Heading Text",
            heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
            text: 'This is a custom named style from the template "MyFancyStyle"',
            style: "MyFancyStyle",
        }),
        new Paragraph("Some normal text"),
        new Paragraph({
            text: "MyFancyStyle again",
            style: "MyFancyStyle",
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
