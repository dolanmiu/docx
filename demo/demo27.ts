import * as fs from "fs";
import { Document, Packer } from "../build";

const doc = new Document();
const myStyles = doc.Styles;

// The first argument is an ID you use to apply the style to paragraphs
// The second argument is a human-friendly name to show in the UI
myStyles.createParagraphStyle("myWonkyStyle", "My Wonky Style")
    .basedOn("Normal")
    .next("Normal")
    .color("990000")
    .italics()
    .indent({left: 720})  // 720 TWIP === 720 / 20 pt === .5 in
    .spacing({line: 276});  // 276 / 240 = 1.15x line spacing

myStyles.createParagraphStyle("Heading2", "Heading 2")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .size(26)  // 26 half-points === 13pt font
    .bold()
    .underline("double", "FF0000")
    .spacing({before: 240, after: 120});  // TWIP for both

doc.createParagraph("Hello").style("myWonkyStyle");
doc.createParagraph("World").heading2(); // Uses the Heading2 style

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
