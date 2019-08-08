// Custom styles using JavaScript configuration
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph } from "../build";

const doc = new Document();

// The first argument is an ID you use to apply the style to paragraphs
// The second argument is a human-friendly name to show in the UI
doc.Styles.createParagraphStyle("myWonkyStyle", "My Wonky Style")
    .basedOn("Normal")
    .next("Normal")
    .color("990000")
    .italics()
    .indent({ left: 720 }) // 720 TWIP === 720 / 20 pt === .5 in
    .spacing({ line: 276 }); // 276 / 240 = 1.15x line spacing

doc.Styles.createParagraphStyle("Heading2", "Heading 2")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .size(26) // 26 half-points === 13pt font
    .bold()
    .underline("double", "FF0000")
    .spacing({ before: 240, after: 120 }); // TWIP for both

doc.addSection({
    children: [
        new Paragraph({
            text: "Hello",
            style: "myWonkyStyle",
        }),
        new Paragraph({
            text: "World",
            heading: HeadingLevel.HEADING_2,
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
