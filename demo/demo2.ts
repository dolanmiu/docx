// Example on how to customise the look at feel using Styles
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer } from "../build";

const doc = new Document({
    creator: "Clippy",
    title: "Sample Document",
    description: "A brief example of using docx",
});

doc.Styles.createParagraphStyle("Heading1", "Heading 1")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .size(28)
    .bold()
    .italics()
    .spacing({ after: 120 });

doc.Styles.createParagraphStyle("Heading2", "Heading 2")
    .basedOn("Normal")
    .next("Normal")
    .quickFormat()
    .size(26)
    .bold()
    .underline("double", "FF0000")
    .spacing({ before: 240, after: 120 });

doc.Styles.createParagraphStyle("aside", "Aside")
    .basedOn("Normal")
    .next("Normal")
    .color("999999")
    .italics()
    .indent({ left: 720 })
    .spacing({ line: 276 });

doc.Styles.createParagraphStyle("wellSpaced", "Well Spaced")
    .basedOn("Normal")
    .spacing({ line: 276, before: 20 * 72 * 0.1, after: 20 * 72 * 0.05 });

doc.Styles.createParagraphStyle("ListParagraph", "List Paragraph")
    .quickFormat()
    .basedOn("Normal");

const numberedAbstract = doc.Numbering.createAbstractNumbering();
numberedAbstract.createLevel(0, "lowerLetter", "%1)", "left");

doc.createParagraph("Test heading1, bold and italicized").heading1();
doc.createParagraph("Some simple content");
doc.createParagraph("Test heading2 with double red underline").heading2();

const letterNumbering = doc.Numbering.createConcreteNumbering(numberedAbstract);
const letterNumbering5 = doc.Numbering.createConcreteNumbering(numberedAbstract);
letterNumbering5.overrideLevel(0, 5);

doc.createParagraph("Option1").setNumbering(letterNumbering, 0);
doc.createParagraph("Option5 -- override 2 to 5").setNumbering(letterNumbering5, 0);
doc.createParagraph("Option3").setNumbering(letterNumbering, 0);

doc
    .createParagraph()
    .createTextRun("Some monospaced content")
    .font("Monospace");

doc.createParagraph("An aside, in light gray italics and indented").style("aside");
doc.createParagraph("This is normal, but well-spaced text").style("wellSpaced");
const para = doc.createParagraph();
para.createTextRun("This is a bold run,").bold();
para.createTextRun(" switching to normal ");
para.createTextRun("and then underlined ").underline();
para.createTextRun("and back to normal.");

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
