// Creates two paragraphs, one with a border and one without
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { File, Packer, Paragraph, StyleLevel, TableOfContents } from "../build";

const doc = new File();

// The first argument is an ID you use to apply the style to paragraphs
// The second argument is a human-friendly name to show in the UI
doc.Styles.createParagraphStyle("MySpectacularStyle", "My Spectacular Style")
    .basedOn("Heading1")
    .next("Heading1")
    .color("990000")
    .italics();

// WordprocessingML docs for TableOfContents can be found here:
// http://officeopenxml.com/WPtableOfContents.php

// Let's define the properties for generate a TOC for heading 1-5 and MySpectacularStyle,
// making the entries be hyperlinks for the paragraph
const toc = new TableOfContents("Summary", {
    hyperlink: true,
    headingStyleRange: "1-5",
    stylesWithLevels: [new StyleLevel("MySpectacularStyle", 1)],
});

doc.addTableOfContents(toc);

doc.addParagraph(new Paragraph("Header #1").heading1().pageBreakBefore());
doc.addParagraph(new Paragraph("I'm a little text very nicely written.'"));

doc.addParagraph(new Paragraph("Header #2").heading1().pageBreakBefore());
doc.addParagraph(new Paragraph("I'm a other text very nicely written.'"));
doc.addParagraph(new Paragraph("Header #2.1").heading2());
doc.addParagraph(new Paragraph("I'm a another text very nicely written.'"));

doc.addParagraph(new Paragraph("My Spectacular Style #1").style("MySpectacularStyle").pageBreakBefore());

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
