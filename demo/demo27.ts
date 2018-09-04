// Creates two paragraphs, one with a border and one without
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TableOfContents } from "../build";

const doc = new Document();

// Creates an table of contents with default properties
const toc = new TableOfContents();

// The class TableOfContents extends Paragraph and can be added as such.
doc.addParagraph(toc)

doc.addParagraph(new Paragraph("Header #1").heading1().pageBreakBefore());
doc.addParagraph(new Paragraph("I'm a little text very nicely written.'"));

doc.addParagraph(new Paragraph("Header #2").heading1().pageBreakBefore());
doc.addParagraph(new Paragraph("I'm a little text very nicely written.'"));
doc.addParagraph(new Paragraph("Header #2.1").heading2());
doc.addParagraph(new Paragraph("I'm a little text very nicely written.'"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
