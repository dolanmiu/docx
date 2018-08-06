const fs = require("fs");
const docx = require("../build");

var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("Foo").bold();
var dateText = new docx.TextRun("Bar").tab().bold();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

var exporter = new docx.LocalPacker(doc);
exporter.packPdf("My Document");
