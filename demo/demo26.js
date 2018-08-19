/*
 * Creates two paragraphs, one with a border and one without
 */

const docx = require("../build");

let doc = new docx.Document();

let paragraph = new docx.Paragraph("No border!");

doc.addParagraph(paragraph);

let borderParagraph = new docx.Paragraph("I have borders on my top and bottom sides!").createBorder();
borderParagraph.Borders.addTopBorder();
borderParagraph.Borders.addBottomBorder();

doc.addParagraph(borderParagraph);

let exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');