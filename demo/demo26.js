/*
 * Creates two paragraphs, one with a border and one without
 */

const docx = require("../build");

let doc = new docx.Document();

let paragraph = new docx.Paragraph("No border!");

doc.addParagraph(paragraph);

let borderParagraph = new docx.Paragraph("I have a border on all but one side!");
console.log(borderParagraph.Borders);
borderParagraph.Borders.addTopBorder();
borderParagraph.Borders.addBottomBorder();
borderParagraph.Borders.addLeftBorder();
console.log(borderParagraph.Borders);

doc.addParagraph(borderParagraph);

let exporter = new docx.LocalPacker(doc);
exporter.packPdf('My Document');